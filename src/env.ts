import type { ChatSession } from "./durable-objects/chat-session";
import type { ResearchWorkflow } from "./workflows/research-workflow";

export type Env = {
  AI: Ai;
  RESEARCH_WORKFLOW: Workflow;
  CHAT_SESSION: DurableObjectNamespace<ChatSession>;
  DB: D1Database;
  PREFERENCES: KVNamespace;
  ASSETS: Fetcher;
};
