import type { AppRouter } from '@griffins-scout/api';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import superjson from 'superjson';

const trpcUrl =
  import.meta.env.VITE_TRPC_URL ||
  new URL('trpc', `${window.location.origin}${import.meta.env.BASE_URL}`).toString();

export const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: trpcUrl,
    }),
  ],
  transformer: superjson,
});

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
