import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { HomeMascotLogo } from "../../src/components/HomeMascotLogo";

// This fixture mounts the public component without the app store or host bridge.
const root = createRoot(document.getElementById("root"));
const toggle = document.getElementById("toggle");
const theme = document.getElementById("theme");
const status = document.getElementById("status");
let visible = true;
function render() {
  flushSync(() => root.render(visible ? <HomeMascotLogo /> : null));
  toggle.setAttribute("aria-pressed", String(visible));
  status.textContent = visible ? "Home mark mounted." : "Home mark unmounted.";
}
toggle.addEventListener("click", () => { visible = !visible; render(); });
theme.addEventListener("change", () => {
  if (theme.value === "unset") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme.value;
});
render();
window.homeMascotFixtureReady = true;
