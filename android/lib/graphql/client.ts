import { Client, cacheExchange, fetchExchange } from "urql";
import Constants from "expo-constants";

const API_URL = `http://192.168.129.137:8000/graphql`;

export const urqlClient = new Client({
  url: API_URL,
  exchanges: [cacheExchange, fetchExchange],
  preferGetMethod: false,
});
