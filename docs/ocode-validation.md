# Ocode rename validation

Validation date: 2026-10-16. Import baseline: upstream `d940c8d`.

## Scope

Product names, application IDs, desktop executables, shortcuts, installer and
remote Host artifact patterns, workspace packages/imports, IPC and environment
prefixes, renderer bridge, local storage keys, documentation, release metadata,
plugin CLI, platform icons and home animation have been aligned to Ocode.
See the [identity decision](adr/ocode-product-identity.md); repository-root `UPSTREAM.md` records attribution.

## Executed checks

- Pinned pnpm 12.8.1 frozen-lockfile install: passed; 827 packages installed,
  108 direct dependency declarations and 23 workspace links verified. Install
  scripts were intentionally disabled. The lockfile was not regenerated.
- Full JavaScript workspace build, including Electron bundles and documentation:
  passed. Desktop TypeScript check: passed.
- Shared package: 98 test files / 1,272 tests passed (the package runs source
  and emitted test files). Plugin devkit: 52 tests passed.
- Final desktop rename-focused suite: 136 tests, 135 passed and one platform
  skip; no failures. Covers identities, all installer naming patterns, isolated
  profiles, link/bridge compatibility, updates, local preferences and Host URLs.
- Agent policy synchronization, style tokens, pinned Pi dependency alignment,
  and installed dependency-patch checks: passed. Patch hash suite: 7 passed.
- JSON/workspace scan: 39 JSON files parsed, 965 workspace import references
  checked, no undeclared workspace scope. Intentional copyright and compatibility
  references are excluded from the old-product-name prohibition.
- `ocode-host --help` and `ocode-plugin --help` execute successfully.
- ICO includes 16/32/48/64/128/256px entries; ICNS loads at 1024px. Light/dark
  home GIFs contain 24 frames and paired still images. Generated icons and DMG
  plates load successfully. This is file/format validation, not installer QA.
- `git diff --check` passes. Upstream license and all three dependency patches
  remain byte-for-byte unchanged.

## Platform limitations

This Windows environment lacks Cargo/Rust and a provisioned Electron runtime.
No native Rust build, signed installer, installed-app launch or clean-machine
upgrade was performed. The installer filenames are configured and tested, not
claims of new distributable files.

Additional POSIX-oriented tests were attempted, not passed: SSH transport tests
cannot execute extensionless shebang fixtures through Windows `spawn`; remote
provider sync rejects the unsupported POSIX admin-socket environment; cache
path assertions use POSIX paths; Host configuration/credential tests include
POSIX paths and mode-bit assertions unavailable on Windows. These require a
supported Linux/macOS validation environment. No permissions were weakened or
tests disabled to turn those failures green.

The private GitHub repository has no release assets and does not support
anonymous artifact downloads. Configure an appropriate distribution channel and
maintainer-owned signing/notarization credentials before shipping. CNB mirroring
remains disabled without explicit repository configuration. No live user profile,
credential store, paid provider or application update endpoint was used in tests.
