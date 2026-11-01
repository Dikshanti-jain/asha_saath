import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = await readFile(
  new URL("../src/lib/api.ts", import.meta.url),
  "utf8",
);
const js = source.replace(
  /import\s*\{\s*randomUUID\s*\}\s*from\s*["']expo-crypto["'];/,
  "const randomUUID=()=> 'synthetic-test-key';",
);
const code = (await import("node:module")).stripTypeScriptTypes(js, {
  mode: "transform",
});
const { normalizeBase, apiRequest, ApiError } = await import(
  "data:text/javascript;base64," + Buffer.from(code).toString("base64")
);
test("server configuration rejects credentials, paths and public cleartext", () => {
  assert.equal(normalizeBase(""), "");
  assert.equal(normalizeBase("http://10.0.2.2:5186/"), "http://10.0.2.2:5186");
  assert.equal(normalizeBase("https://demo.example"), "https://demo.example");
  for (const bad of [
    "http://demo.example",
    "https://name:secret@demo.example",
    "https://demo.example/api",
    "https://demo.example?token=x",
    "file:///x",
  ])
    assert.throws(() => normalizeBase(bad));
});
test("transport rejects an invalid origin before sending a native credential", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error("Fetch must not be called.");
  };
  try {
    for (const base of [
      "http://public-demo.example",
      "https://name:secret@demo.example",
      "https://demo.example/api",
      "https://demo.example?key=x",
      "file:///server",
    ])
      await assert.rejects(
        () => apiRequest(base, "state", "synthetic-test-credential"),
        /server origin|HTTPS/,
      );
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});
test("native transport uses bearer, omits browser cookies and preserves server denial", async () => {
  const original = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return {
      ok: false,
      status: 403,
      json: async () => ({
        error: { code: "FORBIDDEN", message: "This case is not authorized." },
      }),
    };
  };
  try {
    await assert.rejects(
      () =>
        apiRequest("https://demo.example", "commands", "abc", {
          name: "close",
          args: ["x"],
        }),
      (e) =>
        e instanceof ApiError &&
        e.status === 403 &&
        e.message === "This case is not authorized.",
    );
    assert.equal(captured.options.credentials, "omit");
    assert.equal(captured.options.headers.Authorization, "Bearer abc");
    assert.equal(captured.options.cache, "no-store");
  } finally {
    globalThis.fetch = original;
  }
});
test("transport does not claim successful saving on network failure", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("network");
  };
  try {
    await assert.rejects(
      () => apiRequest("", "state", "abc"),
      /no change is confirmed/,
    );
  } finally {
    globalThis.fetch = original;
  }
});
