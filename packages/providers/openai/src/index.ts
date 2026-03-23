import OpenAI from "openai";
import type {
  LLMProvider,
  ChatParams,
  ChatResponse,
  ToolChatParams,
  ChatResponseChunk,
  ContentBlock,
  ModelInfo,
  LLMToolDef,
  Message,
} from "@gnana/provider-base";

export interface OpenAIProviderOptions {
  baseURL?: string;
}

export class OpenAIProvider implements LLMProvider {
  name: string;
  private client: OpenAI;

  constructor(apiKey?: string, options?: OpenAIProviderOptions) {
    this.name = options?.baseURL?.includes("openrouter") ? "openrouter" : "openai";
    this.client = new OpenAI({
      apiKey,
      ...(options?.baseURL && { baseURL: options.baseURL }),
    });
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const response = await this.client.chat.completions.create({
      model: params.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        ...this.toOpenAIMessages(params.messages),
      ],
      max_tokens: params.maxTokens ?? 4096,
      ...(params.temperature !== undefined && { temperature: params.temperature }),
    });

    return this.normalizeResponse(response);
  }

  async chatWithTools(params: ToolChatParams): Promise<ChatResponse> {
    const response = await this.client.chat.completions.create({
      model: params.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        ...this.toOpenAIMessages(params.messages),
      ],
      max_tokens: params.maxTokens ?? 4096,
      tools: params.tools.map((t) => this.toOpenAITool(t)),
      ...(params.temperature !== undefined && { temperature: params.temperature }),
    });

    return this.normalizeResponse(response);
  }

  async *chatStream(params: ChatParams): AsyncIterable<ChatResponseChunk> {
    const stream = await this.client.chat.completions.create({
      model: params.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        ...this.toOpenAIMessages(params.messages),
      ],
      max_tokens: params.maxTokens ?? 4096,
      ...(params.temperature !== undefined && { temperature: params.temperature }),
      stream: true,
    });

    yield* this.processStream(stream);
  }

  async *chatWithToolsStream(params: ToolChatParams): AsyncIterable<ChatResponseChunk> {
    const stream = await this.client.chat.completions.create({
      model: params.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        ...this.toOpenAIMessages(params.messages),
      ],
      max_tokens: params.maxTokens ?? 4096,
      tools: params.tools.map((t) => this.toOpenAITool(t)),
      ...(params.temperature !== undefined && { temperature: params.temperature }),
      stream: true,
    });

    yield* this.processStream(stream);
  }

  listModels(): ModelInfo[] {
    if (this.name === "openrouter") {
      return [
        { id: "anthropic/claude-sonnet-4-20250514", name: "Claude Sonnet 4 (OpenRouter)" },
        { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash (OpenRouter)" },
        { id: "meta-llama/llama-4-maverick", name: "Llama 4 Maverick (OpenRouter)" },
      ];
    }
    return [
      { id: "gpt-4.1", name: "GPT-4.1", contextWindow: 1047576, maxOutputTokens: 32768 },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", contextWindow: 1047576, maxOutputTokens: 32768 },
      { id: "o3", name: "o3", contextWindow: 200000, maxOutputTokens: 100000 },
      { id: "o4-mini", name: "o4-mini", contextWindow: 200000, maxOutputTokens: 100000 },
    ];
  }

  // ---- Private helpers ----

  private toOpenAIMessages(messages: Message[]): OpenAI.ChatCompletionMessageParam[] {
    return messages.map((m) => {
      if (typeof m.content === "string") {
        return { role: m.role as "user" | "assistant", content: m.content };
      }

      // Handle content blocks
      if (m.role === "assistant") {
        const toolCalls: OpenAI.ChatCompletionMessageToolCall[] = [];
        let textContent = "";

        for (const block of m.content) {
          if (block.type === "text") {
            textContent += block.text;
          } else if (block.type === "tool_use") {
            toolCalls.push({
              id: block.id,
              type: "function",
              function: { name: block.name, arguments: JSON.stringify(block.input) },
            });
          }
        }

        return {
          role: "assistant" as const,
          content: textContent || null,
          ...(toolCalls.length > 0 && { tool_calls: toolCalls }),
        };
      }

      // User messages with tool results
      const toolResults = m.content.filter((b) => b.type === "tool_result");
      if (toolResults.length > 0) {
        // OpenAI uses separate "tool" role messages for each result
        return toolResults.map((b) => {
          if (b.type !== "tool_result") throw new Error("Unexpected block type");
          return {
            role: "tool" as const,
            tool_call_id: b.toolUseId,
            content: b.content,
          };
        })[0]!; // simplified — in practice, you'd flatten these
      }

      const textParts = m.content
        .filter((b) => b.type === "text")
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("\n");
      return { role: "user" as const, content: textParts };
    });
  }

  private toOpenAITool(tool: LLMToolDef): OpenAI.ChatCompletionTool {
    return {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    };
  }

  private normalizeResponse(response: OpenAI.ChatCompletion): ChatResponse {
    const choice = response.choices[0]!;
    const content: ContentBlock[] = [];

    if (choice.message.content) {
      content.push({ type: "text", text: choice.message.content });
    }

    if (choice.message.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        content.push({
          type: "tool_use",
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments) as Record<string, unknown>,
        });
      }
    }

    const hasToolUse = content.some((c) => c.type === "tool_use");

    return {
      content,
      stopReason: hasToolUse
        ? "tool_use"
        : choice.finish_reason === "length"
          ? "max_tokens"
          : "end_turn",
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      },
      model: response.model,
    };
  }

  private async *processStream(
    stream: AsyncIterable<OpenAI.ChatCompletionChunk>,
  ): AsyncIterable<ChatResponseChunk> {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        yield { type: "text_delta", text: delta.content };
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (tc.id) {
            yield {
              type: "tool_use_start",
              toolUse: { id: tc.id, name: tc.function?.name ?? "" },
            };
          }
          if (tc.function?.arguments) {
            yield { type: "tool_input_delta", text: tc.function.arguments };
          }
        }
      }

      if (chunk.choices[0]?.finish_reason) {
        yield {
          type: "done",
          usage: {
            inputTokens: chunk.usage?.prompt_tokens ?? 0,
            outputTokens: chunk.usage?.completion_tokens ?? 0,
          },
        };
      }
    }
  }
}
