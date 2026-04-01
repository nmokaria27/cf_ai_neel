import { useState, useCallback, useEffect } from "react";
import type { UserPreferences } from "../types";
import { fetchPreferences, updatePreferences } from "../lib/api";

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "dark",
  responseStyle: "detailed",
  maxTokens: 1024,
  voiceEnabled: true,
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPreferences()
      .then(setPreferences)
      .catch(() => setPreferences(DEFAULT_PREFERENCES))
      .finally(() => setIsLoading(false));
  }, []);

  // Apply theme to <html> element
  useEffect(() => {
    const html = document.documentElement;
    if (preferences.theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [preferences.theme]);

  const update = useCallback(async (partial: Partial<UserPreferences>) => {
    const optimistic = { ...preferences, ...partial };
    setPreferences(optimistic);
    try {
      const saved = await updatePreferences(partial);
      setPreferences(saved);
    } catch {
      setPreferences(preferences); // Rollback
    }
  }, [preferences]);

  return { preferences, update, isLoading };
}
