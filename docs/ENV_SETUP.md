# Environment Setup

This project expects several environment variables to be set for local development and production. The application will fail fast at startup if required server-side environment variables are missing; see `src/config/index.ts` for the exact list and behavior.

Quick start (local):

- Copy the example: `copy .env.example .env` (Windows `cmd.exe`) or `cp .env.example .env` on macOS/Linux.
- Fill in values in `.env` for *server-side* secrets (do NOT commit `.env` to source control).
- Install dependencies: `npm install`
- Run the dev server: `npm run dev`
- Build locally to validate production build: `npm run build`

Vercel / Production:

- Add the same environment variables in the Vercel project settings (do not use the `.env` file in production).
- Keep client-publishable keys prefixed with `VITE_` if they must be exposed to the browser.

Important variables (see `.env.example`):

- `DATABASE_URL` — Postgres connection string for server.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — Supabase project details.
- `CLERK_SECRET_KEY` — Clerk server secret.
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (client-side, safe to expose).
- `OPENAI_API_KEY` — OpenAI secret key.

Security note:

- Never commit secrets to git. Use Vercel's environment variables or a secrets manager in CI.
- If you rotate keys, redeploy the application to ensure services reconnect with fresh credentials.

Troubleshooting:

- If you see `Missing required environment variable: ...` on server startup, ensure the variable is defined in Vercel or in your local `.env` when running locally.
- For build-time errors in Vercel, confirm that all build-time variables exist in the Vercel UI (not just runtime ones).
