import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist",
);
const api = new URL(process.env.ASHA_API_TARGET ?? "http://127.0.0.1:4318");
if (
  api.protocol !== "http:" ||
  !["127.0.0.1", "localhost"].includes(api.hostname)
)
  throw new Error("Local preview proxy requires a loopback HTTP backend.");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) {
      const proxy = http.request(
        {
          hostname: api.hostname,
          port: api.port,
          path: req.url,
          method: req.method,
          headers: req.headers,
        },
        (upstream) => {
          res.writeHead(upstream.statusCode ?? 502, {
            ...upstream.headers,
            "X-Content-Type-Options": "nosniff",
          });
          upstream.pipe(res);
        },
      );
      proxy.on("error", () => {
        res.writeHead(503, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        res.end(
          JSON.stringify({
            error: {
              message:
                "Local backend is not running. Start the companion website backend first.",
            },
          }),
        );
      });
      req.on("aborted", () => proxy.destroy());
      req.pipe(proxy);
      return;
    }
    let file = path.resolve(root, "." + decodeURIComponent(url.pathname));
    if (!file.startsWith(root + path.sep) && file !== root) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (url.pathname === "/") {
      file = path.join(root, "index.html");
    }
    let info = await stat(file).catch(() => null);
    if (!info?.isFile()) {
      if (path.extname(url.pathname)) {
        res.writeHead(404);
        res.end("Asset not found");
        return;
      }
      file = path.join(root, "index.html");
    }
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY",
    });
    res.end(body);
  } catch {
    res.writeHead(500, {
      "Content-Type": "text/plain",
      "Cache-Control": "no-store",
    });
    res.end("Export the mobile browser preview before starting this server.");
  }
});
const host = process.argv.includes("--lan") ? "0.0.0.0" : "127.0.0.1";
server.listen(Number(process.env.ASHA_MOBILE_PORT ?? 5186), host, () =>
  console.log(
    "ASHA Saath mobile preview: http://" +
      host +
      ":" +
      (process.env.ASHA_MOBILE_PORT ?? 5186) +
      "; API shared with website.",
  ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
