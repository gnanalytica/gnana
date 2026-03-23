import type { LLMToolDef } from "@gnana/provider-base";
import type { ToolDefinition, ToolContext, ToolExecutor as IToolExecutor } from "./types.js";

export class ToolExecutorImpl implements IToolExecutor {
  private tools = new Map<string, ToolDefinition>();

  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  registerTools(tools: ToolDefinition[]): void {
    for (const tool of tools) {
      this.registerTool(tool);
    }
  }

  async execute(toolName: string, input: unknown, ctx?: ToolContext): Promise<string> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    const toolCtx: ToolContext = ctx ?? { runId: "", agentId: "" };
    return tool.handler(input, toolCtx);
  }

  listTools(): LLMToolDef[] {
    return [...this.tools.values()].map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));
  }
}
