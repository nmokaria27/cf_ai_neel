interface Props {
  isListening: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function VoiceButton({ isListening, isSupported, onStart, onStop, disabled = false }: Props) {
  if (!isSupported) {
    return (
      <div className="group relative">
        <button
          disabled
          className="p-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          title="Voice input not supported in this browser. Try Chrome or Edge."
        >
          <MicOffIcon />
        </button>
        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-800 dark:bg-gray-900 text-gray-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Voice not supported
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={isListening ? onStop : onStart}
      disabled={disabled}
      title={isListening ? "Stop listening" : "Start voice input"}
      className={`p-2.5 rounded-xl transition-all ${
        isListening
          ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
          : disabled
          ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
      }`}
    >
      {isListening ? <MicActiveIcon /> : <MicIcon />}
    </button>
  );
}

function MicIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function MicActiveIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3zM19 11a7 7 0 01-7 7 7 7 0 01-7-7H3a9 9 0 008 8.94V22h2v-2.06A9 9 0 0021 11h-2z" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5.586 5.586A9 9 0 0019.07 19.07M12 18.364A7 7 0 015 11m7 7.364V22m0 0H8m4 0h4M19 11a7 7 0 01-.708 3.072M12 2a3 3 0 013 3v3M9 9v3a3 3 0 004.9 2.303M3 3l18 18" />
    </svg>
  );
}
