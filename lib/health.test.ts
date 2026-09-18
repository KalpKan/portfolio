import { describe, it, expect } from "vitest";
import { checkHealth, isHealthyBody } from "./health";

function res(status: number, body: string, headers: Record<string, string> = {}) {
  return new Response(body, {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("isHealthyBody", () => {
  it("is healthy only when the parsed JSON has ok === true", () => {
    expect(isHealthyBody({ ok: true })).toBe(true);
    expect(isHealthyBody({ ok: true, db: "ok" })).toBe(true);
    expect(isHealthyBody({ ok: false })).toBe(false);
    expect(isHealthyBody({ ok: "true" })).toBe(false);
    expect(isHealthyBody({ status: "ok" })).toBe(false);
    expect(isHealthyBody(null)).toBe(false);
    expect(isHealthyBody("ok")).toBe(false);
    expect(isHealthyBody(undefined)).toBe(false);
  });
});

describe("checkHealth", () => {
  it("returns ok for a 200 whose body says ok: true", async () => {
    const fetcher = async () => res(200, JSON.stringify({ ok: true }));
    await expect(checkHealth("https://x.test/api/health", { fetcher })).resolves.toBe(true);
  });

  it("is not ok for a 200 with a non-JSON body", async () => {
    const fetcher = async () =>
      new Response("<html>login</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    await expect(checkHealth("https://x.test/api/health", { fetcher })).resolves.toBe(false);
  });

  it("is not ok for a 200 whose JSON lacks ok: true", async () => {
    const fetcher = async () => res(200, JSON.stringify({ status: "up" }));
    await expect(checkHealth("https://x.test/api/health", { fetcher })).resolves.toBe(false);
  });

  it("does not follow redirects, so a Vercel SSO 302 is not healthy", async () => {
    let init: RequestInit | undefined;
    const fetcher = async (_url: string, i?: RequestInit) => {
      init = i;
      return new Response(null, { status: 302, headers: { location: "https://vercel.com/sso" } });
    };
    await expect(checkHealth("https://x.test/api/health", { fetcher })).resolves.toBe(false);
    expect(init?.redirect).toBe("manual");
  });

  it("is not ok on a 500", async () => {
    const fetcher = async () => res(500, JSON.stringify({ ok: true }));
    await expect(checkHealth("https://x.test/api/health", { fetcher })).resolves.toBe(false);
  });

  it("is not ok when the fetch throws or times out", async () => {
    const throwing = async () => {
      throw new Error("network");
    };
    await expect(checkHealth("https://x.test/api/health", { fetcher: throwing })).resolves.toBe(false);

    const slow = (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    await expect(
      checkHealth("https://x.test/api/health", { fetcher: slow, timeoutMs: 20 }),
    ).resolves.toBe(false);
  });
});
