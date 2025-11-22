import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import type { Database } from "../../types/database.types";

/* -----------------------------------------------------
 * SINGLETON SUPABASE CLIENT
 * ---------------------------------------------------*/

let supabase: SupabaseClient;

/**
 * Get Supabase client with connection pooling
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabase) return supabase;

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  }

  supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: { schema: "public" },
      global: {
        headers: {
          "x-client-info": "action-os-server",
        },
      },
    }
  );

  logger.info("Supabase client initialized.");

  return supabase;
}

/* -----------------------------------------------------
 * SCHEMA VALIDATION
 * ---------------------------------------------------*/

export async function validateDatabaseSchema(): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const client = getSupabaseClient();

    const { error } = await client.from("profiles").select("profile_id").limit(1);

    if (error) {
      const message = error.message ?? "";

      if (message.includes("schema") || message.includes("table") || message.includes("PGRST205")) {
        return {
          valid: false,
          error: "Database schema not initialized. Run supabase/schema.sql inside your Supabase SQL Editor.",
        };
      }

      return { valid: false, error: `Database connection issue: ${message}` };
    }

    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: `Database validation failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

/* -----------------------------------------------------
 * QUERY EXECUTION WITH RETRY + TIMEOUT
 * ---------------------------------------------------*/

export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>,
  options: { maxRetries?: number; timeoutMs?: number; allowNull?: boolean } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const allowNull = options.allowNull ?? false;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), timeoutMs)
      );

      const result = await Promise.race([queryFn(), timeoutPromise]);

      if (result.error) throw result.error;

      if (result.data === null && !allowNull) {
        throw new Error("Query returned null data");
      }

      return result.data as T;
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error);

      // Errors that should NOT retry
      if (msg.includes("timeout") || msg.includes("PGRST")) {
        logger.warn({ attempt: attempt + 1, error: msg }, "Non-retryable query error");
        throw error;
      }

      // Retry if possible
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * 2 ** attempt, 5000);
        logger.warn(
          { attempt: attempt + 1, delay, error: msg },
          "Query failed, retrying"
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  logger.error({ error: lastError }, "Query failed after all retries");
  throw lastError;
}
