#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "apps/desktop/package.json"));
const { load } = createRequire(require.resolve("electron-updater/package.json"))("js-yaml");

export async function verifyWindowsUpdateFeed(releaseDir, version) {
  const feedName = version.includes("-") ? `${version.split("-")[1].split(".")[0]}.yml` : "latest.yml";
  const feed = load(await readFile(join(releaseDir, feedName), "utf8"));
  const name = `Ocode-Setup-${version}.exe`;
  assert.equal(feed.version, version, "update feed version must match the app");
  assert.equal(feed.path, name, "only NSIS may own the update feed");
  assert.ok(Array.isArray(feed.files) && feed.files.length === 1, "feed must contain exactly one Windows installer");
  assert.equal(feed.files[0].url, name, "portable artifacts must not enter the installed update lane");
  const file = join(releaseDir, name);
  const { size } = await stat(file);
  assert.equal(feed.files[0].size, size, "update feed installer size mismatch");
  const hash = createHash("sha512");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  const sha512 = hash.digest("base64");
  assert.equal(feed.sha512, sha512, "legacy update checksum mismatch");
  assert.equal(feed.files[0].sha512, sha512, "update checksum mismatch");
  assert.ok((await stat(`${file}.blockmap`)).size > 0, "NSIS blockmap is required");
  return { feedName, version, installer: name, bytes: size, sha512 };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = JSON.parse(await readFile(join(root, "apps/desktop/package.json"), "utf8"));
  const directory = process.argv[2] ? resolve(process.argv[2]) : join(root, "apps/desktop/release");
  console.log(JSON.stringify(await verifyWindowsUpdateFeed(directory, manifest.version), null, 2));
}
