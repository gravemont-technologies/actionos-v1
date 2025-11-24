import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import { verifyClerkJwtToken } from './utils/clerkTokenVerifier.js';

/**
 * An optional authentication middleware for Clerk.
 * If a valid token is provided in the Authorization header, it will be verified,
 * and `res.locals.userId` and `res.locals.sessionId` will be set.
 * If no token is provided, it will simply pass through to the next middleware
 * without setting any user information and without erroring.
 * It will only error if a token is provided but is invalid.
 */
export async function optionalClerkAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

    // If no token is present, just continue to the next middleware.
    if (!token) {
      return next();
    }

    // A token is present, so we attempt to verify it.
    const { userId, sessionId } = await verifyClerkJwtToken(token);

    if (userId) {
      res.locals.userId = userId;
      res.locals.sessionId = sessionId ?? undefined;
    }
    
    next();
  } catch (error: any) {
    if (error.code && error.statusCode) {
      return next(error);
    }

    const message = error?.message || 'Authentication failed';
    console.error('[optionalClerkAuth] TOKEN_INVALID:', message);
    next(new AppError('TOKEN_INVALID', message, 401));
  }
}
