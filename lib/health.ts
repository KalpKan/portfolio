/**
 * Server-side health check of a registry project's healthUrl.
 *
 * The contract every app on kalpkan.com follows: `GET /api/health` answers
 * 200 with a JSON body whose `ok` is literally `true`. Anything else is "no
 * signal": a non-JSON 200 (a login page), a JSON body without `ok: true`, a
 * redirect (Vercel SSO answers 302), a 5xx, a timeout, or a network error.
 */

export const SERVER_HEALTH_TIMEOUT_MS = 3000;

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export function isHealthyBody(body: unknown): boolean {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as { ok?: unknown }).ok === true
  );
}

export async function checkHealth(
  url: string,
  {
    fetcher = fetch,
    timeoutMs = SERVER_HEALTH_TIMEOUT_MS,
  }: { fetcher?: Fetcher; timeoutMs?: number } = {},
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetcher(url, {
      signal: controller.signal,
      cache: "no-store",
      redirect: "manual",
      headers: { accept: "application/json" },
    });
    if (!res.ok) return false;
    const body: unknown = await res.json().catch(() => null);
    return isHealthyBody(body);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
