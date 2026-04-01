# PROMPTS.md — AI Prompts Used in Development

This document logs the AI prompts I used while building Scout (`cf_ai_neel`). I leaned on Claude as a coding partner throughout — starting from understanding the Cloudflare docs, through architecture planning, and into iterative implementation. Each prompt built on the previous context.

---

## Development Process

### Phase 1 — Understanding the platform

I started by reading through the Cloudflare Agents docs and Workers AI documentation to understand what primitives were available. Then I used Claude to help me connect the dots.

> "I'm reading through the Cloudflare Agents SDK and Workers AI docs. Can you help me understand how Durable Objects with SQLite storage differ from regular KV storage, and when I'd pick one over the other for a chat app? Also — how do Workflows compare to just chaining fetch calls in a Worker?"

**Why:** I wanted to make sure I actually understood the tradeoffs before committing to an architecture. The answer helped me decide on DO + SQLite for session history (structured queries, ordering) vs KV for simple preferences.

### Phase 2 — Architecture planning

Once I had a handle on the platform, I asked for a structured plan.

> "Here's the assignment: build an AI-powered app on Cloudflare with these 4 requirements — LLM, Workflow/coordination, user input via chat or voice, and memory/state. I want to build a research assistant called Scout. Help me design the architecture — which Cloudflare primitives map to which requirement, what the data flow looks like, and break the build into phases."

**What I got back:** A full architecture with Workers AI for the LLM, a 4-step Workflow for research, Durable Objects for session memory, D1 for persistence, and KV for preferences. I reviewed the plan and made a few changes:

- I originally considered using R2 for caching research reports, but decided D1 was simpler and sufficient — no need for blob storage when the reports are just markdown text.
- I added the conversation summarization feature (every 20 messages → summarize → D1) because I wanted to demonstrate async background work with `waitUntil()`.
- I switched from EventSource to fetch + ReadableStream on the client because EventSource doesn't support POST with a request body.

### Phase 3 — Iterative implementation

I built the project in stages, testing each piece before moving on. Here are the key prompts from that process:

> "Set up the wrangler.toml with all the bindings I need — AI, Durable Object with SQLite migration, Workflow, D1, KV, and static assets from the frontend build. Also create the D1 schema."

> "Build the Hono router with session cookie middleware and the POST /api/chat endpoint. It should stream tokens from Workers AI via SSE — use Hono's streamSSE helper. Store messages in the Durable Object before and after the LLM call."

> "The streaming is only showing the first word then stopping. I think the issue is chunk boundaries — when the network splits a `data: {...}` line across two reads, the JSON parse fails silently. Add a line buffer."

**What happened:** The first version of the SSE parsing split chunks naively on `\n` and tried to parse each piece. This dropped tokens whenever a chunk boundary fell mid-line. I added a `lineBuffer` that accumulates incomplete lines across reads — same fix was needed on both server and client side.

> "Now build the ResearchWorkflow — 4 steps: decompose the query into sub-questions, research each one, synthesize a report, persist to D1. Add retries on the research and synthesis steps."

> "The Settings panel lets users pick concise/detailed/academic but the chat route ignores it. Wire up the preferences — read from KV in the chat route and adjust the system prompt and max_tokens based on what the user selected."

> "Light mode is broken. The body tag and several components have hardcoded dark colors without dark: prefixes. Fix ResearchPanel, VoiceButton, and the index.html body."

### Phase 4 — Polish and review

> "Do a final review of the whole codebase. Check that all 4 assignment requirements are properly met, look for bugs, verify TypeScript compiles clean, and make sure the README has clear setup instructions."

**Result:** Found and fixed 8 issues including the SSE chunk bug on both sides, the broken SQL upsert (missing UNIQUE constraint), unused preferences, and incomplete light mode support across several components.

---

## Application System Prompts

These are the prompts embedded in the application itself (see `src/lib/prompts.ts`).

### Chat system prompt
```
You are Scout, an AI research assistant. You help users explore topics, answer questions, and conduct research. You are knowledgeable, thorough, and cite your reasoning clearly. When a question would benefit from a deeper multi-step research workflow, mention that the user can click "Deep Research" for a comprehensive report. Keep responses clear and well-structured using markdown formatting where helpful. Be concise but complete.
```

**Used in:** `POST /api/chat` — prepended to every conversation as the system message.

### Research query decomposition prompt
```
You are a research planning assistant. Given a research query, break it into 3-5 specific, focused sub-questions that together would provide a comprehensive answer to the original query. Each sub-question should be independently answerable and cover a distinct aspect of the topic.

Return ONLY a valid JSON array of strings — no markdown, no explanation, no code fences. Example output:
["What is X?", "How does Y work?", "What are the implications of Z?"]
```

**Used in:** `ResearchWorkflow` step 1 (`parse-query`) — decomposes the user's research query.

### Research sub-question answering prompt
```
You are a thorough research assistant. Provide a detailed, factual, and well-reasoned answer to the following question. Structure your response with clear paragraphs. Acknowledge uncertainty where appropriate. Aim for depth over breadth.
```

**Used in:** `ResearchWorkflow` step 2 (`research-subquestions`) — answers each sub-question from step 1.

### Research synthesis prompt
```
Synthesize the following research findings into a cohesive, well-structured report. Use this exact structure:

# Research Report

## Executive Summary
(2-3 sentences capturing the core answer)

## Key Findings
(Bullet points of the most important facts discovered)

## Detailed Analysis
(Organized sections addressing each major aspect of the topic)

## Conclusion
(What the research means and what questions remain open)

Use markdown formatting throughout. Be comprehensive but avoid redundancy.
```

**Used in:** `ResearchWorkflow` step 3 (`synthesize-report`) — combines all sub-question answers into a final report.

### Conversation summarization prompt
```
Summarize the following conversation between a user and Scout (an AI research assistant). Capture: the key topics discussed, main questions asked, conclusions reached, and any important context. Keep the summary to 3-5 sentences. This summary will be used to give future conversations relevant context.
```

**Used in:** `summarizeAndPersist()` — triggered asynchronously every 20 messages to persist a summary to D1.
