import { Hono } from "hono";
import { eq, and, providers, type Database } from "@gnana/db";
import { requireRole } from "../middleware/rbac.js";

export function providerRoutes(db: Database) {
  const app = new Hono();

  // List providers — viewer+
  app.get("/", requireRole("viewer"), async (c) => {
    const workspaceId = c.get("workspaceId");
    const result = await db.select().from(providers).where(eq(providers.workspaceId, workspaceId));
    // Strip API keys from response
    return c.json(result.map((p) => ({ ...p, apiKey: "***" })));
  });

  // Register provider — admin+
  app.post("/", requireRole("admin"), async (c) => {
    const workspaceId = c.get("workspaceId");
    const body = await c.req.json();
    const result = await db
      .insert(providers)
      .values({
        name: body.name,
        type: body.type,
        apiKey: body.apiKey,
        baseUrl: body.baseUrl,
        config: body.config ?? {},
        workspaceId,
      })
      .returning();
    return c.json({ ...result[0], apiKey: "***" }, 201);
  });

  // Delete provider — admin+
  app.delete("/:id", requireRole("admin"), async (c) => {
    const id = c.req.param("id");
    const workspaceId = c.get("workspaceId");
    await db
      .update(providers)
      .set({ enabled: false })
      .where(and(eq(providers.id, id), eq(providers.workspaceId, workspaceId)));
    return c.json({ ok: true });
  });

  return app;
}
