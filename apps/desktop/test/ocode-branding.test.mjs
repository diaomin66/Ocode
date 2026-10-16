import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const manifest = JSON.parse(read("apps/desktop/package.json"));

test("Ocode uses an isolated identity and its own release repository", () => {
  assert.equal(manifest.name, "@ocode/desktop");
  assert.equal(manifest.build.productName, "Ocode");
  assert.equal(manifest.build.appId, "com.ocode.desktop");
  assert.equal(manifest.build.win.executableName, "Ocode");
  assert.equal(manifest.build.nsis.shortcutName, "Ocode");
  assert.deepEqual(manifest.build.publish, [
    { provider: "github", owner: "diaomin66", repo: "Ocode" },
  ]);
  assert.match(read("apps/desktop/resources/app-update.yml"), /owner: diaomin66\r?\nrepo: Ocode/);
  assert.match(read("packages/shared/src/protocol.ts"), /APP_NAME = "Ocode"/);
});

test("all workspace names and local imports agree on the Ocode scope", () => {
  for (const name of ["shared", "agent-runtime", "agent-host", "host-runtime", "racp", "i18n", "plugin-sdk", "plugin-devkit", "voice-runtime"]) {
    assert.equal(JSON.parse(read(`packages/${name}/package.json`)).name, `@ocode/${name}`);
  }
  for (const path of ["packages/agent-runtime/src/runtime.ts", "packages/agent-runtime/src/extensions/runner.ts", "scripts/e2e/settings-scroll.jsx"]) {
    assert.equal(/@pi-desktop\//.test(read(path)), false, `${path} contains a legacy workspace import`);
  }
});

test("Ocode keeps upstream attribution and does not silently copy user profiles", () => {
  assert.match(read("UPSTREAM.md"), /vastsa\/PI-Desktop/);
  assert.match(read("UPSTREAM.md"), /LGPL/);
  const paths = read("apps/desktop/electron/main/data-paths.ts");
  assert.match(paths, /INSTALLATION_DATA_DIR_NAME = "\.ocode"/);
  assert.match(paths, /DEVELOPMENT_DATA_DIR_NAME = "\.ocode-dev"/);
  assert.doesNotMatch(paths, /cpSync|copyFile|renameSync/);
});

test("every distributable and remote host asset uses the Ocode identity", () => {
  for (const platform of ["mac", "dmg", "win", "nsis", "portable", "deb", "rpm", "linux"]) {
    assert.match(manifest.build[platform].artifactName, /^ocode[-_]/i, platform);
  }
  assert.equal(manifest.build.linux.executableName, "ocode");
  assert.equal(manifest.build.deb.packageName, "ocode");
  assert.equal(manifest.build.rpm.packageName, "ocode");
  assert.equal(manifest.desktopName, "ocode.desktop");
  const host = JSON.parse(read("apps/ocode-host/package.json"));
  assert.equal(host.name, "@ocode/host");
  assert.deepEqual(host.bin, { "ocode-host": "./dist/cli.js" });
  assert.match(read("crates/host-core/Cargo.toml"), /name = "ocode-host-core"/);
  assert.match(read("pnpm-lock.yaml"), /\n  apps\/ocode-host:/);
  for (const path of [".github/workflows/release.yml", "apps/ocode-host/scripts/bundle.mjs", "apps/ocode-host/scripts/install.sh", "apps/desktop/electron/main/remote/ocode-host-release.ts"]) {
    const text = read(path);
    assert.equal(/pi-host|PI_HOST|@pi-desktop|PI-Desktop/.test(text), false, path);
    assert.match(text, /ocode-host/);
  }
});

test("fork integrations do not inherit an imaginary CNB release mirror", () => {
  const workflow = read(".github/workflows/mirror-to-cnb.yml");
  assert.match(workflow, /vars\.CNB_MIRROR_ENABLED == 'true'/);
  assert.match(workflow, /CNB_BUILD_URL: \$\{\{ vars\.CNB_BUILD_URL \}\}/);
  assert.equal(/https:\/\/api\.cnb\.cool\//.test(workflow), false);
});
