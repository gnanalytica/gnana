import { WebSocket } from "ws";

/** Tracks active WebSocket connections per runId */
class ConnectionManager {
  private connections = new Map<string, Set<WebSocket>>();

  add(runId: string, ws: WebSocket): void {
    if (!this.connections.has(runId)) {
      this.connections.set(runId, new Set());
    }
    this.connections.get(runId)!.add(ws);

    ws.on("close", () => {
      this.connections.get(runId)?.delete(ws);
      if (this.connections.get(runId)?.size === 0) {
        this.connections.delete(runId);
      }
    });
  }

  broadcast(runId: string, event: string, data: unknown): void {
    const clients = this.connections.get(runId);
    if (!clients) return;

    const message = JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
    });

    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  getConnectionCount(): number {
    let count = 0;
    for (const clients of this.connections.values()) {
      count += clients.size;
    }
    return count;
  }
}

export const connectionManager = new ConnectionManager();
