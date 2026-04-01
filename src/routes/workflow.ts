import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { Env } from "../env";

const workflow = new Hono<{ Bindings: Env }>();

// POST /api/research — trigger a new research workflow
workflow.post("/", async (c) => {
  const sessionId = getCookie(c, "session_id");
  if (!sessionId) {
    return c.json({ error: "No session" }, 400);
  }

  let body: { query?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const query = body.query?.trim();
  if (!query) {
    return c.json({ error: "query is required" }, 400);
  }

  // Generate a stable ID to share between the instance and D1
  const workflowId = crypto.randomUUID();

  // Create the workflow instance with a known ID
  const instance = await c.env.RESEARCH_WORKFLOW.create({
    id: workflowId,
    params: { sessionId, query, workflowId },
  });

  // Insert a placeholder row in D1 so we can store the result when done
  await c.env.DB.prepare(
    `INSERT INTO research_results (session_id, workflow_id, query, result, status)
     VALUES (?, ?, ?, '', 'pending')`
  )
    .bind(sessionId, instance.id, query)
    .run();

  return c.json({ workflowId: instance.id, status: "pending" });
});

// GET /api/research/:id — poll workflow status
workflow.get("/:id", async (c) => {
  const workflowId = c.req.param("id");

  try {
    const instance = await c.env.RESEARCH_WORKFLOW.get(workflowId);
    const status = await instance.status();

    // If complete, include the report from D1
    if (status.status === "complete") {
      const row = await c.env.DB.prepare(
        "SELECT result, query FROM research_results WHERE workflow_id = ?"
      )
        .bind(workflowId)
        .first<{ result: string; query: string }>();

      return c.json({
        status: status.status,
        result: row?.result ?? null,
        query: row?.query ?? null,
        workflowId,
      });
    }

    if (status.status === "errored") {
      return c.json({
        status: "errored",
        error: "Research workflow failed. Please try again.",
        workflowId,
      });
    }

    return c.json({ status: status.status, workflowId });
  } catch (err) {
    return c.json({ error: "Workflow not found", workflowId }, 404);
  }
});

// GET /api/research — list recent research results for current session
workflow.get("/", async (c) => {
  const sessionId = getCookie(c, "session_id");
  if (!sessionId) {
    return c.json({ results: [] });
  }

  const rows = await c.env.DB.prepare(
    `SELECT workflow_id, query, status, result, created_at
     FROM research_results
     WHERE session_id = ?
     ORDER BY created_at DESC
     LIMIT 20`
  )
    .bind(sessionId)
    .all<{ workflow_id: string; query: string; status: string; result: string; created_at: string }>();

  return c.json({ results: rows.results });
});

export default workflow;
