import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createReleaseChecksums, windowsReleaseFiles } from "../../../scripts/create-release-checksums.mjs";
import { verifyWindowsReleaseAssets } from "../../../scripts/verify-windows-release-assets.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const version = "0.21.1";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("release publication accepts complete tested assets and rejects tampering", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ocode-release-test-"));
  const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  const probe = { ok: true, appName: "Ocode", version, platform: "win32", hostProtocol: 11,
    ctrlRBlocked: true, projectRemove: { ok: true, removed: false, sessionsRemoved: 0 } };
  try {
    const artifacts = [];
    for (const name of windowsReleaseFiles(version).filter((name) => /\.(exe|blockmap|zip)$/.test(name))) {
      const bytes = Buffer.from(`deterministic ${name}`);
      await writeFile(join(directory, name), bytes);
      artifacts.push({ name, bytes: bytes.length, sha256: sha256(bytes) });
    }
    const installer = `Ocode-Setup-${version}.exe`;
    const installerBytes = await readFile(join(directory, installer));
    const sha512 = createHash("sha512").update(installerBytes).digest("base64");
    const feedBytes = Buffer.from(JSON.stringify({ version, path: installer, sha512,
      files: [{ url: installer, sha512, size: installerBytes.length }] }));
    await writeFile(join(directory, "latest.yml"), feedBytes);
    artifacts.push({ name: "latest.yml", bytes: feedBytes.length, sha256: sha256(feedBytes) });
    await copyFile(join(root, "LICENSE"), join(directory, "LICENSE"));
    execFileSync("git", ["archive", "--format=tar.gz", `--prefix=Ocode-${version}/`,
      `--output=${join(directory, `Ocode-Source-${version}.tar.gz`)}`, commit], { cwd: root });
    const evidence = { version, commit, base: commit, architecture: "x64", signed: false,
      signatures: { installer: "NotSigned", portable: "NotSigned", installed: "NotSigned", zip: "NotSigned" },
      installedProbe: probe, zipProbe: probe, artifacts,
      updateFeed: { feedName: "latest.yml", version, installer, bytes: installerBytes.length, sha512 } };
    const evidencePath = join(directory, "windows-verification.json");
    const writeEvidence = (value) => writeFile(evidencePath, JSON.stringify(value));
    await writeEvidence(evidence);
    await createReleaseChecksums(directory, version);
    assert.equal((await verifyWindowsReleaseAssets(directory, version, commit)).assets, 9);

    const extra = join(directory, "unreviewed.txt");
    await writeFile(extra, "unexpected asset");
    await assert.rejects(verifyWindowsReleaseAssets(directory, version, commit), /unexpected or missing/);
    await rm(extra);
    for (const patch of [{ commit: "0".repeat(40) }, { signed: true },
      { installedProbe: { ...probe, ok: false } },
      { artifacts: artifacts.map((item) => ({ ...item, bytes: 1 })) }]) {
      await writeEvidence({ ...evidence, ...patch });
      await createReleaseChecksums(directory, version);
      await assert.rejects(verifyWindowsReleaseAssets(directory, version, commit));
    }
    await writeEvidence(evidence);
    await createReleaseChecksums(directory, version);
    await writeFile(join(directory, `Ocode-Portable-${version}.exe`), "corrupt download");
    await assert.rejects(verifyWindowsReleaseAssets(directory, version, commit), /checksums/);
    await createReleaseChecksums(directory, version);
    await assert.rejects(verifyWindowsReleaseAssets(directory, version, commit));
    await writeFile(join(directory, `Ocode-Portable-${version}.exe`), `deterministic Ocode-Portable-${version}.exe`);
    await writeFile(join(directory, "LICENSE"), "wrong license");
    await createReleaseChecksums(directory, version);
    await assert.rejects(verifyWindowsReleaseAssets(directory, version, commit), /LICENSE/);
    await copyFile(join(root, "LICENSE"), join(directory, "LICENSE"));
    const source = join(directory, `Ocode-Source-${version}.tar.gz`);
    execFileSync("git", ["archive", "--format=tar.gz", "--prefix=wrong-source/", `--output=${source}`, commit], { cwd: root });
    await createReleaseChecksums(directory, version);
    await assert.rejects(verifyWindowsReleaseAssets(directory, version, commit), /source archive/);
    await rm(source);
    await assert.rejects(createReleaseChecksums(directory, version), /ENOENT/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
