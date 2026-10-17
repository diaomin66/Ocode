# ADR: Ocode product and distribution identity

- Status: Accepted

## Context

Ocode is a separately branded derivative of upstream PI-Desktop at revision `d940c8d`.
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
- Development, feedback and Windows release repository: public `diaomin66/Ocode`
  with complete Git history and upstream authorship. Starting with 0.21.1,
  installer updates and downloads use that repository. Corresponding source
  archives exclude ignored profiles and local configuration. Existing
  `Ocode-releases/v0.21.0` assets remain unchanged; its `0.21.0-beta.1` binaries
  need one manual upgrade. CNB mirroring remains opt-in. No update credentials
  are embedded. The 0.21.1 Windows release is explicitly unsigned.
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

Ocode is a distinct installation, not an in-place upstream update. Public
Windows releases and anonymous update feeds share the public source repository.
Remote Linux Host artifacts still require a separate native validation and
distribution lane. Historical screenshots remain upstream illustrations rather
than evidence of new Ocode builds. Platform signing requires the maintainer's
own certificates; unsigned Windows packages may show publisher warnings.

## Validation

`ocode-branding.test.mjs` verifies application, package, artifact, release and
profile identities. `ocode-compatibility.test.mjs` exercises copy/paste session
links and both preload names, including forbidden-channel rejection. Existing
development-profile, renderer-branding, remote Host, release and signing suites
remain the regression surface; an unrun platform test is not a passing test.
