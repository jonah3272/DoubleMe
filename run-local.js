#!/usr/bin/env node
/**
 * Install deps (if needed) and run the web app locally for testing.
 * No Supabase env required — open http://localhost:3000 and you'll see the preview.
 *
 * From repo root: node run-local.js
 */
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const webDir = path.join(__dirname, "apps", "web");
const hasDeps = fs.existsSync(path.join(webDir, "node_modules"));

function run(cmd, args, cwd, description) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: cwd || __dirname, stdio: "inherit", shell: true });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${description} exited with ${code}`))));
  });
}

async function main() {
  if (!hasDeps) {
    console.log("Installing dependencies in apps/web...");
    await run("npm", ["install"], webDir, "npm install");
  }

  console.log("Starting dev server at http://localhost:3000");
  console.log("(No Supabase? You'll see the preview app.)\n");

  const child = spawn("npx", ["next", "dev"], {
    cwd: webDir,
    stdio: "inherit",
    shell: true,
  });
  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
