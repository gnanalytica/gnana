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

  return {
    app,
    db,
    events,
    start() {
      const port = config.port ?? 4000;
      serve({ fetch: app.fetch, port }, (info) => {
        console.log(`Gnana server running on http://localhost:${info.port}`);
      });
    },
  };
}

function createApp(db: Database, events: EventBus) {
  const app = new Hono();

  // Middleware
  app.use("*", cors());

  // Health check
  app.get("/health", (c) => c.json({ status: "ok" }));

  // API routes
  app.route("/api/agents", agentRoutes(db));
  app.route("/api/runs", runRoutes(db, events));
  app.route("/api/connectors", connectorRoutes(db));
  app.route("/api/providers", providerRoutes(db));

  return app;
}

export { createEventBus } from "@gnana/core";
export type { GnanaServerConfig as ServerConfig };
