# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

BuildLens AI is a Next.js 16 (App Router) construction bidding intelligence MVP. Auth and durable workspace data live in Supabase; UI state is React Context plus per-user DB rows.

### Services

| Service | How to run | Notes |
|---------|-----------|-------|
| Next.js dev server | `npm run dev` | http://localhost:3000 |
| Supabase Auth | Email/password | Gate all app routes except `/login`, `/signup` |
| OpenAI | Per-user key in Settings (encrypted) or optional `OPENAI_API_KEY` bootstrap | File Search + Spec when indexed |
| Google Gemini | `GEMINI_API_KEY` | PDF inline fallback + plan extract + ai-select-file |

### Commands

- **Lint:** `npm run lint`
- **Build:** `npm run build`
- **Dev:** `npm run dev`

### Schema

1. Run [`supabase/schema.sql`](supabase/schema.sql) (base tables).
2. Run [`supabase/migrations/001_auth_per_user.sql`](supabase/migrations/001_auth_per_user.sql) (profiles, `user_id`, RLS, `user_projects`). **Truncates** existing workspace rows.
3. Run [`supabase/migrations/002_portal_bids_cache.sql`](supabase/migrations/002_portal_bids_cache.sql) (shared open-bids cache).

### Env

See [`.env.example`](.env.example). Required for auth:

- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (rare admin only)
- `APP_ENCRYPTION_KEY` (32-byte base64) for OpenAI key encryption
- `GEMINI_API_KEY`; optional `OPENAI_API_KEY` only if user has not saved a key yet

### Product surfaces

- **Opportunities** — open bids from DB cache; Refresh re-scrapes OpenGov.
- **My Work** — user's saved projects; open restores DB state without re-AI.
- **Settings** — preferred model + encrypted OpenAI API key.
- Workspace tables are scoped by `auth.uid()` (RLS).

### Non-obvious notes

- Middleware blocks unauthenticated access to pages and `/api/*` (except `/api/auth/session`).
- Auth session is an httpOnly cookie (`sb-buildlens-auth`); set via `POST /api/auth/session` after login/signup.
- File Search ensure uses the **user's** OpenAI key (decrypted server-side).
- Next.js 16 uses Turbopack by default in dev.
- No automated test suite.
