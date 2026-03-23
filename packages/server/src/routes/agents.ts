import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { Database } from "@gnana/db";
import { agents } from "@gnana/db";

export function agentRoutes(db: Database) {
  const app = new Hono();

  // List agents
  app.get("/", async (c) => {
    const result = await db.select().from(agents).where(eq(agents.enabled, true));
    return c.json(result);
  });

  // Get agent by ID
  app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const result = await db.select().from(agents).where(eq(agents.id, id));
    if (result.length === 0) {
      return c.json({ error: "Agent not found" }, 404);
    }
    return c.json(result[0]);
  });

  // Create agent
  app.post("/", async (c) => {
    const body = await c.req.json();
    const result = await db
      .insert(agents)
      .values({
        name: body.name,
        description: body.description ?? "",
        systemPrompt: body.systemPrompt,
        toolsConfig: body.toolsConfig ?? {},
        llmConfig: body.llmConfig,
        triggersConfig: body.triggersConfig ?? [],
        approval: body.approval ?? "required",
        maxToolRounds: body.maxToolRounds ?? 10,
        workspaceId: body.workspaceId,
      })
      .returning();
    return c.json(result[0], 201);
  });

  // Update agent
  app.put("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const result = await db
      .update(agents)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(agents.id, id))
      .returning();
    if (result.length === 0) {
      return c.json({ error: "Agent not found" }, 404);
    }
    return c.json(result[0]);
  });

  // Delete agent
  app.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.update(agents).set({ enabled: false }).where(eq(agents.id, id));
    return c.json({ ok: true });
  });

  return app;
}
