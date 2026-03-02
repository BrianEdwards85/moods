import { Client, cacheExchange, fetchExchange, Exchange, mapExchange } from 'urql';
import { pipe, map } from 'wonka';
import { useStore } from '@/lib/store';
import { appConfig } from '@/lib/config';
import { isTokenExpired, needsRefresh } from '@/lib/auth';
import { REFRESH_TOKEN_MUTATION } from '@/lib/graphql/mutations';

// Singleton promise to deduplicate concurrent refresh attempts
let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(token: string): Promise<string | null> {
  try {
    const resp = await fetch(appConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: REFRESH_TOKEN_MUTATION }),
    });
    const json = await resp.json();
    return json?.data?.refreshToken?.token ?? null;
  } catch {
    return null;
  }
}

/** Pre-request exchange: expires → clearAuth; needs refresh → refresh then proceed. */
const authExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    const processedOps$ = pipe(
      ops$,
      map((operation) => {
        const token = useStore.getState().authToken;
        if (token) {
          if (isTokenExpired(token)) {
            useStore.getState().clearAuth();
          } else if (needsRefresh(token)) {
            if (!refreshPromise) {
              refreshPromise = doRefresh(token).then(async (newToken) => {
                refreshPromise = null;
                if (newToken) {
                  const userId = useStore.getState().currentUserId;
                  if (userId) await useStore.getState().setAuthToken(newToken, userId);
                } else {
                  await useStore.getState().clearAuth();
                }
                return newToken;
              });
            }
          }
        }
        // Return operation as-is — fetchOptions picks up the (possibly new) token
        return operation;
      }),
    );
    return forward(processedOps$);
  };

/** Post-response exchange: catch "Authentication required" as defense-in-depth. */
const authErrorExchange: Exchange = mapExchange({
  onResult(result) {
    const errors = result.error?.graphQLErrors;
    if (errors?.some((e) => e.message === 'Authentication required')) {
      useStore.getState().clearAuth();
    }
  },
});

const exchanges: Exchange[] = [];

if (appConfig.enableDevtools) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { devtoolsExchange } = require('@urql/devtools');
    exchanges.push(devtoolsExchange);
  } catch {
    // @urql/devtools not installed, skip
  }
}

exchanges.push(cacheExchange, authErrorExchange, authExchange, fetchExchange);

export const urqlClient = new Client({
  url: appConfig.apiUrl,
  exchanges,
  preferGetMethod: false,
  fetchOptions: () => {
    const token = useStore.getState().authToken;
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  },
});
