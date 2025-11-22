import { Button } from "./ui/button";

interface ProfileErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Fallback UI for ProfileProvider errors
 * Shows user-friendly error message when profile auto-creation fails
 * Prevents white screen crashes
 */
export function ProfileErrorFallback({ error, resetErrorBoundary }: ProfileErrorFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md text-center space-y-4">
        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-foreground">Profile Error</h1>
        
        <p className="text-sm text-muted-foreground">
          We encountered an error while setting up your profile. This is usually temporary and can be fixed by refreshing.
        </p>

        <div className="bg-muted p-3 rounded-md">
          <p className="text-xs font-mono text-left text-muted-foreground break-words">
            {error.message || "Unknown error"}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button 
            onClick={() => window.location.reload()} 
            variant="default"
          >
            Refresh Page
          </Button>
          <Button 
            onClick={resetErrorBoundary} 
            variant="outline"
          >
            Try Again
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          If this persists, please contact support.
        </p>
      </div>
    </div>
  );
}
