/**
 * Authentication integration layer with Clerk
 * 
 * Provides utilities for getting Clerk user ID and auth headers
 * Note: getUserId() can only be used inside ClerkProvider context
 */

import { useUser, useAuth } from "@clerk/clerk-react";
import { useMemo, useEffect, useState } from "react";

/**
 * Hook to get current Clerk user ID
 * Must be used inside ClerkProvider context
 */
export function useUserId(): string | null {
  const { user } = useUser();
  return user?.id || null;
}

/**
 * Hook to get auth headers with Clerk session token
 * CRITICAL: Includes both Authorization Bearer token and x-clerk-user-id for compatibility
 * Must be used inside ClerkProvider context
 */
export function useAuthHeaders(): Record<string, string> {
  const userId = useUserId();
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const sessionToken = await getToken();
        setToken(sessionToken);
      } catch (error) {
        console.error("Failed to get Clerk token:", error);
        setToken(null);
      }
    };

    if (userId) {
      fetchToken();
    }
  }, [userId, getToken]);

  // Memoize to ensure stable reference
  return useMemo((): Record<string, string> => {
    if (!userId) return {};
    
    const headers: Record<string, string> = {
      "x-clerk-user-id": userId,
    };
    
    // Add Authorization header if token is available
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    return headers;
  }, [userId, token]);
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

