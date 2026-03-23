// ---- Message types ----

export type Role = "user" | "assistant";

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: "tool_result";
  toolUseId: string;
  content: string;
  isError?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

export interface Message {
  role: Role;
  content: string | ContentBlock[];
}

// ---- Tool types for LLM ----

export interface LLMToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

// ---- Chat params ----

export interface ChatParams {
  model: string;
  systemPrompt: string;
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
}

export interface ToolChatParams extends ChatParams {
  tools: LLMToolDef[];
}

// ---- Chat response ----

export type StopReason = "end_turn" | "tool_use" | "max_tokens";

export interface ChatResponse {
  content: ContentBlock[];
  stopReason: StopReason;
  usage: TokenUsage;
  model: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

// ---- Streaming ----

export type ChatResponseChunkType =
  | "text_delta"
  | "tool_use_start"
  | "tool_input_delta"
  | "tool_use_end"
  | "done";

export interface ChatResponseChunk {
  type: ChatResponseChunkType;
  text?: string;
  toolUse?: { id: string; name: string; input?: Record<string, unknown> };
  usage?: TokenUsage;
}

// ---- Provider interface ----

export interface ModelInfo {
  id: string;
  name: string;
  contextWindow?: number;
  maxOutputTokens?: number;
}

export interface LLMProvider {
  name: string;
  chat(params: ChatParams): Promise<ChatResponse>;
  chatWithTools(params: ToolChatParams): Promise<ChatResponse>;
  chatStream(params: ChatParams): AsyncIterable<ChatResponseChunk>;
  chatWithToolsStream(params: ToolChatParams): AsyncIterable<ChatResponseChunk>;
  listModels(): ModelInfo[];
}
