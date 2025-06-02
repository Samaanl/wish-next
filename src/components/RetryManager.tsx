import React, { useState } from "react";

interface RetryManagerProps {
  maxRetries?: number;
  retryDelay?: number;
  onRetry: () => Promise<void>;
  children: (retryFn: () => void, retryState: RetryState) => React.ReactNode;
}

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
  canRetry: boolean;
}

const RetryManager: React.FC<RetryManagerProps> = ({
  maxRetries = 3,
  retryDelay = 1000,
  onRetry,
  children,
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleRetry = async () => {
    if (retryCount >= maxRetries || isRetrying) {
      return;
    }

    setIsRetrying(true);
    setLastError(null);

    try {
      // Add delay before retry for better UX
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      await onRetry();
      setRetryCount(0); // Reset on success
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Retry failed";
      setLastError(errorMessage);
      setRetryCount((prev) => prev + 1);
      console.warn(
        `Retry ${retryCount + 1}/${maxRetries} failed:`,
        errorMessage
      );
    } finally {
      setIsRetrying(false);
    }
  };

  const retryState: RetryState = {
    isRetrying,
    retryCount,
    maxRetries,
    lastError,
    canRetry: retryCount < maxRetries && !isRetrying,
  };

  return <>{children(handleRetry, retryState)}</>;
};

export default RetryManager;
