/**
 * Clerk Token Verification Middleware
 *
 * Verifies Clerk JWT tokens against Clerk's JWKS using `jose` utilities
 * to ensure consistent behavior across edge/server environments.
 * Extracts user ID from the verified token and attaches it to the request.
 * Handles token expiration and invalid tokens.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import { verifyClerkJwtToken } from './utils/clerkTokenVerifier.js';

/**
 * Middleware to verify a Clerk JWT token.
 * It extracts the token from the Authorization header, verifies it against the Clerk JWKS,
 * and attaches the user ID and session ID to `res.locals`.
 *
 * This middleware provides robust error handling by passing structured `AppError`
 * instances to the central error handler.
 */
export async function clerkAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return next(new AppError('NO_TOKEN', 'Missing authentication token', 401));
    }

    const { userId, sessionId } = await verifyClerkJwtToken(token);

    // Store in res.locals (type-safe due to src/types/express.d.ts)
    res.locals.userId = userId;
    res.locals.sessionId = sessionId ?? undefined;
    
    next();
  } catch (error: any) {
    const errorCode = error.code || 'TOKEN_INVALID';
    const errorMessage = error.message || 'Authentication failed';
    
    console.error(`[clerkAuth] ${errorCode}:`, errorMessage);
    
    // Pass a structured AppError to the central error handler
    next(new AppError(errorCode, 'Authentication failed', 401));
  }
}

/**
 * Optional middleware - only verifies if token is present
 * Useful for routes that work with or without authentication
 */
export async function optionalClerkAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Try to verify, but don't fail if no token
  const authHeader = req.header("authorization");
  const tokenHeader = req.header("x-clerk-token");

  if (!authHeader && !tokenHeader) {
    // No token present, skip verification
    return next();
  }

  // Token present, verify it
  return clerkAuthMiddleware(req, res, next);
}

