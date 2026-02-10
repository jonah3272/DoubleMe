#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "doubleme",
  version: "0.0.1",
});

server.tool(
  "ping",
  "Respond with pong. Use to verify the DoubleMe MCP server is running.",
  {},
  async () => ({
    content: [{ type: "text", text: "pong" }],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
