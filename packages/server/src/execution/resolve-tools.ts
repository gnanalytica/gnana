import { createGitHubConnector } from "@gnana/connector-github";
import { createHttpConnector } from "@gnana/connector-http";
import { createSlackConnector } from "@gnana/connector-slack";
import { ToolExecutorImpl } from "@gnana/core";
import type { ToolDefinition, ToolExecutor } from "@gnana/core";
import { connectors, and, inArray, eq, type Database } from "@gnana/db";
import { decryptJson } from "../utils/encryption.js";

export interface ToolsConfig {
  connectors: Array<{ connectorId: string; tools?: string[] }>;
}

/**
 * Resolves a ToolExecutor populated with tools from the requested connectors.
 * Loads connector records from DB, decrypts credentials, calls the appropriate
 * factory, and optionally filters to specific tool names.
 */
export async function resolveTools(
  config: ToolsConfig,
  workspaceId: string,
  db: Database,
): Promise<ToolExecutor> {
  const executor = new ToolExecutorImpl();

  if (!config.connectors || config.connectors.length === 0) {
    return executor;
  }

  // Build a map of connectorId -> requested tool names for quick lookup
  const toolFilterMap = new Map<string, string[] | undefined>();
  for (const entry of config.connectors) {
    toolFilterMap.set(entry.connectorId, entry.tools);
  }

  const connectorIds = config.connectors.map((c) => c.connectorId);

  // Load connector rows from DB, filtered by IDs + workspaceId + enabled
  const rows = await db
    .select()
    .from(connectors)
    .where(
      and(
        inArray(connectors.id, connectorIds),
        eq(connectors.workspaceId, workspaceId),
        eq(connectors.enabled, true),
      ),
    );

  for (const row of rows) {
    const decryptedCredentials = decryptJson(row.credentials);
    const decryptedConfig = decryptJson(row.config);

    let connectorTools: ToolDefinition[] = [];

    switch (row.type) {
      case "github": {
        const creds = decryptedCredentials as Record<string, unknown>;
        connectorTools = createGitHubConnector({
          token: (creds["token"] as string) ?? "",
          owner: (creds["owner"] as string | undefined) ?? undefined,
        }) as unknown as ToolDefinition[];
        break;
      }

      case "slack": {
        const creds = decryptedCredentials as Record<string, unknown>;
        connectorTools = createSlackConnector({
          token: (creds["token"] as string) ?? "",
        }) as unknown as ToolDefinition[];
        break;
      }

      case "http": {
        const cfg = decryptedConfig as Record<string, unknown>;
        const creds = decryptedCredentials as Record<string, unknown> | null;
        connectorTools = createHttpConnector({
          baseUrl: (cfg["baseUrl"] as string) ?? "",
          auth: (creds?.["auth"] ?? cfg["auth"]) as
            | {
                type: "bearer" | "basic" | "api-key";
                token?: string;
                username?: string;
                password?: string;
                headerName?: string;
                apiKey?: string;
              }
            | undefined,
          defaultHeaders: cfg["defaultHeaders"] as Record<string, string> | undefined,
          endpoints: (cfg["endpoints"] as import("@gnana/connector-http").HttpEndpointConfig[]) ?? [],
        }) as unknown as ToolDefinition[];
        break;
      }

      default:
        // Unknown connector type — skip silently
        break;
    }

    // Apply optional tool name filter
    const requestedTools = toolFilterMap.get(row.id);
    if (requestedTools && requestedTools.length > 0) {
      const allowedSet = new Set(requestedTools);
      connectorTools = connectorTools.filter((t) => allowedSet.has(t.name));
    }

    executor.registerTools(connectorTools);
  }

  return executor;
}
