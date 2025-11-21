# Deploying the database schema

This document shows how to apply `supabase/schema.sql` to your database safely.

Prerequisites
- `psql` (Postgres CLI) available in PATH
- `DATABASE_URL` environment variable set to the target database connection string (service-role URL for Supabase migrations recommended)

Windows (PowerShell)
```powershell
$env:DATABASE_URL = "postgres://user:password@host:5432/dbname"
psql -d $env:DATABASE_URL -f supabase/schema.sql
```

Windows (cmd.exe)
```cmd
set DATABASE_URL=postgres://user:password@host:5432/dbname
psql -d %DATABASE_URL% -f supabase/schema.sql
```

POSIX (macOS / Linux)
```bash
export DATABASE_URL="postgres://user:password@host:5432/dbname"
psql "$DATABASE_URL" -f supabase/schema.sql
```

Notes
- For Supabase, prefer using the service role connection string (found in project settings) when applying schema changes from CI or trusted machines.
- Running the `inverse-schema.sql` first will drop existing objects. Use with caution.
- If `psql` is not available, use the Supabase console SQL editor to paste and run `supabase/schema.sql`.

NPM Shortcut
```bash
# Requires NODE_ENV and DATABASE_URL to be set; script runs `psql` under the hood
npm run db:apply-schema
```
