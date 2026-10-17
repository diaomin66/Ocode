import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { resolveElectronBinary } from "../../../scripts/e2e/boot.mjs";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const desktop = join(root, "apps/desktop");
const fixture = join(desktop, "test/fixtures");
const { build } = createRequire(join(root, "packages/agent-runtime/package.json"))("esbuild");

test("home mark mounts, changes theme, follows motion preference and releases its animation", {
  skip: process.platform === "linux" && !process.env.DISPLAY ? "Electron requires a display" : false,
}, async (context) => {
  const temp = await mkdtemp(join(process.env.PI_SCRATCH_DIR || tmpdir(), "ocode-home-mascot-"));
  try {
    await build({
      entryPoints: [join(fixture, "home-mascot.jsx")],
      outfile: join(temp, "renderer.js"),
      bundle: true, platform: "browser", format: "esm", jsx: "automatic",
      define: { "process.env.NODE_ENV": '"production"' },
      nodePaths: [join(desktop, "node_modules")],
      alias: {
        react: join(desktop, "node_modules/react"),
        "react-dom": join(desktop, "node_modules/react-dom"),
      },
    });
    const html = (await readFile(join(fixture, "home-mascot.html"), "utf8"))
      .replace("../../src/styles/chat-shell.css", "chat-shell.css")
      .replace("./home-mascot.jsx", "./renderer.js")
      .replace('<meta charset="utf-8" />', '<meta charset="utf-8" /><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; style-src \'self\' \'unsafe-inline\'" />');
    await writeFile(join(temp, "index.html"), html);
    await copyFile(join(desktop, "src/styles/chat-shell.css"), join(temp, "chat-shell.css"));
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    const child = spawn(resolveElectronBinary(root).electronBinary, [join(fixture, "home-mascot-runner.cjs"), temp], {
      env, stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    for (const stream of [child.stdout, child.stderr]) {
      stream.setEncoding("utf8");
      stream.on("data", (chunk) => { output += chunk; });
    }
    const timer = setTimeout(() => child.kill("SIGKILL"), 45_000);
    let code;
    try {
      code = await new Promise((resolve, reject) => { child.once("error", reject); child.once("close", resolve); });
    } finally {
      clearTimeout(timer);
    }
    assert.equal(code, 0, output.slice(-8000));
    const result = output.split(/\r?\n/).find(line => line.startsWith("HOME_MASCOT_RESULT "));
    assert.ok(result, output.slice(-8000));
    const report = JSON.parse(result.slice("HOME_MASCOT_RESULT ".length));
    assert.equal(report.checks.length, 13);
    for (const check of report.checks) context.diagnostic(check);
    context.diagnostic(JSON.stringify({ responsive: report.responsive, compositingReasons: report.compositingReasons }));
  } finally {
    await rm(temp, { recursive: true, force: true, maxRetries: 5 });
  }
});
