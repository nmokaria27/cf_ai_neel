# PROMPTS.md — AI Prompts Used in Development

## Development Prompts (Claude Code)

> "I'm reading through the Cloudflare Agents SDK and Workers AI docs. Can you help me understand how Durable Objects with SQLite storage differ from regular KV storage, and when I'd pick one over the other for a chat app? Also — how do Workflows compare to just chaining fetch calls in a Worker?"

> "Here's the assignment: build an AI-powered app on Cloudflare with these 4 requirements — LLM, Workflow/coordination, user input via chat or voice, and memory/state. I want to build a research assistant called Scout. Help me design the architecture — which Cloudflare primitives map to which requirement, what the data flow looks like, and break the build into phases."

> "Set up the wrangler.toml with all the bindings I need — AI, Durable Object with SQLite migration, Workflow, D1, KV, and static assets from the frontend build. Also create the D1 schema."

> "Build the Hono router with session cookie middleware and the POST /api/chat endpoint. It should stream tokens from Workers AI via SSE — use Hono's streamSSE helper. Store messages in the Durable Object before and after the LLM call."

> "The streaming is only showing the first word then stopping. I think the issue is chunk boundaries — when the network splits a `data: {...}` line across two reads, the JSON parse fails silently. Add a line buffer."

> "Now build the ResearchWorkflow — 4 steps: decompose the query into sub-questions, research each one, synthesize a report, persist to D1. Add retries on the research and synthesis steps."

> "The Settings panel lets users pick concise/detailed/academic but the chat route ignores it. Wire up the preferences — read from KV in the chat route and adjust the system prompt and max_tokens based on what the user selected."

> "Light mode is broken. The body tag and several components have hardcoded dark colors without dark: prefixes. Fix ResearchPanel, VoiceButton, and the index.html body."

> "Do a final review of the whole codebase. Check that all 4 assignment requirements are properly met, look for bugs, verify TypeScript compiles clean, and make sure the README has clear setup instructions."

---

## Application System Prompts (src/lib/prompts.ts)

**Chat system prompt:**
```
You are Scout, an AI research assistant. You help users explore topics, answer questions, and conduct research. You are knowledgeable, thorough, and cite your reasoning clearly. When a question would benefit from a deeper multi-step research workflow, mention that the user can click "Deep Research" for a comprehensive report. Keep responses clear and well-structured using markdown formatting where helpful. Be concise but complete.
```

**Research query decomposition:**
```
You are a research planning assistant. Given a research query, break it into 3-5 specific, focused sub-questions that together would provide a comprehensive answer to the original query. Each sub-question should be independently answerable and cover a distinct aspect of the topic.

Return ONLY a valid JSON array of strings — no markdown, no explanation, no code fences. Example output:
["What is X?", "How does Y work?", "What are the implications of Z?"]
```

**Research sub-question answering:**
```
You are a thorough research assistant. Provide a detailed, factual, and well-reasoned answer to the following question. Structure your response with clear paragraphs. Acknowledge uncertainty where appropriate. Aim for depth over breadth.
```

**Research synthesis:**
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

**Conversation summarization:**
```
Summarize the following conversation between a user and Scout (an AI research assistant). Capture: the key topics discussed, main questions asked, conclusions reached, and any important context. Keep the summary to 3-5 sentences. This summary will be used to give future conversations relevant context.
```
