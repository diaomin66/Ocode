const assert = require("node:assert/strict");
const { app, BrowserWindow } = require("electron");
const { mkdirSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const fixtureDir = process.argv[2];
app.setName("Ocode Home Mark Test");
app.setPath("userData", join(fixtureDir, "profile"));
app.setPath("sessionData", join(fixtureDir, "session"));

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false, width: 640, height: 640, useContentSize: true,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
  });
  const evaluate = (code) => win.webContents.executeJavaScript(code);
  const settle = () => evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
  const checks = [];
  function check(name, condition, detail) {
    assert.ok(condition, `${name}: ${JSON.stringify(detail)}`);
    checks.push(name);
  }
  try {
    // No app entrypoint, preload, host bridge or user profile is loaded.
    win.webContents.session.webRequest.onBeforeRequest((details, callback) => {
      callback({ cancel: !details.url.startsWith("file:") && !details.url.startsWith("devtools:") });
    });
    await win.loadFile(join(fixtureDir, "index.html"));
    assert.equal(await evaluate("window.homeMascotFixtureReady"), true);
    win.webContents.debugger.attach("1.3");
    const command = (name, args) => win.webContents.debugger.sendCommand(name, args);
    await command("Emulation.setFocusEmulationEnabled", { enabled: true });
    const motionPreference = async (value) => {
      await command("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value }] });
      await settle();
    };
    await motionPreference("no-preference");
    const mount = await evaluate(`(() => {
      const logo = document.querySelector('[data-testid="home-mascot-logo"]');
      const svg = logo.querySelector('svg');
      const bounds = logo.getBoundingClientRect();
      return { width: bounds.width, height: bounds.height, hidden: logo.getAttribute('aria-hidden'),
        focusable: svg.getAttribute('focusable'), viewBox: svg.getAttribute('viewBox'),
        raster: logo.querySelectorAll('img,image,canvas').length,
        animations: logo.getAnimations({ subtree: true }).map(a => ({
          name: a.animationName, target: a.effect.target.tagName, duration: a.effect.getTiming().duration,
          infinite: a.effect.getTiming().iterations === Infinity,
          properties: [...new Set(a.effect.getKeyframes().flatMap(k => Object.keys(k)
            .filter(key => !['offset','computedOffset','easing','composite'].includes(key))))],
        })) };
    })()`);
    check("100px decorative vector renders through the real component", mount.width === 100 && mount.height === 100 &&
      mount.hidden === "true" && mount.focusable === "false" && mount.viewBox === "0 0 1024 1024" && mount.raster === 0, mount);
    assert.deepEqual(mount.animations, [{ name: "home-mascot-wobble", target: "SPAN", duration: 2400, infinite: true, properties: ["transform"] }]);
    checks.push("one transform-only animation belongs to the HTML compositor layer");

    const samples = await evaluate(`(() => {
      const motion = document.querySelector('.home-mascot-motion');
      const animation = motion.getAnimations()[0];
      animation.pause();
      const angles = [0, 16, 32, 48, 64, 80, 96, 1200, 2399, 2400, 2401].map(time => {
        animation.currentTime = time;
        const matrix = new DOMMatrix(getComputedStyle(motion).transform);
        return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
      });
      animation.play();
      return angles;
    })()`);
    check("motion interpolates within an old 100ms GIF frame", new Set(samples.slice(0, 7).map(n => n.toFixed(5))).size === 7, samples);
    check("wobble stays subtle and the loop joins without a jump", Math.abs(samples[0] + 3) < 0.001 &&
      Math.abs(samples[7] - 3) < 0.001 && Math.abs(samples[8] - samples[10]) < 0.001 && Math.abs(samples[0] - samples[9]) < 0.001, samples);

    const themeChanges = await evaluate(`(() => {
      const logo = document.querySelector('.home-mascot-logo');
      const motion = logo.querySelector('.home-mascot-motion');
      const animation = motion.getAnimations()[0];
      const start = animation.startTime;
      const colors = ['light', 'dark', 'unset'].map(theme => {
        const select = document.getElementById('theme');
        select.value = theme;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return getComputedStyle(logo.querySelector('path')).stroke;
      });
      return { colors, sameNode: logo === document.querySelector('.home-mascot-logo'),
        sameAnimation: animation === motion.getAnimations()[0], sameStart: start === animation.startTime };
    })()`);
    check("theme changes update ink without remounting or restarting motion", themeChanges.sameNode && themeChanges.sameAnimation &&
      themeChanges.sameStart && JSON.stringify(themeChanges.colors) === JSON.stringify(["rgb(32, 33, 36)", "rgb(249, 249, 247)", "rgb(249, 249, 247)"]), themeChanges);

    await evaluate("window.mascotAnimationBeforeHover = document.querySelector('.home-mascot-motion').getAnimations()[0]");
    const hoverPoint = await evaluate(`(() => {
      const bounds = document.querySelector('.home-mascot-logo').getBoundingClientRect();
      return { x: Math.round(bounds.x + bounds.width / 2), y: Math.round(bounds.y + bounds.height / 2) };
    })()`);
    win.webContents.sendInputEvent({ type: "mouseMove", ...hoverPoint });
    await settle();
    check("hover leaves the loop and cadence unchanged", await evaluate(`(() => {
      const animation = document.querySelector('.home-mascot-motion').getAnimations()[0];
      return animation === window.mascotAnimationBeforeHover && animation.playbackRate === 1 &&
        animation.playState === 'running' && animation.effect.getTiming().duration === 2400;
    })()`));

    await evaluate("document.getElementById('theme').focus()");
    win.webContents.sendInputEvent({ type: "keyDown", keyCode: "Tab" });
    win.webContents.sendInputEvent({ type: "keyUp", keyCode: "Tab" });
    await settle();
    const focus = await evaluate(`({ id: document.activeElement.id, visible: document.activeElement.matches(':focus-visible'),
      outline: getComputedStyle(document.activeElement).outlineStyle, tabbable: [...document.querySelectorAll('.home-mascot-logo, .home-mascot-logo *')].some(e => e.tabIndex >= 0) })`);
    check("keyboard focus skips the decorative mark and remains visible", focus.id === "toggle" && focus.visible && focus.outline !== "none" && !focus.tabbable, focus);

    const responsive = [];
    for (const [width, scale] of [[320, 1], [375, 2], [1024, 3]]) {
      await command("Emulation.setDeviceMetricsOverride", { width, height: 640, deviceScaleFactor: scale, mobile: false });
      await settle();
      responsive.push(await evaluate(`(() => {
        const logo = document.querySelector('.home-mascot-logo');
        const bounds = logo.getBoundingClientRect();
        const shape = logo.querySelector('rect').getBoundingClientRect();
        return { width: bounds.width, height: bounds.height, dpr: devicePixelRatio,
          overflow: document.documentElement.scrollWidth > innerWidth,
          contained: shape.left >= bounds.left && shape.right <= bounds.right && shape.top >= bounds.top && shape.bottom <= bounds.bottom };
      })()`));
    }
    check("narrow and high-DPI layouts preserve the slot without clipping", responsive.every(r => r.width === 100 && r.height === 100 && !r.overflow && r.contained), responsive);
    await command("Emulation.clearDeviceMetricsOverride");

    for (const theme of ["light", "dark"]) {
      await evaluate(`document.documentElement.dataset.theme = ${JSON.stringify(theme)}`);
      await motionPreference("reduce");
      const reduced = await evaluate(`(() => {
        const logo = document.querySelector('.home-mascot-logo');
        const style = getComputedStyle(logo.querySelector('.home-mascot-motion'));
        return { count: logo.getAnimations({ subtree: true }).length, transform: style.transform,
          layer: style.willChange, visible: logo.querySelector('svg').getBoundingClientRect().width === 100,
          stroke: getComputedStyle(logo.querySelector('path')).stroke };
      })()`);
      check(`${theme} reduced motion keeps the vector upright and releases the layer`, reduced.count === 0 && reduced.transform === "none" &&
        reduced.layer === "auto" && reduced.visible && reduced.stroke === (theme === "light" ? "rgb(32, 33, 36)" : "rgb(249, 249, 247)"), reduced);
      if (process.env.OCODE_MASCOT_ARTIFACT_DIR) {
        mkdirSync(process.env.OCODE_MASCOT_ARTIFACT_DIR, { recursive: true });
        writeFileSync(join(process.env.OCODE_MASCOT_ARTIFACT_DIR, `${theme}.png`), (await win.webContents.capturePage()).toPNG());
      }
    }
    await motionPreference("no-preference");
    check("motion resumes when the OS preference changes", await evaluate("document.querySelector('.home-mascot-motion').getAnimations().length === 1"));

    const lifecycle = await evaluate(`(() => {
      const logo = document.querySelector('.home-mascot-logo');
      const animation = logo.querySelector('.home-mascot-motion').getAnimations()[0];
      document.getElementById('toggle').click();
      const removed = !document.querySelector('.home-mascot-logo') && !document.getAnimations().includes(animation);
      document.getElementById('toggle').click();
      return { removed, remounted: document.querySelectorAll('.home-mascot-logo').length === 1,
        animations: document.querySelector('.home-mascot-logo').getAnimations({ subtree: true }).length };
    })()`);
    check("leaving and returning to home releases and recreates one animation", lifecycle.removed && lifecycle.remounted && lifecycle.animations === 1, lifecycle);

    let layers = [];
    win.webContents.debugger.on("message", (_event, method, params) => {
      if (method === "LayerTree.layerTreeDidChange") layers = params.layers ?? [];
    });
    await command("LayerTree.enable");
    await settle();
    const reasons = [];
    for (const layer of layers) {
      const result = await command("LayerTree.compositingReasons", { layerId: layer.layerId });
      reasons.push(...result.compositingReasons);
    }
    check("Chromium promotes the active transform animation", reasons.some(reason => /active.*transform.*animation|will-change.*transform/i.test(reason)), reasons);
    console.log("HOME_MASCOT_RESULT " + JSON.stringify({ checks, responsive, compositingReasons: reasons }));
  } finally {
    win.destroy();
  }
  app.exit(0);
}).catch(error => { console.error(error.stack); app.exit(1); });
