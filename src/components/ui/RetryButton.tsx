import React from 'react';
import { Button } from './Button';
import { ProjectError } from '../../lib/utils/error-handling';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface RetryButtonProps {
  error: ProjectError;
  onRetry: () => void;
  isLoading?: boolean;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
  disabled?: boolean;
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  error,
  onRetry,
  isLoading = false,
  retryCount = 0,
  maxRetries = 3,
  className,
  disabled = false,
}) => {
  const canRetry = error.retryable && retryCount < maxRetries;
  const hasRetriesLeft = retryCount < maxRetries;

  const handleRetry = () => {
    if (!canRetry || isLoading || disabled) return;

    onRetry();
  };

  if (!error.retryable) {
    return null;
  }

  const getRetryText = () => {
    if (isLoading) return 'Retrying...';
    if (retryCount === 0) return 'Retry';
    if (hasRetriesLeft) return `Retry (${retryCount}/${maxRetries})`;
    return 'Max retries reached';
  };

  const getVariant = () => {
    if (!hasRetriesLeft) return 'outline';
    return retryCount === 0 ? 'default' : 'outline';
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant={getVariant()}
        size="sm"
        onClick={handleRetry}
        disabled={!canRetry || isLoading || disabled}
        className={className}
        aria-label={`Retry operation. ${retryCount > 0 ? `Attempt ${retryCount} of ${maxRetries}` : ''}`}
      >
        {isLoading ? (
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-2" />
        )}
        {getRetryText()}
      </Button>
      
      {retryCount > 0 && hasRetriesLeft && (
        <div className="flex items-center text-sm text-muted-foreground">
          <AlertCircle className="h-3 w-3 mr-1" />
          {maxRetries - retryCount} attempts remaining
        </div>
      )}
      
      {!hasRetriesLeft && (
        <div className="flex items-center text-sm text-destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Maximum retry attempts reached
        </div>
      )}
    </div>
  );
};

export default RetryButton;
