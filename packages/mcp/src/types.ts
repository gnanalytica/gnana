import type { MCPServerConfig } from "@gnana/core";

/** Extended config for internal MCP package use. */
export interface MCPServerRecord {
  /** Connector ID from database. */
  id: string;
  /** Workspace that owns this connector. */
  workspaceId: string;
  /** Core MCP config (name, transport, command/url, env). */
  config: MCPServerConfig;
  /** Whether the connector is enabled. */
  enabled: boolean;
}
