#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyWindowsUpdateFeed } from "./verify-windows-update-feed.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function windowsReleaseFiles(version) {
  assert.match(version, /^\d+\.\d+\.\d+$/, "stable Windows version required");
  return [
    `Ocode-Setup-${version}.exe`, `Ocode-Setup-${version}.exe.blockmap`,
    `Ocode-Portable-${version}.exe`, `Ocode-Portable-${version}.zip`,
    "latest.yml", "windows-verification.json", `Ocode-Source-${version}.tar.gz`,
    "LICENSE",
  ].sort();
}

export async function assetSha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

export async function createReleaseChecksums(directory, version) {
  await verifyWindowsUpdateFeed(directory, version);
  const lines = [];
  for (const name of windowsReleaseFiles(version)) {
    const file = join(directory, name);
    assert.ok((await stat(file)).size > 0, `${name} is empty`);
    lines.push(`${await assetSha256(file)}  ${name}`);
  }
  await writeFile(join(directory, "SHA256SUMS.txt"), `${lines.join("\n")}\n`);
  return lines;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = JSON.parse(await readFile(join(root, "apps/desktop/package.json"), "utf8"));
  const directory = resolve(process.argv[2] ?? join(root, "apps/desktop/release"));
  console.log((await createReleaseChecksums(directory, manifest.version)).join("\n"));
}
