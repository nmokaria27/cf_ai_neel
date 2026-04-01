import { useState, useCallback } from "react";
import { ChatWindow } from "./components/ChatWindow";
import { ResearchPanel } from "./components/ResearchPanel";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { usePreferences } from "./hooks/usePreferences";
import { useResearch } from "./hooks/useResearch";

export default function App() {
  const { preferences, update: updatePreferences } = usePreferences();
  const research = useResearch();

  const [showResearch, setShowResearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [onClearHistory, setOnClearHistory] = useState<(() => void) | null>(null);

  const handleOpenSettings = useCallback((clearFn: () => void) => {
    setOnClearHistory(() => clearFn);
    setShowSettings(true);
  }, []);

  const handleOpenResearch = useCallback(() => {
    setShowResearch(true);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950">
      {/* Main chat area */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all ${showResearch ? "hidden sm:flex" : "flex"}`}>
        <ChatWindow
          preferences={preferences}
          onOpenSettings={handleOpenSettings}
          onOpenResearch={handleOpenResearch}
          research={research}
        />
      </div>

      {/* Research panel — slide in on right */}
      {showResearch && (
        <div className="w-full sm:w-96 flex-shrink-0">
          <ResearchPanel
            result={research.result}
            isLoading={research.isLoading}
            error={research.error}
            onClose={() => {
              setShowResearch(false);
              research.reset();
            }}
          />
        </div>
      )}

      {/* Settings drawer — modal overlay */}
      {showSettings && (
        <SettingsDrawer
          preferences={preferences}
          onUpdate={updatePreferences}
          onClose={() => setShowSettings(false)}
          onClearHistory={() => {
            onClearHistory?.();
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}
