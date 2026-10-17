#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { createGunzip } from "node:zlib";
import { assetSha256, windowsReleaseFiles } from "./create-release-checksums.mjs";
import { validateProbe } from "./verify-windows-installer.mjs";
import { verifyWindowsUpdateFeed } from "./verify-windows-update-feed.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const run = promisify(execFile);

async function verifyCorrespondingSource(directory, version, commit) {
  const temp = await mkdtemp(join(tmpdir(), "ocode-source-verification-"));
  try {
    const expected = join(temp, "source.tar");
    await run("git", ["archive", "--format=tar", `--prefix=Ocode-${version}/`, `--output=${expected}`, commit], { cwd: root });
    const hash = createHash("sha256");
    const input = createReadStream(join(directory, `Ocode-Source-${version}.tar.gz`));
    const decompressed = input.pipe(createGunzip());
    input.on("error", (error) => decompressed.destroy(error));
    for await (const chunk of decompressed) hash.update(chunk);
    assert.equal(hash.digest("hex"), await assetSha256(expected), "source archive must exactly match the tested commit");
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

export async function verifyWindowsReleaseAssets(directory, version, commit) {
  assert.match(commit, /^[0-9a-f]{40}$/, "exact source commit required");
  const names = windowsReleaseFiles(version);
  assert.deepEqual((await readdir(directory)).sort(), [...names, "SHA256SUMS.txt"].sort(), "unexpected or missing release assets");
  const lines = (await readFile(join(directory, "SHA256SUMS.txt"), "utf8")).trim().split(/\r?\n/);
  const expected = [];
  for (const name of names) {
    assert.ok((await stat(join(directory, name))).size > 0, `${name} is empty`);
    expected.push(`${await assetSha256(join(directory, name))}  ${name}`);
  }
  assert.deepEqual(lines, expected, "release checksums must match every published asset");
  assert.deepEqual(await readFile(join(directory, "LICENSE")), await readFile(join(root, "LICENSE")), "LICENSE must match the source license");
  const feed = await verifyWindowsUpdateFeed(directory, version);
  const evidence = JSON.parse(await readFile(join(directory, "windows-verification.json"), "utf8"));
  assert.equal(evidence.version, version);
  assert.equal(evidence.commit, commit);
  assert.match(evidence.base, /^[0-9a-f]{40}$/);
  assert.equal(evidence.architecture, "x64");
  assert.equal(evidence.signed, false);
  assert.deepEqual(evidence.signatures, { installer: "NotSigned", portable: "NotSigned", installed: "NotSigned", zip: "NotSigned" });
  assert.deepEqual(evidence.updateFeed, feed);
  for (const probe of [evidence.installedProbe, evidence.zipProbe]) validateProbe(`BOOT_PROBE ${JSON.stringify(probe)}`, version);
  assert.deepEqual(evidence.artifacts.map((item) => item.name).sort(), names.filter((name) => /\.(exe|blockmap|zip|yml)$/.test(name)).sort());
  for (const artifact of evidence.artifacts) {
    assert.equal(artifact.bytes, (await stat(join(directory, artifact.name))).size);
    assert.equal(artifact.sha256, await assetSha256(join(directory, artifact.name)));
  }
  await verifyCorrespondingSource(directory, version, commit);
  return { version, commit, assets: names.length + 1, updateFeed: feed };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [directory, version, commit] = process.argv.slice(2);
  console.log(JSON.stringify(await verifyWindowsReleaseAssets(resolve(directory), version, commit), null, 2));
}
