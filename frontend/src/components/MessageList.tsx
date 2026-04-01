import { useEffect, useRef } from "react";
import type { Message } from "../types";
import { MessageBubble } from "./MessageBubble";

interface Props {
  messages: Message[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-3xl mb-4">
          🔭
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Scout</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">
          Ask me anything — I can answer questions, explain concepts, or run a
          deep multi-step research workflow on any topic.
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
          {STARTER_PROMPTS.map((p) => (
            <button
              key={p}
              className="text-left p-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm transition-colors"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("scout:prompt", { detail: p }));
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
      {messages.map((msg, i) => (
        <MessageBubble
          key={i}
          message={msg}
          isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

const STARTER_PROMPTS = [
  "Explain how Cloudflare Workers work",
  "What is the difference between LLMs and traditional search?",
  "How does TCP/IP enable the internet?",
  "Summarize recent trends in AI infrastructure",
];
