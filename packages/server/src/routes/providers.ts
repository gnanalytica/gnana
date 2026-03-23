import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { Database } from "@gnana/db";
import { providers } from "@gnana/db";

export function providerRoutes(db: Database) {
  const app = new Hono();

  // List providers
  app.get("/", async (c) => {
    const result = await db.select().from(providers);
    // Strip API keys from response
    return c.json(result.map((p) => ({ ...p, apiKey: "***" })));
  });

  // Register provider
  app.post("/", async (c) => {
    const body = await c.req.json();
    const result = await db
      .insert(providers)
      .values({
        name: body.name,
        type: body.type,
        apiKey: body.apiKey,
        baseUrl: body.baseUrl,
        config: body.config ?? {},
        workspaceId: body.workspaceId,
      })
      .returning();
    return c.json({ ...result[0], apiKey: "***" }, 201);
  });

  // Delete provider
  app.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.update(providers).set({ enabled: false }).where(eq(providers.id, id));
    return c.json({ ok: true });
  });

  return app;
}
