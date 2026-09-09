import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api.js';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // no reintentar errores de cliente (4xx) ni "base no lista" (503)
        if (error instanceof ApiError) {
          if (error.status >= 400 && error.status < 500) return false;
          if (error.code === 'db_not_ready') return false;
        }
        return failureCount < 1;
      },
    },
  },
});
