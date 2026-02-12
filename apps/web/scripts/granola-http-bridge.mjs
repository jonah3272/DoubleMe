#!/usr/bin/env node
/**
 * HTTP bridge for the proofgeist/granola-ai-mcp-server (stdio MCP).
 * Run this locally so the web app can talk to the local Granola MCP server.
 *
 * Prerequisites:
 * - Clone https://github.com/proofgeist/granola-ai-mcp-server and run `uv sync`
 * - Set GRANOLA_MCP_SERVER_CMD to the server executable, e.g.:
 *   macOS: /Users/YOUR_USERNAME/granola-ai-mcp-server/.venv/bin/granola-mcp-server
 *   Windows: C:\Users\YOU\granola-ai-mcp-server\.venv\Scripts\granola-mcp-server.exe
 *
 * Then: node apps/web/scripts/granola-http-bridge.mjs
 * Set GRANOLA_MCP_URL to http://localhost:3333 (or PORT) in the app. No OAuth needed for local.
 */

import { createServer } from "http";
import { spawn } from "child_process";

const PORT = parseInt(process.env.PORT || "3333", 10);
const CMD = process.env.GRANOLA_MCP_SERVER_CMD;

if (!CMD?.trim()) {
  console.error("Set GRANOLA_MCP_SERVER_CMD to the path of granola-mcp-server.");
  console.error("Example (macOS): /Users/you/granola-ai-mcp-server/.venv/bin/granola-mcp-server");
  process.exit(1);
}

let child = null;
let requestIdToResolve = new Map();

function spawnChild() {
  if (child) return;
  child = spawn(CMD.trim(), [], {
    stdio: ["pipe", "pipe", "inherit"],
    shell: false,
  });
  child.on("exit", (code) => {
    child = null;
    requestIdToResolve.forEach(({ reject }) => reject(new Error("MCP process exited")));
    requestIdToResolve.clear();
  });
  child.stderr?.on("data", (chunk) => process.stderr.write(chunk));
  let buf = "";
  child.stdout.on("data", (chunk) => {
    buf += chunk.toString();
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        const id = msg.id;
        if (id !== undefined && requestIdToResolve.has(id)) {
          const { resolve } = requestIdToResolve.get(id);
          requestIdToResolve.delete(id);
          resolve(msg);
        }
      } catch (_) {}
    }
  });
}

function sendRequest(message) {
  return new Promise((resolve, reject) => {
    spawnChild();
    const id = message?.id;
    if (id === undefined) {
      reject(new Error("JSON-RPC message must have an id"));
      return;
    }
    requestIdToResolve.set(id, { resolve, reject });
    const payload = JSON.stringify(message) + "\n";
    child.stdin.write(payload, (err) => {
      if (err) {
        requestIdToResolve.delete(id);
        reject(err);
      }
    });
    setTimeout(() => {
      if (requestIdToResolve.has(id)) {
        requestIdToResolve.delete(id);
        reject(new Error("MCP response timeout"));
      }
    }, 30000);
  });
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }
  if (req.method !== "POST" || (req.url !== "/" && req.url !== "/mcp")) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }
  let body = "";
  for await (const chunk of req) body += chunk;
  let message;
  try {
    message = JSON.parse(body);
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: { code: -32700, message: "Parse error" } }));
    return;
  }
  try {
    const response = await sendRequest(message);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify(response));
  } catch (err) {
    res.writeHead(502, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(
      JSON.stringify({
        jsonrpc: "2.0",
        id: message?.id ?? null,
        error: { code: -32603, message: err?.message || "Bridge error" },
      })
    );
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Granola HTTP bridge listening on http://localhost:${PORT}`);
  console.log("Set GRANOLA_MCP_URL to this URL in the app. No OAuth for local.");
});
