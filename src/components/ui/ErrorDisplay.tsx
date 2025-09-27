import React from 'react';
import { ProjectError } from '../../lib/utils/error-handling';
import { RetryButton } from './RetryButton';
import { AlertTriangle, XCircle, WifiOff, Server } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ErrorDisplayProps {
  error: ProjectError | null;
  onRetry?: () => void;
  isLoading?: boolean;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
  showRetryButton?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  isLoading = false,
  retryCount = 0,
  maxRetries = 3,
  className,
  showRetryButton = true,
}) => {
  if (!error) return null;

  const getErrorIcon = () => {
    // Derive category from error code
    const category = getErrorCategory(error.code);
    switch (category) {
      case 'network':
        return <WifiOff className="h-5 w-5" />;
      case 'server':
        return <Server className="h-5 w-5" />;
      case 'validation':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <XCircle className="h-5 w-5" />;
    }
  };

  const getErrorCategory = (code: string): string => {
    if (code.includes('NETWORK')) return 'network';
    if (code.includes('SERVER') || code.includes('PAYLOAD_API')) return 'server';
    if (code.includes('VALIDATION')) return 'validation';
    return 'client';
  };

  const getErrorSeverityClass = () => {
    // Derive severity from error code - keep UI minimal if severity is not available
    const severity = getErrorSeverity(error.code);
    switch (severity) {
      case 'high':
        return 'border-destructive bg-destructive/5 text-destructive';
      case 'medium':
        return 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300';
      case 'low':
        return 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
      default:
        return 'border-destructive bg-destructive/5 text-destructive';
    }
  };

  const getErrorSeverity = (code: string): string => {
    if (code.includes('SERVER') || code.includes('NETWORK')) return 'high';
    if (code.includes('VALIDATION') || code.includes('PERMISSION')) return 'medium';
    return 'low';
  };

  const formatErrorMessage = (message: string) => {
    // Clean up technical error messages for better user experience
    if (message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    if (message.includes('timeout')) {
      return 'The request took too long to complete. Please try again.';
    }
    if (message.includes('500')) {
      return 'Server error occurred. Please try again in a moment.';
    }
    return message;
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4 space-y-3',
        getErrorSeverityClass(),
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getErrorIcon()}
        </div>
        <div className="flex-1 space-y-2">
          <div className="font-medium">
            {(() => {
              const category = getErrorCategory(error.code);
              switch (category) {
                case 'network': return 'Connection Error';
                case 'server': return 'Server Error';
                case 'validation': return 'Validation Error';
                case 'client': return 'Client Error';
                default: return 'Error';
              }
            })()}
          </div>
          <div className="text-sm">
            {formatErrorMessage(error.message)}
          </div>
          {error.context && (
            <details className="text-xs opacity-75">
              <summary className="cursor-pointer hover:opacity-100">
                Technical details
              </summary>
              <pre className="mt-2 whitespace-pre-wrap font-mono">
                {JSON.stringify(error.context, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
      
      {showRetryButton && error.retryable && onRetry && (
        <div className="pt-2">
          <RetryButton
            error={error}
            onRetry={onRetry}
            isLoading={isLoading}
            retryCount={retryCount}
            maxRetries={maxRetries}
          />
        </div>
      )}
    </div>
  );
};

export default ErrorDisplay;
