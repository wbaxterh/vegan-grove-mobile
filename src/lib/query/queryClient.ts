/** Single TanStack Query client. Mounted in `app/_layout.tsx`, used by places and events. */

import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/lib/api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      // Retry network blips, never a 4xx: the server already said no.
      retry: (failureCount, error) => {
        if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});
