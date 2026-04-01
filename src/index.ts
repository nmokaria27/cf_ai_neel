import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import type { Env } from "./env";
import chatRoutes from "./routes/chat";
import workflowRoutes from "./routes/workflow";
import preferencesRoutes from "./routes/preferences";

const app = new Hono<{ Bindings: Env }>();

// CORS — allow Vite dev server in development
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:8787"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    credentials: true,
  })
);

// Session middleware — create session_id cookie if absent
app.use("/api/*", async (c, next) => {
  let sessionId = getCookie(c, "session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    setCookie(c, "session_id", sessionId, {
      httpOnly: true,
      secure: c.req.url.startsWith("https"),
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
  }
  await next();
});

// API routes
app.route("/api/chat", chatRoutes);
app.route("/api/research", workflowRoutes);
app.route("/api/preferences", preferencesRoutes);

// Health check
app.get("/api/health", (c) => c.json({ ok: true, ts: Date.now() }));

export default app;

// Export Durable Object and Workflow classes — wrangler needs these at the module level
export { ChatSession } from "./durable-objects/chat-session";
export { ResearchWorkflow } from "./workflows/research-workflow";
