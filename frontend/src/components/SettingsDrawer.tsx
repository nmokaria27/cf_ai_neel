import type { UserPreferences } from "../types";

interface Props {
  preferences: UserPreferences;
  onUpdate: (partial: Partial<UserPreferences>) => void;
  onClose: () => void;
  onClearHistory: () => void;
}

export function SettingsDrawer({ preferences, onUpdate, onClose, onClearHistory }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <button className="flex-1 bg-black/50" onClick={onClose} aria-label="Close settings" />
      <div className="w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Theme */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Appearance</h3>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdate({ theme: t })}
                  className={`flex-1 py-2 text-sm capitalize transition-colors ${
                    preferences.theme === t
                      ? "bg-brand-600 text-white"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          {/* Response Style */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Response Style</h3>
            <div className="space-y-2">
              {(["concise", "detailed", "academic"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => onUpdate({ responseStyle: style })}
                  className={`w-full py-2 px-3 rounded-lg text-sm text-left capitalize transition-colors ${
                    preferences.responseStyle === style
                      ? "bg-brand-50 dark:bg-brand-600/20 border border-brand-500 text-brand-700 dark:text-brand-400"
                      : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {style}
                  <span className="block text-xs opacity-60 mt-0.5">
                    {style === "concise" && "Short, direct answers"}
                    {style === "detailed" && "Thorough explanations with examples"}
                    {style === "academic" && "Formal, citation-aware style"}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Voice */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Voice Input</h3>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700 dark:text-gray-300">Enable microphone button</span>
              <button
                role="switch"
                aria-checked={preferences.voiceEnabled}
                onClick={() => onUpdate({ voiceEnabled: !preferences.voiceEnabled })}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  preferences.voiceEnabled ? "bg-brand-600" : "bg-gray-300 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    preferences.voiceEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </label>
          </section>

          {/* Danger Zone */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Data</h3>
            <button
              onClick={() => {
                if (window.confirm("Clear all conversation history? This cannot be undone.")) {
                  onClearHistory();
                }
              }}
              className="w-full py-2 px-3 rounded-lg text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              Clear conversation history
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
