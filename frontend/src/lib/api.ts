import type { Message, UserPreferences, ResearchResult } from "../types";

const BASE = "";

// Chat
export async function fetchHistory(): Promise<Message[]> {
  const res = await fetch(`${BASE}/api/chat/history`, { credentials: "include" });
  const data = await res.json() as { messages: Message[] };
  return data.messages ?? [];
}

export async function clearHistory(): Promise<void> {
  await fetch(`${BASE}/api/chat/history`, { method: "DELETE", credentials: "include" });
}

// Preferences
export async function fetchPreferences(): Promise<UserPreferences> {
  const res = await fetch(`${BASE}/api/preferences`, { credentials: "include" });
  return res.json() as Promise<UserPreferences>;
}

export async function updatePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const res = await fetch(`${BASE}/api/preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
    credentials: "include",
  });
  return res.json() as Promise<UserPreferences>;
}

// Research workflows
export async function triggerResearch(query: string): Promise<{ workflowId: string }> {
  const res = await fetch(`${BASE}/api/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    credentials: "include",
  });
  return res.json() as Promise<{ workflowId: string }>;
}

export async function pollResearch(workflowId: string): Promise<ResearchResult> {
  const res = await fetch(`${BASE}/api/research/${workflowId}`, { credentials: "include" });
  return res.json() as Promise<ResearchResult>;
}

export async function fetchResearchHistory(): Promise<ResearchResult[]> {
  const res = await fetch(`${BASE}/api/research`, { credentials: "include" });
  const data = await res.json() as { results: ResearchResult[] };
  return data.results ?? [];
}
