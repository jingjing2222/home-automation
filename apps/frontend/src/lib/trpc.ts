import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../backend/src/router';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${backendUrl}/trpc`,
    }),
  ],
});
