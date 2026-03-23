import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import type { Database } from "@gnana/db";
import { runs, runLogs } from "@gnana/db";
import type { EventBus } from "@gnana/core";

export function runRoutes(db: Database, events: EventBus) {
  const app = new Hono();

  // List runs
  app.get("/", async (c) => {
    const limit = Number(c.req.query("limit") ?? "50");
    const result = await db.select().from(runs).orderBy(desc(runs.createdAt)).limit(limit);
    return c.json(result);
  });

  // Get run by ID
  app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const result = await db.select().from(runs).where(eq(runs.id, id));
    if (result.length === 0) {
      return c.json({ error: "Run not found" }, 404);
    }
    return c.json(result[0]);
  });

  // Trigger a new run
  app.post("/", async (c) => {
    const body = await c.req.json();
    const result = await db
      .insert(runs)
      .values({
        agentId: body.agentId,
        status: "queued",
        triggerType: body.triggerType ?? "manual",
        triggerData: body.payload ?? {},
        workspaceId: body.workspaceId,
      })
      .returning();
    const run = result[0]!;
    await events.emit("run:queued", { runId: run.id, agentId: run.agentId });
    return c.json(run, 201);
  });

  // Approve run
  app.post("/:id/approve", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const result = await db
      .update(runs)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(runs.id, id))
      .returning();
    if (result.length === 0) {
      return c.json({ error: "Run not found" }, 404);
    }
    await events.emit("run:approved", { runId: id, modifications: body.modifications });
    return c.json(result[0]);
  });

  // Reject run
  app.post("/:id/reject", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const result = await db
      .update(runs)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(runs.id, id))
      .returning();
    if (result.length === 0) {
      return c.json({ error: "Run not found" }, 404);
    }
    await events.emit("run:rejected", { runId: id, reason: body.reason });
    return c.json(result[0]);
  });

  // Cancel run
  app.post("/:id/cancel", async (c) => {
    const id = c.req.param("id");
    const result = await db
      .update(runs)
      .set({ status: "failed", error: "Cancelled by user", updatedAt: new Date() })
      .where(eq(runs.id, id))
      .returning();
    if (result.length === 0) {
      return c.json({ error: "Run not found" }, 404);
    }
    return c.json(result[0]);
  });

  // Get run logs
  app.get("/:id/logs", async (c) => {
    const id = c.req.param("id");
    const result = await db.select().from(runLogs).where(eq(runLogs.runId, id));
    return c.json(result);
  });

  return app;
}
