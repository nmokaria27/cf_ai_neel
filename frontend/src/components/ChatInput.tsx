import { useState, useRef, useEffect, useCallback } from "react";
import { VoiceButton } from "./VoiceButton";
import { useVoice } from "../hooks/useVoice";

interface Props {
  onSend: (text: string) => void;
  onResearch: (text: string) => void;
  isStreaming: boolean;
  voiceEnabled: boolean;
}

export function ChatInput({ onSend, onResearch, isStreaming, voiceEnabled }: Props) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTranscript = useCallback((text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  }, []);

  const { isListening, interimTranscript, voiceError, startListening, stopListening, isSupported } =
    useVoice(handleTranscript);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<string>;
      setInput(custom.detail);
      textareaRef.current?.focus();
    };
    window.addEventListener("scout:prompt", handler);
    return () => window.removeEventListener("scout:prompt", handler);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const displayValue = isListening && interimTranscript ? interimTranscript : input;
  const placeholder = isListening
    ? "Listening... speak now"
    : "Ask Scout anything... (Shift+Enter for new line)";

  return (
    <div className="px-4 pb-4">
      {voiceError && (
        <div className="mb-2 text-xs text-red-500 text-center">
          {voiceError === "not-allowed" && "Microphone access denied. Enable it in browser settings."}
          {voiceError === "no-speech" && "No speech detected. Try again."}
          {voiceError === "network" && "Network error with speech recognition."}
          {voiceError === "unsupported" && "Voice input not supported in this browser."}
        </div>
      )}
      <div className="flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700 focus-within:border-brand-500 transition-colors p-2">
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming || isListening}
          rows={1}
          className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none text-sm py-2 px-2 min-h-[40px] max-h-[200px] disabled:opacity-60"
        />
        <div className="flex items-center gap-1.5 pb-1">
          {voiceEnabled && (
            <VoiceButton
              isListening={isListening}
              isSupported={isSupported}
              onStart={startListening}
              onStop={stopListening}
              disabled={isStreaming}
            />
          )}
          <button
            onClick={() => {
              const text = input.trim();
              if (text) {
                onResearch(text);
                setInput("");
              }
            }}
            disabled={!input.trim() || isStreaming}
            title="Run deep research workflow"
            className="p-2.5 rounded-xl bg-gray-200 hover:bg-purple-100 dark:bg-gray-700 dark:hover:bg-purple-700 text-gray-600 dark:text-gray-300 hover:text-purple-700 dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <SearchIcon />
          </button>
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming}
            title="Send message"
            className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isStreaming ? <StopIcon /> : <SendIcon />}
          </button>
        </div>
      </div>
      <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-2">
        Scout · Powered by Llama 3.3 on Cloudflare Workers AI
      </p>
    </div>
  );
}

function SendIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
