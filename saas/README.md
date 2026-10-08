# 62joules SaaS frontend

Next.js (App Router) wrapper around the listing engine in `../src`. Deployed to
Vercel with this directory as the project root. Auth is Supabase magic link;
data lives in the `devices` / `device_listings` / `runs` tables of the
`veille` Supabase project.

## Env vars (set in Vercel, see `.env.example`)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project.
- `PYTHON_ENGINE_URL` — base URL of the deployed `engine_api.py` service (see
  `../Dockerfile.engine`; not hosted on Vercel — needs a container host such
  as Render or Railway).
- `PYTHON_ENGINE_API_KEY` — must match `ENGINE_API_KEY` on that service.

## Flow
1. Sign in via magic link.
2. Upload an `.xlsx` inventory on the dashboard.
3. `/api/generate` forwards it to the Python engine, then writes the
   resulting devices + per-platform listings into Supabase.
