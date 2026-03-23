import * as Sentry from "@sentry/node";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { createDatabase, type Database } from "@gnana/db";
import { createEventBus, type EventBus, type LLMProvider } from "@gnana/core";
import type { RouterConfig } from "@gnana/core";
import { agentRoutes } from "./routes/agents.js";
import { runRoutes } from "./routes/runs.js";
import { connectorRoutes } from "./routes/connectors.js";
import { providerRoutes } from "./routes/providers.js";
import { connectionManager } from "./ws.js";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: 1.0,
  });
}

export interface GnanaServerConfig {
  port?: number;
  database: string;
  providers?: Record<string, LLMProvider>;
  defaultRouter?: RouterConfig;
}

export function createGnanaServer(config: GnanaServerConfig) {
  const db = createDatabase(config.database);
  const events = createEventBus();
  const app = createApp(db, events);

  // Bridge event bus to WebSocket connections
  const runEvents = [
    "run:started",
    "run:status_changed",
    "run:analysis_complete",
    "run:plan_complete",
    "run:awaiting_approval",
    "run:approved",
    "run:rejected",
    "run:tool_called",
    "run:tool_result",
    "run:completed",
    "run:failed",
    "run:queued",
    "run:log",
  ];

  for (const eventName of runEvents) {
    events.on(eventName, (data: unknown) => {
      const payload = data as Record<string, unknown>;
      if (payload?.runId && typeof payload.runId === "string") {
        connectionManager.broadcast(payload.runId, eventName, payload);
      }
    });
  }

  return {
    app,
    db,
    events,
    start() {
      const port = config.port ?? 4000;
      const httpServer = serve({ fetch: app.fetch, port }, (info) => {
        console.log(`Gnana server running on http://localhost:${info.port}`);
      });
      return httpServer;
    },
  };
}

function createApp(db: Database, events: EventBus) {
  const app = new Hono();

  // Middleware
  app.use("*", cors());

  // Root route
  app.get("/", (c) =>
    c.json({
      name: "Gnana API",
      version: "0.0.1",
      status: "ok",
      docs: "/api",
    }),
  );

  // Health check
  app.get("/health", (c) => c.json({ status: "ok" }));

  // Sentry error handler
  app.onError((err, c) => {
    Sentry.captureException(err);
    return c.json({ error: "Internal server error" }, 500);
  });

  // API routes
  app.route("/api/agents", agentRoutes(db));
  app.route("/api/runs", runRoutes(db, events));
  app.route("/api/connectors", connectorRoutes(db));
  app.route("/api/providers", providerRoutes(db));

  return app;
}

export { createEventBus } from "@gnana/core";
export { connectionManager } from "./ws.js";
export type { GnanaServerConfig as ServerConfig };
