import { Client, cacheExchange, fetchExchange, Exchange } from "urql";
import { useStore } from "@/lib/store";
import { appConfig } from "@/lib/config";

const exchanges: Exchange[] = [];

if (appConfig.enableDevtools) {
  try {
    const { devtoolsExchange } = require("@urql/devtools");
    exchanges.push(devtoolsExchange);
  } catch {
    // @urql/devtools not installed, skip
  }
}

exchanges.push(cacheExchange, fetchExchange);

export const urqlClient = new Client({
  url: appConfig.apiUrl,
  exchanges,
  preferGetMethod: false,
  fetchOptions: () => {
    const token = useStore.getState().authToken;
    return {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
  },
});
