#!/usr/bin/env node
// Smoke test: serve _site/ under the /sf2rend/ base path (like GitHub Pages
// serves a project site), load it in headless Chromium, and assert the app
// boots cleanly.
//
// Checks:
// - no console errors, no page errors
// - no 404s or failed requests (fail on any)
// - "Engine ready." status appears (audio engine initialized)
// - a "<name>.sf2 is ready." status appears (default SoundFont loaded;
//   exercises Range requests against static/)
// - spin-proc, lpf-proc and the FFT worklet all registered
//   (via the window.__sf2rendWorklets hook set in src/mkpath.js)
//
// Usage: node tools/smoke-test.mjs --site <_site dir> [--port <port>]
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i < 0 ? def : process.argv[i + 1];
}
const site = resolve(arg("--site", ""));
if (!site) {
  console.error("usage: smoke-test.mjs --site <_site dir> [--port <port>]");
  process.exit(1);
}
const port = Number(arg("--port", "0")) || 0;
const root = resolve(join(new URL(".", import.meta.url).pathname, "..", ".."));
const require = createRequire(join(root, "package.json"));

function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  for (const bin of ["google-chrome", "chromium", "chromium-browser"]) {
    if (spawnSync("which", [bin], { stdio: "ignore" }).status === 0) return bin;
  }
  return null;
}

const chrome = findChrome();
if (!chrome) {
  console.error(
    "smoke test needs Chrome: set CHROME_BIN (CI installs it via browser-actions/setup-chrome)",
  );
  process.exit(1);
}

// Serve <tmp>/sf2rend -> _site so the base path matches GitHub Pages.
const serveRoot = mkdtempSync(join(tmpdir(), "sf2rend-smoke-"));
symlinkSync(site, join(serveRoot, "sf2rend"));

const httpServerBin = require.resolve("http-server/bin/http-server");
// NOTE: the root dir must come before --silent; http-server's arg parser
// consumes the positional after --silent as the flag's value.
const server = spawn(
  process.execPath,
  [httpServerBin, serveRoot, "-p", String(port), "-a", "127.0.0.1", "--silent"],
  { stdio: ["ignore", "pipe", "inherit"] },
);

const baseUrl = await new Promise((resolveUrl, reject) => {
  const timer = setTimeout(() => reject(new Error("http-server did not start")), 15000);
  server.stdout.on("data", (chunk) => {
    const m = String(chunk).match(/http:\/\/127\.0\.0\.1:(\d+)/);
    if (m) {
      clearTimeout(timer);
      resolveUrl(`http://127.0.0.1:${m[1]}`);
    }
  });
  server.on("exit", (code) => reject(new Error(`http-server exited ${code}`)));
});
console.log(`serving ${serveRoot}/sf2rend at ${baseUrl}/sf2rend/`);

const failures = [];
let browser;
try {
  const puppeteer = (await import("puppeteer-core")).default;
  browser = await puppeteer.launch({
    executablePath: chrome,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--mute-audio",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
  const page = await browser.newPage();
  page.on("pageerror", (err) => failures.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") failures.push(`console.error: ${msg.text()}`);
  });
  page.on("requestfailed", (req) =>
    failures.push(`requestfailed: ${req.url()} ${req.failure()?.errorText}`),
  );
  page.on("response", (res) => {
    if (res.status() === 404) failures.push(`404: ${res.url()}`);
  });

  await page.goto(`${baseUrl}/sf2rend/index.html`, { waitUntil: "load", timeout: 60000 });

  console.log("waiting for Engine ready...");
  await page.waitForFunction(
    () => document.body.innerText.includes("Engine ready."),
    { timeout: 90000 },
  );

  const worklets = await page.evaluate(() => window.__sf2rendWorklets);
  const expected = ["spin-proc", "lpf-proc", "proc-fft"];
  if (JSON.stringify(worklets) !== JSON.stringify(expected)) {
    failures.push(`worklets registered: ${JSON.stringify(worklets)}, want ${JSON.stringify(expected)}`);
  } else {
    console.log(`worklets registered: ${worklets.join(", ")}`);
  }

  console.log("waiting for default SoundFont...");
  await page.waitForFunction(() => /\.sf2 is ready\./.test(document.body.innerText), {
    timeout: 180000,
  });
  console.log("default SoundFont loaded");
} catch (err) {
  failures.push(`exception: ${err.message}`);
} finally {
  if (browser) await browser.close();
  server.kill();
}

if (failures.length > 0) {
  console.error("SMOKE TEST FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("smoke test passed: no console errors, no 404s, engine + SoundFont ready");
