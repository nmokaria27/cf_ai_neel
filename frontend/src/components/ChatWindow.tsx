import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { useChat } from "../hooks/useChat";
import { useResearch } from "../hooks/useResearch";
import type { UserPreferences } from "../types";
import { clearHistory } from "../lib/api";

interface Props {
  preferences: UserPreferences;
  onOpenSettings: (onClear: () => void) => void;
  onOpenResearch: () => void;
  research: ReturnType<typeof useResearch>;
}

export function ChatWindow({ preferences, onOpenSettings, onOpenResearch, research }: Props) {
  const { messages, sendMessage, isStreaming, stopStreaming, resetMessages, error } = useChat();

  const handleResearch = async (query: string) => {
    onOpenResearch();
    await research.trigger(query);
  };

  const handleClearHistory = async () => {
    await clearHistory();
    resetMessages();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔭</span>
          <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Scout</h1>
          <span className="text-xs text-gray-500">AI Research Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <button
              onClick={stopStreaming}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Stop
            </button>
          )}
          <button
            onClick={() => onOpenSettings(handleClearHistory)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Settings"
          >
            <GearIcon />
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isStreaming={isStreaming} />

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onResearch={handleResearch}
        isStreaming={isStreaming}
        voiceEnabled={preferences.voiceEnabled}
      />
    </div>
  );
}

function GearIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
