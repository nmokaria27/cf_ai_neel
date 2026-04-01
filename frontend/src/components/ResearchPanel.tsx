import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ResearchResult } from "../types";

interface Props {
  result: ResearchResult | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

export function ResearchPanel({ result, isLoading, error, onClose }: Props) {
  const statusLabel: Record<string, string> = {
    pending: "Queued...",
    queued: "Queued...",
    running: "Researching...",
    complete: "Complete",
    errored: "Failed",
  };

  const statusColor: Record<string, string> = {
    pending: "text-yellow-500 dark:text-yellow-400",
    queued: "text-yellow-500 dark:text-yellow-400",
    running: "text-blue-500 dark:text-blue-400",
    complete: "text-green-500 dark:text-green-400",
    errored: "text-red-500 dark:text-red-400",
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Deep Research</h2>
          {result && (
            <p className={`text-xs mt-0.5 ${statusColor[result.status] ?? "text-gray-400"}`}>
              {statusLabel[result.status] ?? result.status}
              {isLoading && result.status !== "complete" && (
                <span className="ml-1 inline-block animate-spin">⟳</span>
              )}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {!result && !error && (
          <p className="text-gray-500 text-sm">
            Click the <span className="text-purple-600 dark:text-purple-400">📋 research button</span> next to any message
            to run a multi-step research workflow on that topic.
          </p>
        )}

        {result && (
          <>
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Query</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{result.query}</p>
            </div>

            {isLoading && (
              <div className="space-y-3">
                <WorkflowStep label="Decomposing query" active />
                <WorkflowStep label="Researching sub-questions" active />
                <WorkflowStep label="Synthesizing report" active />
                <WorkflowStep label="Saving to memory" active />
              </div>
            )}

            {result.status === "complete" && result.result && (
              <div className="prose prose-gray dark:prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result.result}
                </ReactMarkdown>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function WorkflowStep({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
        active ? "bg-gray-700 animate-pulse" : "bg-green-600"
      }`}>
        {active ? (
          <span className="block w-2 h-2 rounded-full bg-blue-400" />
        ) : (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <span className={active ? "text-gray-500" : "text-gray-300"}>{label}</span>
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
