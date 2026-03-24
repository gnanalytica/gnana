import * as Sentry from "@sentry/node";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { createDatabase, agents, runs, eq, type Database } from "@gnana/db";
import { createEventBus, type EventBus, type LLMProvider } from "@gnana/core";
import type { RouterConfig } from "@gnana/core";
import { agentRoutes } from "./routes/agents.js";
import { runRoutes } from "./routes/runs.js";
import { connectorRoutes } from "./routes/connectors.js";
import { providerRoutes } from "./routes/providers.js";
import { workspaceRoutes } from "./routes/workspaces.js";
import { apiKeyRoutes } from "./routes/api-keys.js";
import { publicInviteRoutes, protectedInviteRoutes } from "./routes/invites.js";
import { pipelineVersionRoutes } from "./routes/pipeline-versions.js";
import { chatRoutes } from "./routes/chat.js";
import { connectionManager } from "./ws.js";
import { authMiddleware } from "./middleware/auth.js";
import { workspaceMiddleware } from "./middleware/workspace.js";
import { JobQueue } from "./job-queue.js";

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
  const queue = new JobQueue(db);
  const app = createApp(db, events, queue);

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

  // Register the run:execute job handler
  queue.register("run:execute", async (payload) => {
    const { runId, agentId } = payload as {
      runId: string;
      agentId: string;
    };

    // Load agent config from DB
    const agentRows = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);

    const agent = agentRows[0];
    if (!agent) {
      await db
        .update(runs)
        .set({ status: "failed", error: "Agent not found", updatedAt: new Date() })
        .where(eq(runs.id, runId));
      await events.emit("run:failed", { runId, error: "Agent not found" });
      return;
    }

    // Update run status to indicate processing has started
    await db
      .update(runs)
      .set({ status: "analyzing", updatedAt: new Date() })
      .where(eq(runs.id, runId));
    await events.emit("run:started", { runId, agentId });

    // NOTE: Full pipeline execution requires an LLM router and tool executor.
    // For now, mark the run as completed to confirm the job queue works end-to-end.
    // When providers are configured, this handler should build a RunContext or
    // DAGContext and call executePipeline() or executeDAG() from @gnana/core.
    await db
      .update(runs)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(runs.id, runId));
    await events.emit("run:completed", { runId });
  });

  return {
    app,
    db,
    events,
    queue,
    start() {
      const port = config.port ?? 4000;
      queue.start();
      const httpServer = serve({ fetch: app.fetch, port }, (info) => {
        console.log(`Gnana server running on http://localhost:${info.port}`);
      });
      return httpServer;
    },
  };
}

function createApp(db: Database, events: EventBus, queue: JobQueue) {
  const app = new Hono();

  // Middleware
  app.use("*", cors());

  // Public routes (no auth required)
  app.get("/", (c) =>
    c.json({
      name: "Gnana API",
      version: "0.0.1",
      status: "ok",
      docs: "/api",
    }),
  );

  app.get("/health", (c) => c.json({ status: "ok" }));

  // Public invite routes — view invite details without auth
  app.route("/api/invites", publicInviteRoutes(db));

  // Auth-only routes (no workspace middleware) — accepting invites
  const authOnly = new Hono();
  authOnly.use("*", authMiddleware(db));
  authOnly.route("/invites", protectedInviteRoutes(db));
  app.route("/api/auth-actions", authOnly);

  // Sentry error handler
  app.onError((err, c) => {
    Sentry.captureException(err);
    return c.json({ error: "Internal server error" }, 500);
  });

  // Protected API routes — auth + workspace resolution
  const api = new Hono();
  api.use("*", authMiddleware(db));
  api.use("*", workspaceMiddleware(db));

  // Mount route groups
  api.route("/agents", agentRoutes(db));
  api.route("/runs", runRoutes(db, events, queue));
  api.route("/connectors", connectorRoutes(db));
  api.route("/providers", providerRoutes(db));
  api.route("/workspaces", workspaceRoutes(db));
  api.route("/keys", apiKeyRoutes(db));
  api.route("/pipeline-versions", pipelineVersionRoutes(db));
  api.route("/chat", chatRoutes(db));

  app.route("/api", api);

  return app;
}

export { createEventBus } from "@gnana/core";
export { connectionManager } from "./ws.js";
export { JobQueue } from "./job-queue.js";
export type { GnanaServerConfig as ServerConfig };
