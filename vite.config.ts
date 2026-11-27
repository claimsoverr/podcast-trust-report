import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const BASE_PATH = "/podcast-trust-report/";

const HOP_BY_HOP_AND_ORIGIN_HEADERS = new Set([
  "host",
  "origin",
  "referer",
  "connection",
  "content-length",
  "accept-encoding",
  "cookie",
  "transfer-encoding",
]);

function isAllowedProxyTarget(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function devCorsProxyPlugin(): Plugin {
  const proxyPaths = new Set([`${BASE_PATH}cors-proxy`, "/cors-proxy"]);

  return {
    name: "dev-cors-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestUrl = req.url ?? "";
        const pathname = requestUrl.split("?")[0];
        if (!proxyPaths.has(pathname)) {
          next();
          return;
        }

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        );
        res.setHeader("Access-Control-Allow-Headers", "*");

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        const parsedReq = new URL(requestUrl, "http://localhost");
        const targetUrl = parsedReq.searchParams.get("url");

        if (!targetUrl || !isAllowedProxyTarget(targetUrl)) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Missing or invalid http/https ?url= parameter.",
            }),
          );
          return;
        }

        try {
          const forwardHeaders = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            const lowerKey = key.toLowerCase();
            if (
              HOP_BY_HOP_AND_ORIGIN_HEADERS.has(lowerKey) ||
              lowerKey.startsWith("sec-") ||
              value === undefined
            ) {
              continue;
            }
            if (Array.isArray(value)) {
              forwardHeaders.set(key, value.join(", "));
            } else {
              forwardHeaders.set(key, value);
            }
          }

          const method = req.method ?? "GET";
          let body: Uint8Array | undefined;
          if (method !== "GET" && method !== "HEAD") {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(
                typeof chunk === "string" ? Buffer.from(chunk) : chunk,
              );
            }
            if (chunks.length > 0) {
              body = Buffer.concat(chunks);
            }
          }

          const upstream = await fetch(targetUrl, {
            method,
            headers: forwardHeaders,
            body,
          });

          res.statusCode = upstream.status;
          const contentType = upstream.headers.get("content-type");
          if (contentType) {
            res.setHeader("Content-Type", contentType);
          }

          const payload = Buffer.from(await upstream.arrayBuffer());
          res.end(payload);
        } catch (error) {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error:
                error instanceof Error
                  ? error.message
                  : "Dev CORS proxy request failed.",
            }),
          );
        }
      });
    },
  };
}

export default defineConfig({
  base: BASE_PATH,
  plugins: [react(), devCorsProxyPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
