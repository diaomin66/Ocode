import { readAppSource, readComposerSource } from "./helpers/source-contracts.mjs";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { loadStyles } from "./helpers/styles.mjs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const [
  english,
  chinese,
  brandLogo,
  icons,
  sidebar,
  app,
  chatSurface,
  composer,
  styles,
  mascotLogo,
  rendererLanguage,
] = await Promise.all([
    read("../../../packages/i18n/src/locales/en/index.ts"),
    read("../../../packages/i18n/src/locales/zh-CN/index.ts"),
    read("../src/components/BrandLogo.tsx"),
    read("../src/components/icons.tsx"),
    read("../src/components/Sidebar.tsx"),
    readAppSource(),
    read("../src/components/ChatSurface.tsx"),
    readComposerSource(),
    loadStyles(),
    read("../src/components/HomeMascotLogo.tsx"),
    read("../src/lib/renderer-language.ts"),
  ]);

test("renderer surfaces the Ocode brand instead of the Codex shell brand", () => {
  assert.match(english, /shellName:\s*"Ocode"/);
  assert.match(chinese, /shellName:\s*"Ocode"/);
  assert.match(english, /placeholder:\s*"Ask Ocode to help with anything"/);
  assert.match(chinese, /placeholder:\s*"让 Ocode 帮你做任何事"/);
  assert.doesNotMatch(english, /shellName:\s*"Codex"/);
  assert.doesNotMatch(chinese, /shellName:\s*"Codex"/);
  // Codex remains a supported external import source, not the app identity.
  assert.match(english, /importSourceCodex:\s*"Codex"/);
  assert.match(chinese, /importSourceCodex:\s*"Codex"/);
});

test("app chrome uses the shared brand asset without branding the composer input", async () => {
  // Renderer-sized brand marks, not the 1024px electron-builder installer icons.
  assert.match(brandLogo, /import brandLogoUrlLight from\s*"\.\.\/assets\/brand\/logo-light\.png"/);
  assert.match(brandLogo, /import brandLogoUrlDark from\s*"\.\.\/assets\/brand\/logo-dark\.png"/);
  assert.doesNotMatch(brandLogo, /\.\.\/\.\.\/build\//);
  assert.match(brandLogo, /export function BrandLogo/);
  assert.match(brandLogo, /src=\{.*brandLogoUrl/);
  assert.match(icons, /export const IconNewSession/);
  assert.doesNotMatch(icons, /IconCodexHome|IconCompose|IconPiMark|IconPiHome/);
  await assert.rejects(
    () => access(new URL("../src/assets/home-mascot-groups.png", import.meta.url)),
  );
  assert.match(chatSurface, /<HomeMascotLogo \/>/);
  assert.match(mascotLogo, /className="home-mascot-logo"/);
  assert.match(mascotLogo, /aria-hidden="true"/);
  assert.match(mascotLogo, /<span className="home-mascot-motion">\s*<svg/);
  assert.doesNotMatch(mascotLogo, /<img|<image|<canvas|\.(?:gif|png)/);
  assert.doesNotMatch(
    mascotLogo,
    /home-mascot-orbit|Math\.random\(\)|setTimeout|setInterval|requestAnimationFrame|backgroundPosition|onMouseEnter|onMouseLeave|useState|useEffect|matchMedia/,
  );
  assert.doesNotMatch(chatSurface, /<BrandLogo/);
  assert.match(styles, /\.empty-hero-icon\s*\{[\s\S]*?height:\s*100px;[\s\S]*?width:\s*100px;/);
  assert.match(
    styles,
    /\.home-mascot-logo\s*\{[\s\S]*?display:\s*block;[\s\S]*?width:\s*100px;[\s\S]*?height:\s*100px;/,
  );
  assert.match(styles, /\.home-mascot-logo\s*\{[^}]*--home-mascot-paper:\s*#f9f9f7;[^}]*--home-mascot-ink:\s*#202124;/);
  assert.match(styles, /:root\[data-theme="light"\] \.home-mascot-logo\s*\{[^}]*color:\s*var\(--home-mascot-ink\);/);
  assert.match(styles, /\.home-mascot-motion\s*\{[^}]*animation:\s*home-mascot-wobble 2\.4s cubic-bezier\(0\.37, 0, 0\.63, 1\) infinite;/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.home-mascot-motion\s*\{\s*animation:\s*none;\s*transform:\s*none;\s*will-change:\s*auto;/);
  assert.doesNotMatch(styles, /home-mascot-(?:dark|light|still)|\.home-mascot-logo img/);
  assert.match(
    rendererLanguage,
    /if \(request === languageRequest\)\s*document\.documentElement\.lang = target/,
  );
  assert.doesNotMatch(styles, /@keyframes home-mascot-orbit|@keyframes home-mascot-breathe|@keyframes home-mascot-blink/);
  assert.doesNotMatch(styles, /background-size:\s*5000px 100px|image-rendering:\s*pixelated/);
  assert.doesNotMatch(composer, /<BrandLogo/);
  assert.doesNotMatch(composer, /composer-thread-mark/);
  assert.doesNotMatch(styles, /\.composer-thread-mark/);
  assert.doesNotMatch(styles, /\.composer-input-wrap\s*\{[^}]*\bgap:/s);
  assert.doesNotMatch(composer, /infinity-mark|∞/);
  assert.match(sidebar, /<BrandLogo\s+size=\{20\}/);
  assert.match(sidebar, /IconNewSession/);
  assert.match(app, /<IconNewSession\s+size=\{15\}/);
  assert.doesNotMatch(sidebar, /IconCompose|IconPiMark|IconPiHome/);
});

test("the home entry point renders a decorative scalable Ocode mark", async () => {
  const server = await createServer({
    root: fileURLToPath(new URL("..", import.meta.url)),
    configFile: false,
    optimizeDeps: { noDiscovery: true, include: [] },
    ssr: { optimizeDeps: { noDiscovery: true, include: [] } },
    server: { middlewareMode: true, watch: null },
    esbuild: { jsx: "automatic" },
    appType: "custom",
  });
  try {
    const { HomeMascotLogo } = await server.ssrLoadModule("/src/components/HomeMascotLogo.tsx");
    const html = renderToStaticMarkup(createElement(HomeMascotLogo));
    assert.match(html, /aria-hidden="true"/);
    assert.match(html, /<svg[^>]*viewBox="0 0 1024 1024"/);
    assert.match(html, /width="100" height="100"/);
    assert.match(html, /focusable="false"/);
    assert.match(html, /<rect[^>]*x="255"[^>]*y="245"[^>]*width="514"[^>]*height="534"[^>]*rx="145"[^>]*stroke-width="90"/);
    assert.match(html, /<path[^>]*d="M440 650 584 374"[^>]*stroke-width="70"[^>]*stroke-linecap="round"/);
    assert.doesNotMatch(html, /<img|<image|<canvas|tabindex|role="img"/);
  } finally {
    await server.close();
  }
});
