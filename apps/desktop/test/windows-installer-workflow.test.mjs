import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../../", import.meta.url);

test("Windows candidate packaging is isolated and never publishes releases", async () => {
  const source = await readFile(new URL(".github/workflows/windows-installer.yml", root), "utf8");
  assert.match(source, /branches: \['build\/windows\/\*\*'\]/);
  assert.match(source, /workflow_dispatch:/);
  assert.match(source, /contents: read/);
  assert.doesNotMatch(source, /contents: write|secrets\.|softprops\/action-gh-release/);
  assert.match(source, /runs-on: windows-2022/);
  assert.match(source, /pnpm install --frozen-lockfile/);
  assert.match(source, /cargo build --release --locked -p host-core/);
  assert.match(source, /pnpm --filter @ocode\/desktop run dist:win/);
  assert.match(source, /node scripts\/verify-windows-installer\.mjs/);
  assert.match(source, /if-no-files-found: error/);
  assert.match(source, /retention-days: 7/);
});

test("Windows smoke accepts only successful matching packaged boot probes", async () => {
  const { validateProbe } = await import("../../../scripts/verify-windows-installer.mjs");
  const good = {
    ok: true, appName: "Ocode", version: "0.21.0-beta.1", platform: "win32",
    hostProtocol: 11, ctrlRBlocked: true,
    projectRemove: { ok: true, removed: false, sessionsRemoved: 0 },
  };
  assert.deepEqual(validateProbe(`BOOT_PROBE ${JSON.stringify(good)}\n`, good.version), good);
  for (const patch of [{ ok: false }, { appName: "Electron" }, { version: "0.0.0" },
    { platform: "linux" }, { hostProtocol: null }, { ctrlRBlocked: false },
    { projectRemove: { ok: false } }]) {
    assert.throws(() => validateProbe(`BOOT_PROBE ${JSON.stringify({ ...good, ...patch })}`, good.version));
  }
  assert.throws(() => validateProbe("no probe", good.version));
  assert.throws(() => validateProbe("BOOT_PROBE invalid", good.version));
});

test("Windows smoke reports boot failure reasons", async () => {
  const { validateProbe } = await import("../../../scripts/verify-windows-installer.mjs");
  assert.throws(() => validateProbe('BOOT_PROBE {"ok":false,"reason":"isolated profile required"}', "1.0.0"), /isolated profile required/);
});

test("Windows packaged boot profiles satisfy the existing destructive-probe guard", async () => {
  const { createBootProfile } = await import("../../../scripts/verify-windows-installer.mjs");
  const { basename, dirname } = await import("node:path");
  const { tmpdir } = await import("node:os");
  const { realpath, rm } = await import("node:fs/promises");
  const profile = await createBootProfile();
  try {
    const actual = await realpath(profile);
    assert.ok(basename(actual).startsWith("ocode-boot-"));
    assert.equal(dirname(actual), await realpath(tmpdir()));
  } finally {
    await rm(profile, { recursive: true, force: true });
  }
});
