# NemoThoughts

A monochrome AI study companion. Ask questions per subject and lesson; every answer ends with a **Rule to remember**, which is logged automatically to a per-subject **Mistake Book**. Concepts you keep asking about rise to the top.

- **Model:** NVIDIA Nemotron on Nebius Token Factory (OpenAI-compatible API)
- **Research:** Tavily Search, toggled per conversation with "Live research"
- **Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, react-markdown

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in NEBIUS_API_KEY and TAVILY_API_KEY
npm run dev                  # http://localhost:3000
```

Open **Settings** in the sidebar to confirm that both keys connect and to see latency and model availability.

## Project structure

```
src/
  app/
    api/
      tutor/route.ts        POST  Nemotron tutor (+ optional Tavily enrichment)
      search/route.ts       POST  Raw Tavily search
      check-keys/route.ts   GET   Key and connectivity diagnostics
    layout.tsx, page.tsx, globals.css
  components/
    Workspace.tsx           App state: chats, Mistake Book, prefs, metrics
    Sidebar.tsx             Views, subjects and lessons, connection status
    ChatView.tsx            Chat, composer, empty state, inline errors
    MessageBubble.tsx       User and assistant bubbles, rule callout, sources
    Markdown.tsx            Styled react-markdown renderer
    MistakeBook.tsx         Insight tracker with filters, search and mastery
    SettingsModal.tsx       Key status, model choice, session metrics, data
    ErrorBanner.tsx
  hooks/usePersistentState.ts
  lib/
    nebius.ts               Nebius client and the strict tutor system prompt
    tavily.ts               Tavily client
    format.ts               Output cleanup and insight extraction
    errors.ts, client.ts, models.ts, subjects.ts, types.ts
```

## API

All errors use one shape: `{ "error": { "code": string, "message": string } }`. Nothing falls back to placeholder content.

| Condition | Status | Code |
| --- | --- | --- |
| Key not set | 500 | `NEBIUS_KEY_MISSING` / `TAVILY_KEY_MISSING` |
| Key rejected upstream | 500 | `NEBIUS_KEY_INVALID` / `TAVILY_KEY_INVALID` |
| Model not available | 502 | `NEBIUS_MODEL_NOT_FOUND` |
| Rate or plan limit | 429 | `NEBIUS_RATE_LIMITED` / `TAVILY_LIMIT_REACHED` |
| Upstream failure / unreachable / timeout | 502 / 504 | `*_UPSTREAM_ERROR`, `*_UNREACHABLE`, `*_TIMEOUT` |
| Bad input | 400 | `BAD_REQUEST`, `UNKNOWN_SUBJECT`, … |

**POST `/api/tutor`**

```json
{ "subjectId": "cpp", "lesson": "Pointers & References", "model": "nvidia/nemotron-3-super-120b-a12b",
  "research": true, "messages": [{ "role": "user", "content": "Pointer vs reference?" }] }
```

Returns `content`, `insight` (`{ topic, rule }` or `null`), `sources`, `model`, `latencyMs`, `usage` and `research`.

**POST `/api/search`**: `{ "query": "...", "maxResults": 5, "depth": "basic" }`

**GET `/api/check-keys`**: returns status, HTTP code and latency for each service, plus which Nemotron models the key can use. Responds 200 when both services connect and 500 otherwise, with the full report in either case. Each check uses one Tavily basic-search credit.

## Notes

- If Live research is on and Tavily fails, the whole request fails. The app does not quietly answer without research.
- The server removes any `<think>` reasoning blocks, turns stray Markdown headers into bold text, and drops filler opening lines. This backs up the system prompt.
- Chats and Mistake Book entries are stored in the browser's `localStorage`.
- Model IDs live in `src/lib/models.ts`. If your Nebius account uses different IDs, edit that file or set `NEBIUS_MODEL`.
