import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { getCookie } from "hono/cookie";
import type { Env } from "../env";
import { SYSTEM_PROMPT } from "../lib/prompts";
import { summarizeAndPersist } from "../lib/summarizer";
import type { UserPreferences } from "./preferences";

const STYLE_INSTRUCTIONS: Record<string, string> = {
  concise: " Respond as concisely as possible — short sentences, bullet points where appropriate, no filler.",
  detailed: " Provide thorough explanations with examples and context. Be comprehensive.",
  academic: " Use a formal, academic tone. Structure your response with clear sections. Cite reasoning precisely.",
};

const chat = new Hono<{ Bindings: Env }>();

// POST /api/chat — send message, receive streamed SSE response
chat.post("/", async (c) => {
  const sessionId = getCookie(c, "session_id");
  if (!sessionId) {
    return c.json({ error: "No session" }, 400);
  }

  let body: { message?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const message = body.message?.trim();
  if (!message) {
    return c.json({ error: "Message is required" }, 400);
  }

  // Get DO stub for this session
  const stub = c.env.CHAT_SESSION.get(
    c.env.CHAT_SESSION.idFromName(sessionId)
  );

  // Store user message
  await stub.addMessage("user", message);

  // Load conversation history for context window
  const history = await stub.getHistory(30);

  // Load user preferences for response style and max tokens
  let prefs: UserPreferences | null = null;
  try {
    prefs = await c.env.PREFERENCES.get(`prefs:${sessionId}`, "json") as UserPreferences | null;
  } catch { /* use defaults */ }
  const responseStyle = prefs?.responseStyle ?? "detailed";
  const maxTokens = prefs?.maxTokens ?? 1024;

  // Build messages array for LLM
  const systemContent = SYSTEM_PROMPT + (STYLE_INSTRUCTIONS[responseStyle] ?? "");
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemContent },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  // Stream SSE response
  c.header("Content-Encoding", "Identity"); // Required for wrangler dev streaming

  let fullResponse = "";

  return streamSSE(c, async (sseStream) => {
    try {
      const aiStream = (await c.env.AI.run(
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast" as Parameters<Ai["run"]>[0],
        {
          messages,
          stream: true,
          max_tokens: maxTokens,
          temperature: 0.7,
        } as AiTextGenerationInput
      )) as ReadableStream;

      const reader = aiStream.getReader();
      const decoder = new TextDecoder();
      let lineBuffer = ""; // Buffer for incomplete lines across chunk boundaries

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append new chunk to buffer and split on newlines
        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split("\n");
        // Keep the last (potentially incomplete) line in the buffer
        lineBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;

          try {
            const parsed = JSON.parse(raw) as { response?: string };
            const token = parsed.response;
            if (token) {
              fullResponse += token;
              await sseStream.writeSSE({
                event: "token",
                data: JSON.stringify({ token }),
              });
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

      // Process any remaining buffered line
      if (lineBuffer.startsWith("data: ")) {
        const raw = lineBuffer.slice(6).trim();
        if (raw && raw !== "[DONE]") {
          try {
            const parsed = JSON.parse(raw) as { response?: string };
            const token = parsed.response;
            if (token) {
              fullResponse += token;
              await sseStream.writeSSE({ event: "token", data: JSON.stringify({ token }) });
            }
          } catch { /* ignore */ }
        }
      }

      // Persist full assistant response to DO
      await stub.addMessage("assistant", fullResponse);

      // Trigger async summarization every 20 messages
      const count = await stub.getMessageCount();
      if (count > 0 && count % 20 === 0) {
        c.executionCtx.waitUntil(
          summarizeAndPersist(c.env, sessionId, history)
        );
      }

      await sseStream.writeSSE({ event: "done", data: "[DONE]" });
    } catch (err) {
      console.error("[chat] stream error:", err);
      await sseStream.writeSSE({
        event: "error",
        data: JSON.stringify({ error: "Stream interrupted. Please try again." }),
      });
    }
  });
});

// GET /api/chat/history — return message history for current session
chat.get("/history", async (c) => {
  const sessionId = getCookie(c, "session_id");
  if (!sessionId) {
    return c.json({ messages: [] });
  }

  const stub = c.env.CHAT_SESSION.get(
    c.env.CHAT_SESSION.idFromName(sessionId)
  );
  const messages = await stub.getHistory(100);
  return c.json({ messages });
});

// DELETE /api/chat/history — clear session history
chat.delete("/history", async (c) => {
  const sessionId = getCookie(c, "session_id");
  if (!sessionId) {
    return c.json({ success: true });
  }

  const stub = c.env.CHAT_SESSION.get(
    c.env.CHAT_SESSION.idFromName(sessionId)
  );
  await stub.clearHistory();
  return c.json({ success: true });
});

export default chat;
