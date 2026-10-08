#!/usr/bin/env node
// Run the JS test suites:
//   - saturation mocha tests
//   - fft-64bit mocha tests (jsdom + mocked AudioWorklet)
//   - sf2-service karma suite in headless Chrome (ChromeHeadlessCI)
//
// The karma specs fetch a SoundFont; this script serves the repo root over
// localhost and points them at static/ via SF2_TEST_URL (karma client.args),
// so the suite needs no network beyond localhost.
//
// Usage: node tools/test-js.mjs --root <repo>
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i < 0 || !process.argv[i + 1]) {
    console.error(`missing ${name} <value>`);
    process.exit(1);
  }
  return resolve(process.argv[i + 1]);
}
const root = arg("--root");
const require = createRequire(join(root, "package.json"));

const httpServerBin = require.resolve("http-server/bin/http-server");
// NOTE: the root dir must come before --silent; http-server's arg parser
// consumes the positional after --silent as the flag's value.
const server = spawn(
  process.execPath,
  [httpServerBin, root, "-p", "0", "-a", "127.0.0.1", "--silent"],
  { stdio: ["ignore", "pipe", "inherit"] },
);

function serverUrl() {
  return new Promise((resolveUrl, reject) => {
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
}

let failed = false;
function run(name, cmd, args, opts = {}) {
  console.log(`\n### ${name}\n$ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) {
    console.error(`FAILED: ${name} (exit ${r.status})`);
    failed = true;
  }
}

try {
  const base = await serverUrl();
  console.log(`test server: ${base}`);
  const env = {
    ...process.env,
    SF2_TEST_URL: `${base}/static/GeneralUserGS.sf2`,
  };

  run("saturation mocha", "npx", ["--no-install", "mocha", "saturation/test.js"], {
    cwd: root,
    env,
  });
  run(
    "fft-64bit mocha",
    "npx",
    [
      "--no-install",
      "mocha",
      "test/fft-node.test.js",
      "--require",
      "test/setup.js",
      "--timeout",
      "5000",
    ],
    // the suite reads ./fft-node.js relatively; run it from its own dir
    { cwd: join(root, "fft-64bit"), env },
  );

  const chromeBin =
    process.env.CHROME_BIN ||
    ["google-chrome", "chromium", "chromium-browser"].find((bin) => {
      const r = spawnSync("which", [bin], { stdio: "ignore" });
      return r.status === 0;
    });
  if (!chromeBin) {
    console.error(
      "FAILED: karma suite needs Chrome (set CHROME_BIN; CI installs it via browser-actions/setup-chrome)",
    );
    failed = true;
  } else {
    run(
      "sf2-service karma",
      "npx",
      ["--no-install", "karma", "start", "karma.conf.cjs", "--single-run", "--browsers", "ChromeHeadlessCI"],
      { cwd: join(root, "sf2-service"), env: { ...env, CHROME_BIN: chromeBin } },
    );
  }
} finally {
  server.kill();
}

if (failed) process.exit(1);
console.log("\nall JS suites passed");
