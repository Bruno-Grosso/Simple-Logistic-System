import { fetchHandler } from "../src/server";

/**
 * Robust test request helper.
 * Attempts HTTP fetch to running server first, and transparently falls back to
 * direct in-process fetchHandler if no HTTP server is listening on port 8080/8081.
 */
export async function testFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith("http") ? path : `http://localhost:8080${path.startsWith("/") ? "" : "/"}${path}`;
  try {
    const res = await fetch(url, options);
    if (res) return res;
  } catch {
    /* fallback to in-process fetch handler */
  }
  const req = new Request(url, options);
  return fetchHandler(req);
}
