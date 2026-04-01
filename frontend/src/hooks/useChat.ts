import { useState, useCallback, useEffect, useRef } from "react";
import type { Message } from "../types";
import { fetchHistory } from "../lib/api";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load history on mount
  useEffect(() => {
    fetchHistory()
      .then(setMessages)
      .catch(() => {/* silently ignore on initial load */});
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (isStreaming || !text.trim()) return;

    setError(null);
    setIsStreaming(true);

    // Append user message immediately
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    // Append empty assistant placeholder
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        credentials: "include",
        signal: abort.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
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
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;

          try {
            const parsed = JSON.parse(payload) as { token?: string; error?: string };

            if (parsed.error) {
              setError(parsed.error);
              break;
            }

            if (parsed.token) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + parsed.token,
                  };
                }
                return updated;
              });
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }

      // Process any remaining buffered line
      if (lineBuffer.startsWith("data: ")) {
        const payload = lineBuffer.slice(6).trim();
        if (payload && payload !== "[DONE]") {
          try {
            const parsed = JSON.parse(payload) as { token?: string };
            if (parsed.token) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + parsed.token,
                  };
                }
                return updated;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("[useChat]", err);
      setError("Something went wrong. Please try again.");
      // Remove the empty assistant message
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.role === "assistant" && !updated[updated.length - 1]?.content) {
          updated.pop();
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [isStreaming]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const resetMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, sendMessage, isStreaming, stopStreaming, resetMessages, error };
}
