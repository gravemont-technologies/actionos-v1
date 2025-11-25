/**
 * Centralized authentication mocking for tests
 * 
 * CRITICAL: clerkAuthMiddleware stores userId in res.locals.userId, NOT req.userId
 * This module provides proper mocking that matches production behavior.
 */

import { Request, Response, NextFunction } from "express";

/**
 * Mock authentication middleware for tests
 * Matches production clerkAuthMiddleware signature: stores in res.locals.userId
 */
export function mockClerkAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = req.headers["x-clerk-user-id"] as string;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized: Missing x-clerk-user-id header" });
    return;
  }

  // CRITICAL: Match production behavior - store in res.locals, NOT req
  res.locals.userId = userId;
  next();
}

/**
 * Create test profile data matching schema
 */
export function createTestProfile(profileId: string, userId: string) {
  return {
    profile_id: profileId,
    user_id: userId,
    tags: ["SYSTEMATIC", "ACTION_READY"],
    baseline_ipp: 65,
    baseline_but: 72,
    strengths: ["Quick execution", "Strategic thinking"],
  };
}

/**
 * Compute simplified test signature (for non-crypto tests)
 */
export function computeTestSignature(payload: Record<string, any>): string {
  return Buffer.from(JSON.stringify(payload))
    .toString("hex")
    .slice(0, 64)
    .padEnd(64, "0");
}
