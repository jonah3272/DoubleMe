#!/usr/bin/env node
/**
 * Capture screenshots of the app. Run with the dev server up:
 *   pnpm dev
 *   pnpm screenshots   (in another terminal)
 *
 * Screenshots are saved to apps/web/screenshots/
 */

import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "screenshots");

const routes = [
  { path: "/", name: "home" },
  { path: "/login", name: "login" },
  { path: "/ui", name: "ui-design-system" },
  { path: "/projects", name: "projects" },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  let saved = 0;

  for (const { path, name } of routes) {
    const url = `${BASE_URL}${path}`;
    try {
      const res = await page.goto(url, { waitUntil: "networkidle", timeout: 10000 });
      if (!res || !res.ok()) {
        console.warn(`Skip ${path}: ${res?.status() ?? "failed"}`);
        continue;
      }
      await page.screenshot({ path: join(OUT_DIR, `${name}.png`), fullPage: true });
      console.log(`Saved ${name}.png`);
      saved++;
    } catch (err) {
      console.warn(`${path}: ${err.message}`);
    }
  }

  await browser.close();
  if (saved > 0) {
    console.log(`Done. ${saved} screenshot(s) in ${OUT_DIR}`);
  } else {
    console.warn(`No screenshots saved. Is the dev server running? Start it with: pnpm dev`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
