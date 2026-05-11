# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

BuildLens AI is a Next.js 16 (App Router) construction bidding intelligence MVP. No database, no Docker, no auth — all state is client-side React Context.

### Services

| Service | How to run | Notes |
|---------|-----------|-------|
| Next.js dev server | `npm run dev` | Serves on http://localhost:3000 |
| Google Gemini API | Set `GEMINI_API_KEY` in `.env.local` | Required for AI routes (`/api/spec-extract`, `/api/spec-chat`, `/api/plan-extract`) |

### Commands

- **Lint:** `npm run lint`
- **Build:** `npm run build`
- **Dev:** `npm run dev`

### Non-obvious notes

- The app works fully without `GEMINI_API_KEY` for non-AI pages (Opportunities, Estimate Draft). AI features (Spec Analysis upload, Plan Takeoff upload) will return errors without the key.
- Next.js 16 uses Turbopack by default in dev mode.
- No test framework is configured — there are no automated test suites to run.
- `.env.local` is gitignored; create it from `.env.example` with your Gemini key.
