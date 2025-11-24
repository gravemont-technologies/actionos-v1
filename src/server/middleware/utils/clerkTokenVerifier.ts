import { createRemoteJWKSet, decodeJwt, jwtVerify, JWTPayload } from "jose";
import { AppError } from "../errorHandler.js";

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function normalizeIssuer(rawIssuer: string): string {
  return rawIssuer.endsWith("/") ? rawIssuer.slice(0, -1) : rawIssuer;
}

function getAudience(): string | string[] | undefined {
  const raw = process.env.CLERK_JWT_AUDIENCE;
  if (!raw) {
    return undefined;
  }

  const parts = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return undefined;
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return parts;
}

export interface ClerkVerificationResult {
  payload: JWTPayload;
  userId: string;
  sessionId: string | null;
}

export async function verifyClerkJwtToken(token: string): Promise<ClerkVerificationResult> {
  if (!token || !token.includes(".")) {
    throw new AppError("TOKEN_MALFORMED", "Malformed authentication token", 401);
  }

  const decoded = decodeJwt(token);
  const issuerClaim = decoded.iss;
  if (typeof issuerClaim !== "string" || !issuerClaim.length) {
    throw new AppError("TOKEN_MISSING_ISS", "Token missing issuer claim", 401);
  }

  const issuer = normalizeIssuer(issuerClaim);
  let jwks = jwksCache.get(issuer);
  if (!jwks) {
    try {
      jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`), {
        timeoutDuration: 5000,
      });
      jwksCache.set(issuer, jwks);
    } catch (error: any) {
      throw new AppError(
        "JWKS_INIT_FAILED",
        `Unable to initialise JWKS client: ${error.message ?? "unknown error"}`,
        503
      );
    }
  }

  try {
    const audience = getAudience();
    const verificationOptions: {
      issuer: string;
      audience?: string | string[];
    } = { issuer };

    if (audience) {
      verificationOptions.audience = audience;
    }

    const { payload } = await jwtVerify(token, jwks, verificationOptions);

    const userId =
      (typeof payload.sub === "string" && payload.sub) ||
      (typeof (payload as any).userId === "string" && (payload as any).userId);

    if (!userId) {
      throw new AppError("TOKEN_MISSING_USERID", "Token is valid but missing subject", 401);
    }

    const sessionId =
      (typeof payload.sid === "string" && payload.sid) ||
      (typeof payload.jti === "string" && payload.jti) ||
      null;

    return { payload, userId, sessionId };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    const message = error?.message ?? "Token verification failed";
    throw new AppError("TOKEN_VERIFY_FAILED", message, 401);
  }
}
