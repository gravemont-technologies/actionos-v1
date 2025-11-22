/**
 * Authentication integration layer with Clerk
 * 
 * Provides utilities for getting Clerk user ID and auth headers
 * Optimized for zero race conditions and maximum performance
 */

import { useUser, useAuth } from "@clerk/clerk-react";
import { useState, useEffect, useMemo } from "react";

/**
 * Hook to get current Clerk user ID
 * Must be used inside ClerkProvider context
 */
export function useUserId(): string | null {
  const { user } = useUser();
  return user?.id || null;
}

const TOKEN_CACHE_KEY = 'actionos_clerk_token';
const TOKEN_CACHE_EXPIRY_KEY = 'actionos_token_expiry';
const TOKEN_CACHE_DURATION = 55 * 60 * 1000; // 55 minutes (Clerk tokens expire in 60 min)

/**
 * Get cached token from sessionStorage
 */
function getCachedToken(): string | null {
  try {
    const token = sessionStorage.getItem(TOKEN_CACHE_KEY);
    const expiry = sessionStorage.getItem(TOKEN_CACHE_EXPIRY_KEY);
    
    if (!token || !expiry) return null;
    
    // Check if expired
    if (Date.now() > parseInt(expiry, 10)) {
      sessionStorage.removeItem(TOKEN_CACHE_KEY);
      sessionStorage.removeItem(TOKEN_CACHE_EXPIRY_KEY);
      return null;
    }
    
    return token;
  } catch {
    return null;
  }
}

/**
 * Cache token in sessionStorage
 */
function setCachedToken(token: string): void {
  try {
    const expiry = Date.now() + TOKEN_CACHE_DURATION;
    sessionStorage.setItem(TOKEN_CACHE_KEY, token);
    sessionStorage.setItem(TOKEN_CACHE_EXPIRY_KEY, expiry.toString());
  } catch {
    // Silently fail if sessionStorage unavailable
  }
}

/**
 * Clear cached token (call on sign-out)
 */
export function clearCachedToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_CACHE_KEY);
    sessionStorage.removeItem(TOKEN_CACHE_EXPIRY_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * Hook to get auth headers with Clerk session token
 * Returns stable object that updates when token is fetched
 * Memoized to prevent infinite loops in useEffect dependencies
 * Uses sessionStorage cache to reduce token fetch delay on subsequent mounts
 */
export function useAuthHeaders(): Record<string, string> {
  const userId = useUserId();
  const { getToken } = useAuth();
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (!userId) {
      setHeaders({});
      setIsReady(true);
      return;
    }

    let cancelled = false;
    
    const fetchToken = async () => {
      try {
        // Check cache first
        const cachedToken = getCachedToken();
        if (cachedToken) {
          if (!cancelled) {
            setHeaders({
              "x-clerk-user-id": userId,
              "Authorization": `Bearer ${cachedToken}`,
            });
            setIsReady(true);
          }
          return;
        }

        // Fetch fresh token if not cached
        const token = await getToken();
        if (!cancelled) {
          if (token) {
            setCachedToken(token); // Cache for next time
            setHeaders({
              "x-clerk-user-id": userId,
              "Authorization": `Bearer ${token}`,
            });
          } else {
            setHeaders({ "x-clerk-user-id": userId });
          }
          setIsReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to get Clerk token:", error);
          setHeaders({ "x-clerk-user-id": userId });
          setIsReady(true);
        }
      }
    };

    fetchToken();
    
    return () => {
      cancelled = true;
    };
  }, [userId, getToken]);

  return headers;
}

/**
 * Hook to check if auth headers are ready (token fetched)
 * Use this to prevent API calls before authentication is complete
 * Uses cache check for instant readiness on subsequent mounts
 */
export function useAuthReady(): boolean {
  const userId = useUserId();
  const { getToken } = useAuth();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (!userId) {
      setIsReady(true);
      return;
    }

    let cancelled = false;
    
    const checkAuth = async () => {
      try {
        // Check cache first - instant ready if cached
        const cachedToken = getCachedToken();
        if (cachedToken) {
          if (!cancelled) setIsReady(true);
          return;
        }

        // Otherwise wait for token fetch
        await getToken();
        if (!cancelled) setIsReady(true);
      } catch (error) {
        if (!cancelled) setIsReady(true);
      }
    };

    checkAuth();
    
    return () => {
      cancelled = true;
    };
  }, [userId, getToken]);

  return isReady;
}

/**
 * Legacy function for non-hook contexts
 * Returns null if not in Clerk context
 * Prefer useUserId() hook when possible
 */
export function getUserId(): string | null {
  // This is a fallback - prefer using useUserId() hook
  // In non-React contexts, this will return null
  return null;
}

/**
 * Legacy function for non-hook contexts
 * Returns empty object if not in Clerk context
 * Prefer useAuthHeaders() hook when possible
 */
export function getAuthHeaders(): Record<string, string> {
  const userId = getUserId();
  if (!userId) return {};
  return { "x-clerk-user-id": userId };
}

