#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, mkdtemp, open, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function validateProbe(output, version) {
  const line = output.split(/\r?\n/).find((entry) => entry.startsWith("BOOT_PROBE "));
  assert.ok(line, "packaged app did not emit BOOT_PROBE");
  const probe = JSON.parse(line.slice("BOOT_PROBE ".length));
  assert.equal(probe.ok, true);
  assert.equal(probe.appName, "Ocode");
  assert.equal(probe.version, version);
  assert.equal(probe.platform, "win32");
  assert.ok(Number.isInteger(probe.hostProtocol) && probe.hostProtocol > 0);
  assert.equal(probe.ctrlRBlocked, true);
  assert.deepEqual(probe.projectRemove, { ok: true, removed: false, sessionsRemoved: 0 });
  return probe;
}

async function assertX64(file) {
  const handle = await open(file, "r");
  try {
    const dos = Buffer.alloc(64);
    await handle.read(dos, 0, dos.length, 0);
    assert.equal(dos.toString("ascii", 0, 2), "MZ", `${file}: missing DOS header`);
    const pe = Buffer.alloc(6);
    await handle.read(pe, 0, pe.length, dos.readUInt32LE(60));
    assert.equal(pe.readUInt32LE(0), 0x00004550, `${file}: invalid PE header`);
    assert.equal(pe.readUInt16LE(4), 0x8664, `${file}: not an x64 executable`);
  } finally {
    await handle.close();
  }
}

async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

async function main() {
  // Silent installation writes registry entries and shortcuts. Never run it
  // against a developer's live machine or profile.
  assert.equal(process.platform, "win32", "Windows verification requires Windows");
  assert.equal(process.env.GITHUB_ACTIONS, "true", "requires an ephemeral Actions runner");
  assert.equal(process.env.RUNNER_ENVIRONMENT, "github-hosted", "self-hosted runners are not disposable");
  const desktop = join(root, "apps", "desktop");
  const release = join(desktop, "release");
  const { version } = JSON.parse(await readFile(join(desktop, "package.json"), "utf8"));
  const files = [
    `Ocode-Setup-${version}.exe`,
    `Ocode-Setup-${version}.exe.blockmap`,
    `Ocode-Portable-${version}.zip`,
    `Ocode-Portable-${version}.exe`,
  ];
  const artifacts = [];
  for (const name of files) {
    const path = join(release, name);
    const { size } = await stat(path);
    assert.ok(size > 0, `${name} is empty`);
    artifacts.push({ name, bytes: size, sha256: await sha256(path) });
  }

  const temp = await mkdtemp(join(tmpdir(), "ocode-installer-"));
  const installDir = join(temp, "installed");
  const zipDir = join(temp, "zip");
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/^(OCODE_|PI_DESKTOP_|ELECTRON_RENDERER_URL$|ELECTRON_RUN_AS_NODE$)/.test(key)) delete env[key];
  }
  env.OCODE_DATA_DIR = join(temp, "installer-profile");
  env.OCODE_START_MAXIMIZED = "1";
  env.ELECTRON_RENDERER_URL = "";
  const options = { env, timeout: 180_000, maxBuffer: 16 * 1024 * 1024, windowsHide: true };
  await run(join(release, files[0]), ["/S", "/currentuser", `/D=${installDir}`], options);

  const desktopRequire = createRequire(join(desktop, "package.json"));
  const { extractFile } = desktopRequire("@electron/asar");
  async function verifyApp(directory, distribution) {
    await assertX64(join(directory, "Ocode.exe"));
    await assertX64(join(directory, "resources", "bin", "ocode-host-core.exe"));
    const metadata = JSON.parse(extractFile(join(directory, "resources", "app.asar"), "package.json"));
    assert.equal(metadata.name, "@ocode/desktop");
    assert.equal(metadata.version, version);
    assert.equal(metadata.ocodeDistribution, distribution);
    const profile = join(temp, `${distribution}-profile`);
    await mkdir(profile, { recursive: true });
    const { stdout, stderr } = await run(join(directory, "Ocode.exe"), [], {
      ...options, cwd: directory, env: { ...env, OCODE_DATA_DIR: profile, OCODE_BOOT_PROBE: "1" },
    });
    const probe = validateProbe(`${stdout}\n${stderr}`, version);
    console.log(`PASS ${distribution}: installer identity, native x64 host, preload and Host RPC boot`);
    return probe;
  }

  const installedProbe = await verifyApp(installDir, "installed");
  await mkdir(zipDir);
  // PowerShell's LiteralPath avoids interpreting special characters in paths.
  await run("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
    "Expand-Archive -LiteralPath $env:OCODE_VERIFY_ZIP -DestinationPath $env:OCODE_VERIFY_DEST"], {
    ...options, env: { ...env, OCODE_VERIFY_ZIP: join(release, files[2]), OCODE_VERIFY_DEST: zipDir },
  });
  const zipProbe = await verifyApp(zipDir, "zip");

  const uninstallers = (await readdir(installDir)).filter((name) => /^Uninstall.*\.exe$/i.test(name));
  assert.equal(uninstallers.length, 1, "installer must register an uninstaller");
  await run(join(installDir, uninstallers[0]), ["/S", `/D=${installDir}`], options);
  // Preserve the temporary runner evidence until the hosted VM is destroyed.
  // No developer data is created, removed, or migrated by this script.
  const evidence = {
    version, architecture: "x64", commit: process.env.GITHUB_SHA,
    base: process.env.OCODE_BASE_SHA ?? null, signed: false,
    signatureNote: "Unsigned candidate; no publisher certificate was supplied.",
    installedProbe, zipProbe, artifacts,
  };
  await writeFile(join(release, "windows-verification.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  await writeFile(join(release, "SHA256SUMS.txt"), `${artifacts.map((item) => `${item.sha256}  ${item.name}`).join("\n")}\n`);
  console.log(JSON.stringify(evidence, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
