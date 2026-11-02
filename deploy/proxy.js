// One public origin: /api/* -> Express, everything else -> the built SPA.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 7860);
const API = { host: "127.0.0.1", port: 4000 };
const DIST = "/app/apps/web/dist";

// Until /tmp/ready exists the port still answers, so a health check never sees a dead container.
const READY = "/tmp/ready";
const PAGE = `<!doctype html><meta charset="utf-8"><title>Starting Nexora…</title>
<meta http-equiv="refresh" content="3">
<style>body{font:16px/1.6 system-ui;margin:0;height:100vh;display:grid;place-items:center;background:#12110f;color:#f5f1ea}
main{text-align:center}h1{font-size:20px;margin:0 0 8px}p{margin:0;opacity:.6}</style>
<main><h1>Starting the demo…</h1><p>The free instance was asleep. This page refreshes itself.</p></main>`;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

function serveStatic(req, res) {
  const clean = decodeURIComponent(req.url.split("?")[0]);
  let file = path.join(DIST, path.normalize(clean).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(DIST)) file = path.join(DIST, "index.html");
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, "index.html");
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}

http
  .createServer((req, res) => {
    if (req.url === "/_boot") {
      res.writeHead(200, { "content-type": "text/plain" });
      return res.end("ok");
    }
    if (!fs.existsSync(READY)) {
      res.writeHead(503, { "content-type": "text/html; charset=utf-8", "retry-after": "3" });
      return res.end(PAGE);
    }
    if (!req.url.startsWith("/api")) return serveStatic(req, res);
    const proxy = http.request(
      { host: API.host, port: API.port, path: req.url, method: req.method, headers: req.headers },
      (upstream) => {
        res.writeHead(upstream.statusCode || 502, upstream.headers);
        upstream.pipe(res);
      }
    );
    proxy.on("error", () => {
      res.writeHead(502, { "content-type": "application/json" });
      res.end('{"error":"api unavailable"}');
    });
    req.pipe(proxy);
  })
  .listen(PORT, "0.0.0.0", () => console.log("demo listening on " + PORT));
