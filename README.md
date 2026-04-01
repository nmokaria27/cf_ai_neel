# Scout — AI Research Assistant (`cf_ai_neel`)

Scout is an AI-powered research assistant built entirely on Cloudflare's developer platform. Ask questions via text or voice, get real-time streaming answers from Llama 3.3, and run multi-step deep research workflows — all with persistent memory across sessions.

---

## Cloudflare Assignment Requirements

| Requirement | Implementation |
|---|---|
| **LLM** | Workers AI — `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (streaming) |
| **Workflow / coordination** | Cloudflare Workflows — `ResearchWorkflow` (4 steps: decompose → research → synthesize → persist) |
| **User input via chat or voice** | React chat UI + Web Speech API microphone (browser-native, no external service) |
| **Memory / state** | Durable Objects (session message history, SQLite) + D1 (conversation summaries, research results) + Workers KV (user preferences) |

---

## Architecture

```
Browser (React + Tailwind)
  ├── Text input  ──────────────────┐
  ├── Voice input (Web Speech API)  ├──► POST /api/chat ──► SSE stream back
  └── Deep Research button  ────────►    POST /api/research ──► poll until done
                                         │
           ┌──────────────────────────────┘
           │       Worker (Hono)
           ├── Workers AI:  @cf/meta/llama-3.3-70b-instruct-fp8-fast
           ├── Durable Object (ChatSession):  per-session message history (SQLite)
           ├── Workflow (ResearchWorkflow):  4-step research pipeline
           ├── D1 (scout-db):  summaries + research results
           └── KV (PREFERENCES):  user preferences
```

### Research Workflow steps

1. **parse-query** — LLM decomposes query into 3–5 focused sub-questions
2. **research-subquestions** — LLM answers each sub-question (retries on failure)
3. **synthesize-report** — LLM combines findings into a structured markdown report
4. **persist-results** — Writes final report to D1

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | Workers AI — Llama 3.3 70B Instruct FP8 |
| Backend router | [Hono](https://hono.dev) |
| Session memory | Cloudflare Durable Objects (SQLite storage) |
| Persistent storage | Cloudflare D1 |
| Preferences | Cloudflare Workers KV |
| Orchestration | Cloudflare Workflows |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Voice | Web Speech API (browser-native) |

---

## Prerequisites

- Node.js 18+
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
- Wrangler CLI: `npm install -g wrangler`
- Log in: `wrangler login`

---

## Setup

### 1. Install dependencies

```bash
# Worker dependencies
npm install

# Frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Create Cloudflare resources

```bash
# Create D1 database
npx wrangler d1 create scout-db

# Create KV namespace
npx wrangler kv namespace create PREFERENCES
```

Copy the `database_id` and `id` values output by those commands into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "scout-db"
database_id = "PASTE_YOUR_DATABASE_ID_HERE"   # ← paste here

[[kv_namespaces]]
binding = "PREFERENCES"
id = "PASTE_YOUR_KV_ID_HERE"                  # ← paste here
```

### 3. Run D1 migrations

```bash
# Local dev
npm run db:migrate:local

# Production (after deploying)
npm run db:migrate:remote
```

---

## Running locally

Open two terminals:

**Terminal 1 — Worker (API + static assets on port 8787):**
```bash
npm run dev
```

**Terminal 2 — Frontend with hot reload (port 5173, proxied to 8787):**
```bash
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

> **Note:** Voice input requires HTTPS or `localhost`. It works on `localhost:5173` in Chrome/Edge. Firefox does not support the Web Speech API.

---

## Deploying to Cloudflare

```bash
# Build frontend and deploy Worker
npm run deploy

# Run D1 migrations in production
npm run db:migrate:remote
```

Your app will be live at `https://cf-ai-neel.<your-subdomain>.workers.dev`.

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat` | Send message, receive SSE stream of tokens |
| `GET` | `/api/chat/history` | Get session conversation history |
| `DELETE` | `/api/chat/history` | Clear session history |
| `POST` | `/api/research` | Start a deep research workflow |
| `GET` | `/api/research/:id` | Poll workflow status and get result |
| `GET` | `/api/research` | List recent research results |
| `GET` | `/api/preferences` | Get user preferences |
| `PUT` | `/api/preferences` | Update user preferences |
| `GET` | `/api/health` | Health check |

### SSE stream format

`POST /api/chat` returns `text/event-stream` with:

```
event: token
data: {"token":"The "}

event: token
data: {"token":"quick "}

event: done
data: [DONE]
```

---

## Project structure

```
cf_ai_neel/
├── src/                              # Cloudflare Worker (Hono)
│   ├── index.ts                      # App entry, session middleware, route mounting
│   ├── env.ts                        # Env type definition
│   ├── routes/
│   │   ├── chat.ts                   # POST /api/chat (SSE stream), history
│   │   ├── workflow.ts               # POST /api/research, GET /api/research/:id
│   │   └── preferences.ts            # GET/PUT /api/preferences
│   ├── durable-objects/
│   │   └── chat-session.ts           # ChatSession DO (SQLite message history)
│   ├── workflows/
│   │   └── research-workflow.ts      # 4-step ResearchWorkflow
│   └── lib/
│       ├── prompts.ts                # All system prompts
│       └── summarizer.ts             # Async conversation summarization → D1
├── frontend/                         # React app (Vite + Tailwind)
│   └── src/
│       ├── components/               # UI components
│       ├── hooks/                    # useChat, useVoice, useResearch, usePreferences
│       └── lib/api.ts                # Fetch wrappers
├── schema.sql                        # D1 schema
├── wrangler.toml                     # Cloudflare bindings config
└── PROMPTS.md                        # AI prompts used during development
```

---

## Features

- **Streaming chat** — Responses stream token-by-token via Server-Sent Events
- **Voice input** — Click the microphone and speak; transcript feeds directly into chat
- **Deep Research** — Triggers a durable multi-step Workflow that decomposes, researches, and synthesizes a full report
- **Session memory** — Durable Object stores conversation history with SQLite; history persists across page reloads
- **Conversation summaries** — Every 20 messages, the conversation is summarized and written to D1 asynchronously
- **User preferences** — Theme (dark/light), response style, voice toggle — stored in Workers KV
- **Error handling** — Voice permission errors, stream failures, workflow errors all handled gracefully
