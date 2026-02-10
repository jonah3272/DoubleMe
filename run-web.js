#!/usr/bin/env node
/**
 * Run the web app dev server. From repo root: node run-web.js
 */
const { spawn } = require("child_process");
const path = require("path");

const webDir = path.join(__dirname, "apps", "web");
const nextBin = path.join(webDir, "node_modules", "next", "dist", "bin", "next");

const child = spawn(process.execPath, [nextBin, "dev"], {
  cwd: webDir,
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => process.exit(code ?? 0));
