# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

BuildLens AI is a Next.js 16 (App Router) construction bidding intelligence MVP. No Docker, no auth — UI state is React Context; durable File Search IDs + workspace data live in Supabase.

### Services

| Service | How to run | Notes |
|---------|-----------|-------|
| Next.js dev server | `npm run dev` | Serves on http://localhost:3000 |
| Google Gemini API | Set `GEMINI_API_KEY` in `.env.local` | Required for AI routes + File Search |
| Supabase | Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Persist File Search IDs, SOV, plan takeoff, estimate, chats |

### Commands

- **Lint:** `npm run lint`
- **Build:** `npm run build`
- **Dev:** `npm run dev`

### Non-obvious notes

- The app works without `GEMINI_API_KEY` for non-AI pages (Opportunities, Estimate Draft UI). AI features need the key.
- Without Supabase env vars, File Search ensure / workspace APIs return `MISSING_SUPABASE`. Spec/plan still work via PDF `inlineData` fallback when bytes are available.
- Spec PDFs are uploaded **once** to a Gemini File Search store (`buildlens-specs`). Mapping `file_key = "{projectId}::{normalizedFileName}"` is stored in `file_search_docs`. Reopening skips re-chunking.
- Workspace persistence: `workspace_snapshots` (SOV + plan takeoff + active chat), `estimate_drafts` (rows + unit prices per project), `file_chats` (multi-tab chat history per file).
- Apply schema: run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
- Next.js 16 uses Turbopack by default in dev mode.
- No test framework is configured — there are no automated test suites to run.
- `.env.local` is gitignored; create it from `.env.example`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
