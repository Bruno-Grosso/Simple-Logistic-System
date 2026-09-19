import { fetchHandler } from "../src/server";

/**
 * Robust test request helper.
 * Attempts HTTP fetch to running server first, and transparently falls back to
 * direct in-process fetchHandler if no HTTP server is listening on port 8080/8081.
 */
export async function testFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const port = process.env.TEST_PORT || "8081";
  const url = path.startsWith("http") ? path : `http://localhost:${port}${path.startsWith("/") ? "" : "/"}${path}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(url, { ...options, signal: options.signal || controller.signal });
    clearTimeout(timer);
    if (res) return res;
  } catch {
    /* fallback to in-process fetch handler */
  }
  const req = new Request(url, options);
  return fetchHandler(req);
}
