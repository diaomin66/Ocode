# Ocode product and distribution identity

Status: Accepted for the separately branded derivative.

## Context

Ocode is a private derivative of upstream PI-Desktop at revision `d940c8d`.
A product rename must include shipped binaries and resources, not only titles.
Reusing the upstream application ID, profile or update channel would risk opening
another running product's database, conflicting single-instance locks, and
installing the wrong executable during an update.

## Decision

- Product: `Ocode`; application ID: `com.ocode.desktop`; workspace scope: `@ocode`.
- Desktop executable: `Ocode.exe` / `Ocode.app` / `ocode`; Linux desktop file:
  `ocode.desktop`; NSIS shortcut: `Ocode`.
- IPC channels and internal renderer bridge: `ocode/` and `window.ocode`.
  `window.piDesktop` remains a compatibility alias of the same allowlisted API.
- Environment and tooling prefixes: `OCODE_`; profiles: `.ocode`, `.ocode-dev`
  and Electron `Ocode` / `Ocode Dev`. Legacy profile overrides are not consumed.
- Remote Host: `apps/ocode-host`, package `@ocode/host`, command `ocode-host`,
  bundle `ocode-host-<version>-<platform>-<arch>.tar.gz`, Rust binary
  `ocode-host-core`. Ocode Host and desktop must be deployed together.
- Plugin CLI: `ocode-plugin`; `pi-plugin` remains a compatibility alias.
- New session links use `ocode://`; pasted `pi-desktop://session/` links remain
  readable with identical identifier bounds and reference limits.
- Release/feedback repository: `diaomin66/Ocode`. CNB mirroring is opt-in and
  uses only maintainer-configured coordinates. Signing uses the maintainer's
  credentials, never a hard-coded upstream developer identity.
- The geometric O/slash mark is generated locally by `scripts/make-brand.py`;
  `make-icon.py` and `make-dmg-background.py` derive platform resources.

## Compatibility and ownership

The process model, permissions, plugin sandbox and IPC allowlist do not change.
Third-party Pi engine identities, plugin `pi.*` contracts, `engines.piDesktop`,
`minPiDesktop`, `.piplug` and plugin theme tokens remain interoperable. Upstream
copyright, authorship, licenses, plugin source addresses and historical evidence
remain intact. The internal `pi.sqlite` filename and schema remain unchanged;
renaming a database is not a branding operation and could hide existing data.
No automatic copying, moving or opening of upstream profiles is performed.
Explicit migration requires a backed-up offline copy and may require credential
reauthentication. Never point two running products at one writable database.

## Consequences

Ocode is a distinct installation, not an in-place upstream update. The private
repository does not provide anonymous release access; updates and automatic
remote Host downloads need an appropriate distribution channel before public
builds are distributed. No credentials are embedded to work around this.
Historical screenshots are retained as upstream illustrations, not evidence of
new Ocode builds. Platform signing and packaging still require their native
build environments and the maintainer's own certificates.

## Validation

`ocode-branding.test.mjs` verifies application, package, artifact, release and
profile identities. `ocode-compatibility.test.mjs` exercises copy/paste session
links and both preload names, including forbidden-channel rejection. Existing
development-profile, renderer-branding, remote Host, release and signing suites
remain the regression surface; an unrun platform test is not a passing test.
