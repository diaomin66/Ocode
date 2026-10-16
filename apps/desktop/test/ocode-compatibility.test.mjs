import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const links = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(read("packages/shared/src/session-link.ts"))).toString("base64")}`);

test("copied Ocode links and pasted legacy links share one bounded parser", () => {
  assert.equal(links.formatSessionLink("abc"), "ocode://session/abc");
  const text = "pi-desktop://session/abc then ocode://session/abc then pi-desktop://session/def";
  assert.deepEqual(links.parseSessionLinks(text), ["abc", "def"]);
  assert.equal(links.parseSessionLinkToken(" pi-desktop://session/abc "), "abc");
  assert.equal(links.isSessionLinkToken("pi-desktop://session/abc"), true);
  assert.deepEqual(links.sessionLinkSpans(text).map(({ start, end }) => text.slice(start, end)), [
    "pi-desktop://session/abc", "ocode://session/abc", "pi-desktop://session/def",
  ]);
  for (const scheme of ["ocode", "pi-desktop"]) {
    for (const suffix of ["", "remote:abc", "abc/deeper", "a".repeat(65)]) {
      assert.deepEqual(links.parseSessionLinks(`${scheme}://session/${suffix}`), []);
    }
    assert.equal(links.parseSessionLinkToken(`${scheme}://session/abc trailing abc`), null);
    assert.equal(links.parseSessionLinkToken(`${scheme}://session/abc ${scheme}://session/abc`), null);
  }
  assert.equal(links.parseSessionLinks(Array.from({ length: 8 }, (_, i) => `pi-desktop://session/id${i}`).join(" ")).length, 4);
});

test("Ocode preload keeps a legacy alias without widening IPC permissions", async () => {
  const exposed = new Map();
  const calls = [];
  const source = stripTypeScriptTypes(read("apps/desktop/electron/preload/index.ts"))
    .replace(/^import .*;\r?\n/gm, "");
  vm.runInNewContext(source, {
    contextBridge: { exposeInMainWorld(name, api) { exposed.set(name, api); } },
    ipcRenderer: {
      async invoke(...args) { calls.push(args); return { ok: true }; },
      on() {}, removeListener() {},
    },
    webUtils: { getPathForFile() { return ""; } },
    IPC: { event: { liveVoicePort: "ocode/voice/port" } },
    IPC_WHITELIST: new Set(["ocode/settings/get"]),
    process: { argv: [], platform: "win32" },
  });
  assert.ok(exposed.has("ocode"));
  assert.strictEqual(exposed.get("ocode"), exposed.get("piDesktop"));
  await exposed.get("ocode").invoke("ocode/settings/get");
  assert.equal(calls.length, 1);
  for (const name of ["ocode", "piDesktop"]) {
    await assert.rejects(exposed.get(name).invoke("forbidden"), /IPC channel not allowed/);
    assert.throws(() => exposed.get(name).on("forbidden", () => {}), /IPC channel not allowed/);
  }
});
