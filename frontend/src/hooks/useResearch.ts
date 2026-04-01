import { useState, useCallback, useRef } from "react";
import type { ResearchResult } from "../types";
import { triggerResearch, pollResearch } from "../lib/api";

export function useResearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const trigger = useCallback(async (query: string) => {
    if (isLoading) return;
    stopPolling();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { workflowId } = await triggerResearch(query);

      setResult({ workflowId, query, status: "pending" });

      // Poll every 2 seconds until complete or errored
      pollRef.current = setInterval(async () => {
        try {
          const status = await pollResearch(workflowId);
          setResult(status);

          if (status.status === "complete" || status.status === "errored") {
            stopPolling();
            setIsLoading(false);
            if (status.status === "errored") {
              setError(status.error ?? "Research failed.");
            }
          }
        } catch {
          stopPolling();
          setIsLoading(false);
          setError("Failed to poll research status.");
        }
      }, 2000);
    } catch (err) {
      console.error("[useResearch]", err);
      setIsLoading(false);
      setError("Failed to start research workflow.");
    }
  }, [isLoading, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setIsLoading(false);
    setResult(null);
    setError(null);
  }, [stopPolling]);

  return { trigger, isLoading, result, error, reset };
}
