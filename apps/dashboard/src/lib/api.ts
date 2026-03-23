import { GnanaClient } from "@gnana/client";

export const api = new GnanaClient({
  url: process.env.NEXT_PUBLIC_GNANA_API_URL ?? "http://localhost:4000",
  apiKey: process.env.NEXT_PUBLIC_GNANA_API_KEY,
});
