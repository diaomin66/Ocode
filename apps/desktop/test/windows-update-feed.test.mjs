import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { verifyWindowsUpdateFeed } from "../../../scripts/verify-windows-update-feed.mjs";

test("Windows release feed validates the exact installer and rejects corrupt metadata", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ocode-feed-test-"));
  const version = "0.21.0";
  const installer = `Ocode-Setup-${version}.exe`;
  const bytes = Buffer.from("deterministic installer fixture");
  const sha512 = createHash("sha512").update(bytes).digest("base64");
  const valid = { version, path: installer, sha512, files: [{ url: installer, sha512, size: bytes.length }] };
  const feedPath = join(directory, "latest.yml");
  try {
    await writeFile(join(directory, installer), bytes);
    await writeFile(join(directory, `${installer}.blockmap`), "blockmap fixture");
    await writeFile(feedPath, JSON.stringify(valid));
    assert.equal((await verifyWindowsUpdateFeed(directory, version)).installer, installer);
    for (const patch of [
      { version: "0.20.0" },
      { path: "Ocode-Portable-0.21.0.exe" },
      { sha512: "wrong" },
      { files: [] },
      { files: [{ ...valid.files[0], url: "../evil.exe" }] },
      { files: [{ ...valid.files[0], size: 1 }] },
      { files: [{ ...valid.files[0], sha512: "wrong" }] },
    ]) {
      await writeFile(feedPath, JSON.stringify({ ...valid, ...patch }));
      await assert.rejects(verifyWindowsUpdateFeed(directory, version));
    }
    await writeFile(feedPath, JSON.stringify(valid));
    await writeFile(join(directory, installer), "modified installer");
    await assert.rejects(verifyWindowsUpdateFeed(directory, version));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("Windows release candidate preserves the update feed and verifies its packaged provider", async () => {
  const root = new URL("../../../", import.meta.url);
  const workflow = await readFile(new URL(".github/workflows/windows-installer.yml", root), "utf8");
  const verifier = await readFile(new URL("scripts/verify-windows-installer.mjs", root), "utf8");
  assert.match(workflow, /apps\/desktop\/release\/latest\.yml/);
  assert.match(verifier, /verifyWindowsUpdateFeed/);
  assert.match(verifier, /Ocode/);
  assert.match(verifier, /app-update\.yml/);
});

test("stable release uses the public Ocode repository and validates publication", async () => {
  const root = new URL("../../../", import.meta.url);
  const manifest = JSON.parse(await readFile(new URL("apps/desktop/package.json", root), "utf8"));
  const updater = await readFile(new URL("apps/desktop/resources/app-update.yml", root), "utf8");
  const workflow = await readFile(new URL(".github/workflows/windows-release.yml", root), "utf8");
  const checksums = await readFile(new URL("scripts/create-release-checksums.mjs", root), "utf8");
  assert.equal(manifest.build.publish[0].repo, "Ocode");
  assert.match(updater, /repo: Ocode\r?\n/);
  assert.match(workflow, /github\.repository == 'diaomin66\/Ocode'/);
  assert.match(workflow, /--jq \.visibility/);
  assert.match(workflow, /merge-base --is-ancestor/);
  assert.match(workflow, /permissions:\n      contents: write/);
  assert.match(workflow, /gh release create/);
  assert.match(checksums, /createHash\("sha256"\)/);
});
