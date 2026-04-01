import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { Env } from "../env";

export interface UserPreferences {
  theme: "dark" | "light";
  responseStyle: "concise" | "detailed" | "academic";
  maxTokens: number;
  voiceEnabled: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "dark",
  responseStyle: "detailed",
  maxTokens: 1024,
  voiceEnabled: true,
};

const preferences = new Hono<{ Bindings: Env }>();

preferences.get("/", async (c) => {
  const sessionId = getCookie(c, "session_id");
  if (!sessionId) {
    return c.json(DEFAULT_PREFERENCES);
  }

  const stored = await c.env.PREFERENCES.get(`prefs:${sessionId}`, "json") as UserPreferences | null;
  return c.json(stored ?? DEFAULT_PREFERENCES);
});

preferences.put("/", async (c) => {
  const sessionId = getCookie(c, "session_id");
  if (!sessionId) {
    return c.json({ error: "No session" }, 400);
  }

  let incoming: Partial<UserPreferences>;
  try {
    incoming = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  // Merge with existing or defaults
  const existing = (await c.env.PREFERENCES.get(`prefs:${sessionId}`, "json") as UserPreferences | null) ?? DEFAULT_PREFERENCES;
  const updated: UserPreferences = { ...existing, ...incoming };

  await c.env.PREFERENCES.put(`prefs:${sessionId}`, JSON.stringify(updated), {
    expirationTtl: 60 * 60 * 24 * 365, // 1 year
  });

  return c.json(updated);
});

export default preferences;
