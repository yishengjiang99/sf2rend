#!/usr/bin/env node
// Smoke test: serve _site/ under the /sf2rend/ base path (like GitHub Pages
// serves a project site), load it in headless Chromium, and assert the app
// boots cleanly.
//
// Checks:
// - no console errors, no page errors
// - no 404s or failed requests (fail on any)
// - spin-proc, lpf-proc and the FFT worklet all registered
//   (via the window.__sf2rendWorklets hook set in src/mkpath.js;
//   the "Engine ready." status is batched away by React, so the
//   durable hook is the reliable engine-init signal)
// - a "Loaded <n> presets from <name>.sf2." session-log entry appears
//   (default SoundFont loaded; exercises Range requests against static/.
//   The "<name>.sf2 is ready." status is transient — the default MIDI
//   starts loading immediately after — so the durable log entry is the
//   reliable signal.)
// - MIDI input: pressing a computer-keyboard key plays a note through the
//   app's normal key handler (App.jsx maps a,w,s,e,d,f... to notes).
// - Audio output: an AnalyserNode tapped to the AudioContext destination
//   (via evaluateOnNewDocument interception — no app changes) must show
//   a non-silent signal while the note plays, and near-silence after
//   release. This proves the worklet actually renders audio.
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
const root = resolve(join(new URL(".", import.meta.url).pathname, ".."));
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
// --silent must NOT be used: it suppresses the startup banner this script
// parses for the port, and http-server's arg parser consumes the positional
// root dir when it follows --silent. Request logs go to the piped stdout
// and are ignored after the URL is found.
const server = spawn(
  process.execPath,
  [httpServerBin, serveRoot, "-p", String(port), "-a", "127.0.0.1"],
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
  // Intercept AudioContext creation to tap the output for verification.
  // When the app connects any node to ctx.destination, also connect it to
  // our AnalyserNode. This is test-only instrumentation; the app is not
  // modified.
  await page.evaluateOnNewDocument(() => {
    window.__testAudio = { ctx: null, analyser: null };
    const OrigAudioContext = window.AudioContext;
    const origConnect = AudioNode.prototype.connect;
    window.AudioContext = function (...args) {
      const ctx = new OrigAudioContext(...args);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      window.__testAudio.ctx = ctx;
      window.__testAudio.analyser = analyser;
      AudioNode.prototype.connect = function (dest, ...rest) {
        const r = origConnect.call(this, dest, ...rest);
        if (dest === ctx.destination) {
          try {
            origConnect.call(this, analyser);
          } catch (e) {
            /* already connected */
          }
        }
        return r;
      };
      return ctx;
    };
    window.AudioContext.prototype = OrigAudioContext.prototype;
  });
  page.on("pageerror", (err) => failures.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    // Resource 404s are recorded from the response, with the URL. The
    // matching console line has no URL, so it cannot be filtered there.
    if (msg.text().includes("status of 404")) return;
    failures.push(`console.error: ${msg.text()}`);
  });
  page.on("requestfailed", (req) =>
    failures.push(`requestfailed: ${req.url()} ${req.failure()?.errorText}`),
  );
  page.on("response", (res) => {
    if (res.status() === 404 && !res.url().endsWith("/favicon.ico")) {
      failures.push(`404: ${res.url()}`);
    }
  });

  await page.goto(`${baseUrl}/sf2rend/index.html`, { waitUntil: "load", timeout: 60000 });

  // NOTE: the "Engine ready." status is immediately replaced by the
  // SoundFont loading status (React batches the two setStatus calls), so
  // it is not a reliable signal. The worklet registration hook is set
  // once during engine init and never cleared, making it durable.
  console.log("waiting for worklets to register (engine init)...");
  await page.waitForFunction(
    () =>
      JSON.stringify(window.__sf2rendWorklets) ===
      JSON.stringify(["spin-proc", "lpf-proc", "proc-fft"]),
    { timeout: 90000 },
  );
  console.log("worklets registered: spin-proc, lpf-proc, proc-fft");

  console.log("waiting for default SoundFont...");
  // NOTE: the "<name>.sf2 is ready." status is transient (the default MIDI
  // starts loading immediately after), so wait for the durable session-log
  // entry instead. It also proves the Range-request SF2 fetch worked.
  await page.waitForFunction(
    () => window.__sf2rendSfLoaded === true,
    { timeout: 180000 },
  );
  console.log("default SoundFont loaded");

  // MIDI input + audio output: press a computer-keyboard key ('a' maps to
  // a note in App.jsx's key handler), then verify the tapped analyser sees
  // a non-silent signal. Release and verify it goes quiet.
  console.log("playing MIDI note (keyboard 'a') and checking audio output...");
  async function audioPeak() {
    return page.evaluate(() => {
      const analyser = window.__testAudio?.analyser;
      if (!analyser) return -1;
      const data = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(data);
      let peak = 0;
      for (let i = 0; i < data.length; i++) {
        const v = Math.abs(data[i]);
        if (v > peak) peak = v;
      }
      return peak;
    });
  }
  await page.keyboard.down("a");
  await new Promise((r) => setTimeout(r, 800));
  const peakPlaying = await audioPeak();
  console.log(`audio peak while note held: ${peakPlaying.toFixed(4)}`);
  if (peakPlaying < 0) {
    failures.push("audio tap not installed (no AnalyserNode)");
  } else if (peakPlaying < 0.001) {
    failures.push(`audio output silent after MIDI note_on (peak=${peakPlaying})`);
  }
  await page.keyboard.up("a");
  await new Promise((r) => setTimeout(r, 1500));
  const peakReleased = await audioPeak();
  console.log(`audio peak after note release: ${peakReleased.toFixed(4)}`);
  if (peakReleased >= 0 && peakReleased > 0.05) {
    failures.push(`audio did not decay after note_off (peak=${peakReleased})`);
  }
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
console.log("smoke test passed: no console errors, no 404s, engine + SoundFont ready, MIDI note produced audio");
