import { MCPClient, type MCPClientStatus } from "./client.js";
import type { MCPServerConfig, ToolDefinition } from "@gnana/core";

export interface MCPServerInfo {
  /** Connector ID from database. */
  serverId: string;
  config: MCPServerConfig;
  status: MCPClientStatus;
}

/**
 * Manages multiple MCPClient connections.
 *
 * Each server is identified by a string `serverId` (typically the DB connector ID).
 * The manager owns the lifecycle of every client: start, stop, restart, shutdown.
 */
export class MCPManager {
  private clients = new Map<string, MCPClient>();
  private configs = new Map<string, MCPServerConfig>();

  /** Start a connection to an MCP server. */
  async startServer(serverId: string, config: MCPServerConfig): Promise<void> {
    // Stop existing connection if any
    if (this.clients.has(serverId)) {
      await this.stopServer(serverId);
    }

    const client = new MCPClient(config);
    await client.connect();
    this.clients.set(serverId, client);
    this.configs.set(serverId, config);
  }

  /** Stop and clean up a server connection. */
  async stopServer(serverId: string): Promise<void> {
    const client = this.clients.get(serverId);
    if (client) {
      await client.disconnect();
      this.clients.delete(serverId);
      this.configs.delete(serverId);
    }
  }

  /** Stop + start. */
  async restartServer(serverId: string): Promise<void> {
    const config = this.configs.get(serverId);
    if (!config) {
      throw new Error(`No config found for MCP server ${serverId}`);
    }
    await this.stopServer(serverId);
    await this.startServer(serverId, config);
  }

  /** Get aggregated tools from all connected servers. */
  getTools(): ToolDefinition[] {
    const tools: ToolDefinition[] = [];
    for (const client of this.clients.values()) {
      if (client.isConnected()) {
        tools.push(...client.getTools());
      }
    }
    return tools;
  }

  /** Get tools from a specific server. */
  getServerTools(serverId: string): ToolDefinition[] {
    const client = this.clients.get(serverId);
    if (!client || !client.isConnected()) return [];
    return client.getTools();
  }

  /** Get status of all managed servers. */
  getServerStatuses(): MCPServerInfo[] {
    const result: MCPServerInfo[] = [];
    for (const [serverId, client] of this.clients) {
      const config = this.configs.get(serverId);
      if (config) {
        result.push({
          serverId,
          config,
          status: client.getStatus(),
        });
      }
    }
    return result;
  }

  /** Get status of a single server. */
  getServerStatus(serverId: string): MCPClientStatus | null {
    return this.clients.get(serverId)?.getStatus() ?? null;
  }

  /** Check if a server is registered (connected or not). */
  hasServer(serverId: string): boolean {
    return this.clients.has(serverId);
  }

  /** Disconnect all servers. Call on process shutdown. */
  async shutdown(): Promise<void> {
    const ids = [...this.clients.keys()];
    await Promise.allSettled(ids.map((id) => this.stopServer(id)));
  }
}
