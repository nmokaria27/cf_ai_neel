import type { Env } from "../env";
import type { Message } from "../durable-objects/chat-session";
import {
  SUMMARIZATION_PROMPT,
  buildSummarizationMessage,
} from "./prompts";

export async function summarizeAndPersist(
  env: Env,
  sessionId: string,
  messages: Message[]
): Promise<void> {
  if (messages.length === 0) return;

  try {
    const response = (await env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast" as Parameters<Ai["run"]>[0],
      {
        messages: [
          { role: "system", content: SUMMARIZATION_PROMPT },
          { role: "user", content: buildSummarizationMessage(messages) },
        ],
        max_tokens: 256,
        temperature: 0.3,
      } as AiTextGenerationInput
    )) as { response?: string };

    const summary = response?.response?.trim();
    if (!summary) return;

    // Upsert summary for this session
    await env.DB.prepare(
      `INSERT INTO conversation_summaries (session_id, summary, message_count)
       VALUES (?, ?, ?)
       ON CONFLICT(session_id) DO UPDATE SET
         summary = excluded.summary,
         message_count = excluded.message_count,
         updated_at = datetime('now')`
    )
      .bind(sessionId, summary, messages.length)
      .run();
  } catch (err) {
    // Non-blocking — log but don't throw
    console.error("[summarizer] failed:", err);
  }
}
