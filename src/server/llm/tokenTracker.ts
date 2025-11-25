// Token usage tracker to enforce 50,000 token limit per user per day
import { getSupabaseClient } from "../db/supabase.js";
import { logger } from "../utils/logger.js";

class TokenTracker {
  private readonly MAX_TOKENS_PER_USER_PER_DAY = 50000;
  private readonly WARNING_THRESHOLD = 40000; // Warn at 80%

  /**
   * Estimate tokens for a request (rough approximation: ~4 characters per token)
   * @param systemPrompt System prompt text
   * @param userPrompt User prompt text
   * @param maxOutputTokens Maximum output tokens requested
   * @returns Estimated total tokens (input + output)
   */
  estimateTokens(systemPrompt: string, userPrompt: string, maxOutputTokens: number): number {
    const inputChars = systemPrompt.length + userPrompt.length;
    const estimatedInputTokens = Math.ceil(inputChars / 4);
    return estimatedInputTokens + maxOutputTokens;
  }

  /**
   * Get current day's token usage for a user
   * Uses unique constraint index (user_id, date) for O(1) lookup
   * Trigger ensures one row per user per day with accumulated tokens
   */
  private async getTodayUsage(userId: string): Promise<number> {
    try {
      const supabase = getSupabaseClient();
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Unique constraint ensures one row per user per day - direct lookup, no SUM needed
      const { data, error } = await supabase
        .from("token_usage" as any)
        .select("tokens_used")
        .eq("user_id", userId)
        .eq("date", today)
        .single();

      if (error) {
        // PGRST116 is "not found" which is acceptable (no usage yet today)
        if (error.code === "PGRST116") {
          return 0;
        }
        logger.warn({ userId, error }, "Failed to fetch token usage");
        return 0;
      }

      return (data as any)?.tokens_used ?? 0;
    } catch (error) {
      logger.error({ userId, error }, "Error fetching token usage");
      return 0;
    }
  }

  /**
   * Check if adding tokens would exceed the daily limit for a user
   * @param userId User ID (Clerk user ID)
   * @param tokensToAdd Estimated tokens for the request
   * @returns true if allowed, false if would exceed limit
   */
  async canUseTokens(userId: string | null, tokensToAdd: number): Promise<boolean> {
    if (!userId) {
      // Allow if no user ID (development/testing)
      return true;
    }

    try {
      const currentUsage = await this.getTodayUsage(userId);
      return currentUsage + tokensToAdd <= this.MAX_TOKENS_PER_USER_PER_DAY;
    } catch (error) {
      logger.error({ userId, error }, "Error checking token limit");
      // Fail open in case of error (allow request)
      return true;
    }
  }

  /**
   * Record token usage after a request
   * @param userId User ID (Clerk user ID)
   * @param tokensUsed Actual tokens used (from API response if available, otherwise estimated)
   */
  async recordUsage(userId: string | null, tokensUsed: number): Promise<void> {
    if (!userId) {
      // Skip persistence if no user ID (development/testing)
      logger.debug({ tokensUsed }, "Token usage recorded (no user ID)");
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Primary: Use database function for optimal token accumulation (atomic UPSERT with increment)
      // Function handles INSERT or UPDATE with token accumulation atomically
      const { data: funcData, error: funcError } = await supabase.rpc("increment_token_usage" as any, {
        p_user_id: userId,
        p_tokens: tokensUsed,
        p_date: today,
      } as any);

      if (funcError) {
        // Fallback: If function fails (e.g. permissions), try manual fetch-update
        // This handles cases where the RPC might not be available or has permission issues
        logger.warn({ userId, error: funcError }, "RPC increment_token_usage failed, falling back to manual update");
        
        // 1. Get current usage
        const { data: currentData, error: fetchError } = await supabase
          .from("token_usage" as any)
          .select("tokens_used")
          .eq("user_id", userId)
          .eq("date", today)
          .maybeSingle();

        if (fetchError) throw fetchError;

        const currentTokens = (currentData as any)?.tokens_used || 0;
        const newTokens = currentTokens + tokensUsed;

        // 2. Upsert new usage
        const { error: upsertError } = await supabase
          .from("token_usage" as any)
          .upsert(
            {
              user_id: userId,
              date: today,
              tokens_used: newTokens,
              updated_at: new Date().toISOString(),
            } as any,
            { onConflict: "user_id,date" }
          );

        if (upsertError) throw upsertError;
      }
    } catch (error) {
      logger.error({ userId, error }, "Error recording token usage");
      // Don't throw - token recording failure shouldn't block the user
    }
  }

  /**
   * Refund tokens to a user (e.g. for failed requests or system errors)
   * @param userId User ID (Clerk user ID)
   * @param tokensToRefund Amount of tokens to refund
   */
  async refundTokens(userId: string | null, tokensToRefund: number): Promise<void> {
    if (!userId || tokensToRefund <= 0) return;

    try {
      // Use negative value to decrement usage
      // The database constraint (tokens_used >= 0) ensures we don't go below zero
      // If usage would go below zero, the transaction will fail, which is acceptable (can't refund what wasn't used)
      await this.recordUsage(userId, -tokensToRefund);
      logger.info({ userId, tokensRefunded: tokensToRefund }, "Tokens refunded");
    } catch (error) {
      logger.error({ userId, error }, "Error refunding tokens");
    }
  }

  /**
   * Get current token usage statistics for a user
   */
  async getUsage(userId: string | null): Promise<{
    used: number;
    remaining: number;
    limit: number;
    percentage: number;
  }> {
    if (!userId) {
      return {
        used: 0,
        remaining: this.MAX_TOKENS_PER_USER_PER_DAY,
        limit: this.MAX_TOKENS_PER_USER_PER_DAY,
        percentage: 0,
      };
    }

    try {
      const used = await this.getTodayUsage(userId);
      const remaining = Math.max(0, this.MAX_TOKENS_PER_USER_PER_DAY - used);
      const percentage = Math.round((used / this.MAX_TOKENS_PER_USER_PER_DAY) * 100);

      return {
        used,
        remaining,
        limit: this.MAX_TOKENS_PER_USER_PER_DAY,
        percentage,
      };
    } catch (error) {
      logger.error({ userId, error }, "Error getting token usage");
      return {
        used: 0,
        remaining: this.MAX_TOKENS_PER_USER_PER_DAY,
        limit: this.MAX_TOKENS_PER_USER_PER_DAY,
        percentage: 0,
      };
    }
  }

  /**
   * Check if daily limit has been reached for a user
   */
  async isLimitReached(userId: string | null): Promise<boolean> {
    if (!userId) {
      return false;
    }

    try {
      const usage = await this.getTodayUsage(userId);
      return usage >= this.MAX_TOKENS_PER_USER_PER_DAY;
    } catch (error) {
      logger.error({ userId, error }, "Error checking if limit reached");
      return false;
    }
  }
}

export const tokenTracker = new TokenTracker();

// Backwards-compatible alias used by older tests
// Keep this exported method to avoid breaking tests expecting `getUsageStats`
// Delegates to `getUsage` which returns the same shape
;(tokenTracker as any).getUsageStats = async function (userId: string | null) {
  return tokenTracker.getUsage(userId);
};
