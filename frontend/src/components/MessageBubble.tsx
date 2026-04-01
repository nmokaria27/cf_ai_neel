import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "../types";
import { StreamingIndicator } from "./StreamingIndicator";

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
          S
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-brand-600 text-white rounded-tr-sm"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm"
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="text-sm prose prose-gray dark:prose-invert prose-sm max-w-none">
            {message.content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const isBlock = className?.startsWith("language-");
                    return isBlock ? (
                      <pre className="bg-gray-200 dark:bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code
                        className="bg-gray-200 dark:bg-gray-900 px-1.5 py-0.5 rounded text-brand-700 dark:text-brand-400"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : isStreaming ? (
              <StreamingIndicator />
            ) : null}
            {isStreaming && message.content && (
              <span className="inline-block w-0.5 h-4 bg-brand-400 ml-0.5 animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-bold ml-2 flex-shrink-0 mt-1">
          U
        </div>
      )}
    </div>
  );
}
