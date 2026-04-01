export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
}

export interface UserPreferences {
  theme: "dark" | "light";
  responseStyle: "concise" | "detailed" | "academic";
  maxTokens: number;
  voiceEnabled: boolean;
}

export interface ResearchResult {
  workflowId: string;
  query: string;
  status: "pending" | "running" | "complete" | "errored";
  result?: string;
  error?: string;
}
