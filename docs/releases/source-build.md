# Building the corresponding Ocode source

This archive corresponds to the source commit recorded in `windows-verification.json` alongside the release. It preserves the PI-Desktop authorship and LGPL-3.0 license. See `LICENSE` and `UPSTREAM.md`; dependencies retain their own licenses and the committed patches must be applied.

## Windows x64 prerequisites

- Windows x64 with sufficient disk space for a Rust/Electron build.
- Node.js 24 and the pnpm version pinned in the root `package.json` (12.8.1 for 0.21.0).
- Stable Rust with the `x86_64-pc-windows-msvc` toolchain.
- Visual Studio C++ build tools and Windows SDK.
- Network access to the dependency registries and Electron build resources.

From the extracted archive root:

```powershell
pnpm install --frozen-lockfile
cargo build --release --locked -p host-core
pnpm --filter '@ocode/desktop^...' --fail-if-no-match build
pnpm --filter @ocode/desktop typecheck
pnpm --filter @ocode/desktop run dist:win
node scripts/verify-windows-update-feed.mjs
```

The installers are written to `apps/desktop/release`. The source archive includes the exact packaging configuration and dependency patches. It is sufficient to modify and rebuild the application; no private repository checkout or signing credential is required for an unsigned build. Signing requires your own certificate and is not included in this release.

`verify-windows-installer.mjs` intentionally runs only on disposable GitHub-hosted Windows runners because it silently installs and uninstalls the application. Do not bypass that guard on your normal desktop. See `.github/workflows/windows-installer.yml` for the build and isolated installation probe.

The public updater URL is fixed in the desktop package and `resources/app-update.yml`. A privately modified build should use its own distribution coordinates rather than publishing under Ocode's release channel. The application ID and profile identify installed data; do not point two concurrently running applications at one writable profile.
