import type { AppRouter } from '../../../controller/src/server';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { inferRouterOutputs } from '@trpc/server';
import superjson from 'superjson';

const AUTH_TOKEN_KEY = 'griffins-scout-viewer-auth-token';

const trpcUrl =
  import.meta.env.VITE_TRPC_URL ||
  new URL('trpc', `${window.location.origin}${import.meta.env.BASE_URL}`).toString();

let authToken: string | null =
  typeof window === 'undefined' ? null : window.localStorage.getItem(AUTH_TOKEN_KEY);

export function setAuthToken(token: string | null) {
  authToken = token;

  if (typeof window === 'undefined') return;

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getAuthToken() {
  return authToken;
}

export const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: trpcUrl,
      headers() {
        return authToken ? { authorization: `Bearer ${authToken}` } : {};
      },
    }),
  ],
  transformer: superjson,
});

export type RouterOutput = inferRouterOutputs<AppRouter>;
