// config/index.ts
// Centralized environment config and validation.

type Config = {
  NODE_ENV: 'production' | 'development' | 'test';
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DATABASE_URL: string;
  SUPABASE_DATABASE_URL: string;
  VITE_CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
};

function missing(name: string): never {
  throw new Error(`Missing required environment variable: ${name}`);
}

const env = process.env;

const config: Config = {
  NODE_ENV: (env.NODE_ENV as any) || 'development',
  SUPABASE_URL: env.SUPABASE_URL || missing('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY || missing('SUPABASE_SERVICE_ROLE_KEY'),
  DATABASE_URL: env.DATABASE_URL || missing('DATABASE_URL'),
  SUPABASE_DATABASE_URL: env.SUPABASE_DATABASE_URL || missing('SUPABASE_DATABASE_URL'),
  VITE_CLERK_PUBLISHABLE_KEY: env.VITE_CLERK_PUBLISHABLE_KEY || missing('VITE_CLERK_PUBLISHABLE_KEY'),
  CLERK_SECRET_KEY: env.CLERK_SECRET_KEY || missing('CLERK_SECRET_KEY'),
  OPENAI_API_KEY: env.OPENAI_API_KEY || missing('OPENAI_API_KEY'),
  OPENAI_MODEL: env.OPENAI_MODEL || 'gpt-4o-mini',
};

export default config;
```