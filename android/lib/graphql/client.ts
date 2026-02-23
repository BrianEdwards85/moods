import { Client, cacheExchange, fetchExchange } from "urql";
import { useStore } from "@/lib/store";

const API_URL = `https://moods-dev.free-side.us/graphql`;

export const urqlClient = new Client({
  url: API_URL,
  exchanges: [cacheExchange, fetchExchange],
  preferGetMethod: false,
  fetchOptions: () => {
    const token = useStore.getState().authToken;
    return {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
  },
});
