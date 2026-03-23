import { Hono } from "hono";
import { eq, and, workspaces, workspaceMembers, workspaceInvites, type Database } from "@gnana/db";
import { requireRole } from "../middleware/rbac.js";
import { randomBytes } from "node:crypto";

export function workspaceRoutes(db: Database) {
  const app = new Hono();

  // List workspaces the current user belongs to
  app.get("/", async (c) => {
    const userId = c.get("userId");
    const memberships = await db
      .select({
        workspace: workspaces,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, userId));

    // Also include owned personal workspaces (owner may not have a membership row)
    const ownedWorkspaces = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, userId));

    const membershipIds = new Set(memberships.map((m) => m.workspace.id));
    const combined = [
      ...memberships.map((m) => ({ ...m.workspace, role: m.role })),
      ...ownedWorkspaces
        .filter((w) => !membershipIds.has(w.id))
        .map((w) => ({ ...w, role: "owner" })),
    ];

    return c.json(combined);
  });

  // Create a new team workspace
  app.post("/", async (c) => {
    const userId = c.get("userId");
    const body = await c.req.json();

    const slug = body.slug ?? body.name.toLowerCase().replace(/\s+/g, "-");

    const result = await db
      .insert(workspaces)
      .values({
        name: body.name,
        slug,
        type: "team",
        ownerId: userId,
      })
      .returning();

    const workspace = result[0]!;

    // Add creator as owner member
    await db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId,
      role: "owner",
      acceptedAt: new Date(),
    });

    return c.json(workspace, 201);
  });

  // List members of the current workspace
  app.get("/:id/members", requireRole("viewer"), async (c) => {
    const workspaceId = c.req.param("id");
    const result = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));
    return c.json(result);
  });

  // Invite a member to the workspace
  app.post("/:id/members", requireRole("admin"), async (c) => {
    const workspaceId = c.req.param("id");
    const userId = c.get("userId");
    const body = await c.req.json();

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const result = await db
      .insert(workspaceInvites)
      .values({
        workspaceId,
        email: body.email,
        role: body.role ?? "viewer",
        invitedBy: userId,
        token,
        expiresAt,
      })
      .returning();

    return c.json(result[0], 201);
  });

  // Update member role
  app.patch("/:id/members/:memberId", requireRole("admin"), async (c) => {
    const workspaceId = c.req.param("id");
    const memberId = c.req.param("memberId");
    const body = await c.req.json();

    const result = await db
      .update(workspaceMembers)
      .set({ role: body.role })
      .where(
        and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, memberId)),
      )
      .returning();

    if (result.length === 0) {
      return c.json({ error: "Member not found" }, 404);
    }

    return c.json(result[0]);
  });

  // Remove a member from workspace
  app.delete("/:id/members/:memberId", requireRole("admin"), async (c) => {
    const workspaceId = c.req.param("id");
    const memberId = c.req.param("memberId");

    const result = await db
      .delete(workspaceMembers)
      .where(
        and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, memberId)),
      )
      .returning();

    if (result.length === 0) {
      return c.json({ error: "Member not found" }, 404);
    }

    return c.json({ ok: true });
  });

  return app;
}
