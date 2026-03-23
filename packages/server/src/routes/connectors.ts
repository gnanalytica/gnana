import { Hono } from "hono";
import { eq, and, connectors, connectorTools, type Database } from "@gnana/db";
import { requireRole } from "../middleware/rbac.js";
import { planLimit } from "../middleware/plan-limits.js";

export function connectorRoutes(db: Database) {
  const app = new Hono();

  // List connectors — viewer+
  app.get("/", requireRole("viewer"), async (c) => {
    const workspaceId = c.get("workspaceId");
    const result = await db
      .select()
      .from(connectors)
      .where(eq(connectors.workspaceId, workspaceId));
    return c.json(result);
  });

  // Get connector by ID — viewer+
  app.get("/:id", requireRole("viewer"), async (c) => {
    const id = c.req.param("id");
    const workspaceId = c.get("workspaceId");
    const result = await db
      .select()
      .from(connectors)
      .where(and(eq(connectors.id, id), eq(connectors.workspaceId, workspaceId)));
    if (result.length === 0) {
      return c.json({ error: "Connector not found" }, 404);
    }
    return c.json(result[0]);
  });

  // Register connector — admin+ with plan limit check
  app.post("/", requireRole("admin"), planLimit(db, "maxConnectors", connectors), async (c) => {
    const workspaceId = c.get("workspaceId");
    const body = await c.req.json();
    const result = await db
      .insert(connectors)
      .values({
        type: body.type,
        name: body.name,
        authType: body.authType,
        credentials: body.credentials,
        config: body.config ?? {},
        workspaceId,
      })
      .returning();
    return c.json(result[0], 201);
  });

  // Get connector tools — viewer+
  app.get("/:id/tools", requireRole("viewer"), async (c) => {
    const id = c.req.param("id");
    const result = await db.select().from(connectorTools).where(eq(connectorTools.connectorId, id));
    return c.json(result);
  });

  // Delete connector — admin+
  app.delete("/:id", requireRole("admin"), async (c) => {
    const id = c.req.param("id");
    const workspaceId = c.get("workspaceId");
    await db
      .update(connectors)
      .set({ enabled: false })
      .where(and(eq(connectors.id, id), eq(connectors.workspaceId, workspaceId)));
    return c.json({ ok: true });
  });

  // Test connector — admin+
  app.post("/:id/test", requireRole("admin"), async (c) => {
    const id = c.req.param("id");
    const workspaceId = c.get("workspaceId");

    const result = await db
      .select()
      .from(connectors)
      .where(and(eq(connectors.id, id), eq(connectors.workspaceId, workspaceId)))
      .limit(1);

    const connector = result[0];
    if (!connector) return c.json({ error: "Connector not found" }, 404);

    try {
      const creds = connector.credentials as Record<string, string> | null;
      const config = connector.config as Record<string, string>;

      switch (connector.type) {
        case "github": {
          const token = creds?.token;
          if (!token) return c.json({ success: false, message: "No token configured" });
          const res = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${token}`, "User-Agent": "Gnana" },
          });
          if (res.ok) {
            const user = (await res.json()) as { login: string };
            return c.json({ success: true, message: `Connected as ${user.login}` });
          }
          return c.json({ success: false, message: `GitHub API error: ${res.status}` });
        }
        case "slack": {
          const token = creds?.token;
          if (!token) return c.json({ success: false, message: "No token configured" });
          const res = await fetch("https://slack.com/api/auth.test", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = (await res.json()) as { ok: boolean; team?: string; error?: string };
          if (data.ok) {
            return c.json({ success: true, message: `Connected to ${data.team}` });
          }
          return c.json({ success: false, message: `Slack error: ${data.error}` });
        }
        case "http": {
          const baseUrl = config?.baseUrl;
          if (!baseUrl) return c.json({ success: false, message: "No base URL configured" });
          const res = await fetch(baseUrl, { method: "HEAD" });
          return c.json({ success: true, message: `Reachable (HTTP ${res.status})` });
        }
        default:
          return c.json({ success: true, message: "Connector type not testable yet" });
      }
    } catch (err) {
      return c.json({
        success: false,
        message: `Connection failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }
  });

  return app;
}
