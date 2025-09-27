import { useState, useCallback } from 'react';
import { ProjectError, createProjectError } from '../lib/utils/error-handling';
import { showToast } from '../lib/toast';

interface RetryState {
  error: ProjectError | null;
  isLoading: boolean;
  retryCount: number;
  maxRetries: number;
}

interface UseRetryStateOptions {
  maxRetries?: number;
  onRetrySuccess?: () => void;
  onRetryFailure?: (error: ProjectError) => void;
  onMaxRetriesReached?: (error: ProjectError) => void;
}

interface UseRetryStateReturn {
  error: ProjectError | null;
  isLoading: boolean;
  retryCount: number;
  maxRetries: number;
  setError: (error: ProjectError | null) => void;
  setLoading: (loading: boolean) => void;
  retry: (retryFn: () => Promise<void>) => Promise<void>;
  reset: () => void;
  canRetry: boolean;
}

export const useRetryState = (options: UseRetryStateOptions = {}): UseRetryStateReturn => {
  const {
    maxRetries = 3,
    onRetrySuccess,
    onRetryFailure,
    onMaxRetriesReached,
  } = options;

  const [state, setState] = useState<RetryState>({
    error: null,
    isLoading: false,
    retryCount: 0,
    maxRetries,
  });



  const setError = useCallback((error: ProjectError | null) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      error: null,
      isLoading: false,
      retryCount: 0,
      maxRetries,
    });
  }, [maxRetries]);

  const retry = useCallback(async (retryFn: () => Promise<void>) => {
    const { error, retryCount } = state;
    
    if (!error?.retryable || retryCount >= maxRetries) {
      if (retryCount >= maxRetries && onMaxRetriesReached) {
        onMaxRetriesReached(error!);
      }
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
    }));

    try {
      await retryFn();
      
      // Success - reset state and notify
      setState(prev => ({
        ...prev,
        error: null,
        isLoading: false,
        retryCount: 0,
      }));
      
      showToast.success('Operation completed successfully');
      
      if (onRetrySuccess) {
        onRetrySuccess();
      }
    } catch (err) {
      const newRetryCount = retryCount + 1;
      let projectError: ProjectError;

      if (err instanceof ProjectError) {
        projectError = err;
      } else {
        projectError = createProjectError(
          'FORM_SUBMISSION_ERROR',
          err instanceof Error ? err.message : 'Unknown error occurred',
          { originalError: err }
        );
      }

      setState(prev => ({
        ...prev,
        error: projectError,
        isLoading: false,
        retryCount: newRetryCount,
      }));

      if (newRetryCount >= maxRetries) {
        showToast.error('Maximum retry attempts reached');
        if (onMaxRetriesReached) {
          onMaxRetriesReached(projectError);
        }
      } else if (projectError.retryable) {
        showToast.error(`Retry failed. ${maxRetries - newRetryCount} attempts remaining.`);
      } else {
        showToast.error('Operation failed and cannot be retried');
      }

      if (onRetryFailure) {
        onRetryFailure(projectError);
      }
    }
  }, [state, maxRetries, onRetrySuccess, onRetryFailure, onMaxRetriesReached]);

  const canRetry = Boolean(
    state.error?.retryable &&
    state.retryCount < maxRetries &&
    !state.isLoading
  );

  return {
    error: state.error,
    isLoading: state.isLoading,
    retryCount: state.retryCount,
    maxRetries: state.maxRetries,
    setError,
    setLoading,
    retry,
    reset,
    canRetry,
  };
};

export default useRetryState;
