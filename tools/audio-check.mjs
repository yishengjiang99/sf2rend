#!/usr/bin/env node
// Audio output check against a live (or local) sf2rend page.
//
// Loads the page, clicks the transport play button, and verifies the
// AudioContext destination actually carries a non-silent signal by tapping
// it with an AnalyserNode (installed via evaluateOnNewDocument — the app
// itself is not modified).
//
// Checks:
// - no console errors, no page errors, no failed requests, no 404s
// - worklets registered (engine init)
// - default SoundFont loaded
// - after clicking play, the tapped analyser sees peak >= 0.001
//   (proves the worklets render audible audio through the destination)
//
// Usage: node tools/audio-check.mjs [--url <page url>] [--play-ms <ms>]
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i < 0 ? def : process.argv[i + 1];
}
const url = arg("--url", "https://yishengjiang99.github.io/sf2rend/");
const playMs = Number(arg("--play-ms", "8000")) || 8000;
const root = join(new URL(".", import.meta.url).pathname, "..");
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
  console.error("audio check needs Chrome: set CHROME_BIN");
  process.exit(1);
}

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
  // Tap the AudioContext destination: whenever the app connects a node to
  // ctx.destination, also connect it to our AnalyserNode. Test-only
  // instrumentation; the app is not modified.
  await page.evaluateOnNewDocument(() => {
    window.__audioCheck = { analyser: null };
    const OrigAudioContext = window.AudioContext;
    const origConnect = AudioNode.prototype.connect;
    window.AudioContext = function (...args) {
      const ctx = new OrigAudioContext(...args);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      window.__audioCheck.analyser = analyser;
      AudioNode.prototype.connect = function (dest, ...rest) {
        const r = origConnect.call(this, dest, ...rest);
        if (dest === ctx.destination) {
          try {
            origConnect.call(this, analyser);
          } catch (e) {
            /* already tapped */
          }
        }
        return r;
      };
      return ctx;
    };
    window.AudioContext.prototype = OrigAudioContext.prototype;
  });
  page.on("pageerror", (err) => failures.push(`pageerror: ${err.message.slice(0, 200)}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") failures.push(`console.error: ${msg.text().slice(0, 200)}`);
  });
  page.on("requestfailed", (req) =>
    failures.push(`requestfailed: ${req.url().slice(-80)}`),
  );
  page.on("response", (res) => {
    const url = res.url();
    // favicon.ico 404s are benign (browsers request it automatically)
    if (url.endsWith("/favicon.ico")) return;
    if (res.status() >= 400) failures.push(`HTTP ${res.status()}: ${url.slice(-80)}`);
  });

  console.log(`loading ${url} ...`);
  await page.goto(url, { waitUntil: "load", timeout: 60000 });

  console.log("waiting for worklets (engine init)...");
  await page.waitForFunction(
    () =>
      JSON.stringify(window.__sf2rendWorklets) ===
      JSON.stringify(["spin-proc", "lpf-proc", "proc-fft"]),
    { timeout: 90000 },
  );
  console.log("worklets registered");

  console.log("waiting for default SoundFont...");
  await page.waitForFunction(() => window.__sf2rendSfLoaded === true, {
    timeout: 180000,
  });
  console.log("soundfont loaded");

  // Wait for the default MIDI to finish loading/parsing before clicking play.
  // (Without this, play starts while the sequencer has no tracks -> silence.)
  console.log("waiting for default MIDI...");
  await page.waitForFunction(() => window.__sf2rendMidiLoaded === true, {
    timeout: 180000,
  });
  console.log("midi loaded");

  // Click the transport play button.
  console.log("clicking play...");
  const playBtn = await page.waitForSelector('[aria-label="Start playback"]', {
    timeout: 30000,
  });
  await playBtn.click();

  // Verify the button toggled to "Pause" (proves the click registered)
  await new Promise((r) => setTimeout(r, 1000));
  const pauseBtn = await page.$('[aria-label="Pause playback"]');
  if (!pauseBtn) {
    failures.push("play button did not toggle to Pause after click");
  } else {
    console.log("play button toggled to Pause (playing)");
  }

  // Let the MIDI play, then sample the tapped destination buffer.
  await new Promise((r) => setTimeout(r, playMs));
  const peak = await page.evaluate(() => {
    const analyser = window.__audioCheck?.analyser;
    if (!analyser) return -1;
    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);
    let p = 0;
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i]);
      if (v > p) p = v;
    }
    return p;
  });
  console.log(`destination peak while playing: ${peak.toFixed(4)}`);
  if (peak < 0) {
    failures.push("audio tap not installed (no AnalyserNode on destination)");
  } else if (peak < 0.001) {
    failures.push(`audio destination silent after play (peak=${peak.toFixed(4)})`);
  }
} catch (err) {
  failures.push(`exception: ${err.message.slice(0, 200)}`);
} finally {
  if (browser) await browser.close();
}

if (failures.length > 0) {
  console.error("AUDIO CHECK FAILED:");
  for (const f of [...new Set(failures)]) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("audio check passed: play produced non-silent output on the destination");
