# Releasing & publishing

Maintainer runbook for cutting a release and publishing to the package
managers. End-user install instructions live in the [README](../README.md);
what shipped in each version is in the [CHANGELOG](../CHANGELOG.md).

## Releasing & auto-updates

Releases are built by `.github/workflows/release.yml` when you push a version
tag (e.g. `v0.1.0`). The app also has an in-app updater (Settings → **Check for
updates**) backed by `tauri-plugin-updater`.

Signing is already configured for this repo:

- Key pair generated with `bun tauri signer generate` (no password). The private
  key is stored **outside the repo** at `E:\Mega\keys\mdedit\mdedit.key`
  (`.pub` alongside it) — **keep a backup; if lost, updates can't be signed**.
- The **public key** is committed in `src-tauri/tauri.conf.json` (`plugins.updater.pubkey`).
- The **private key** is set as the `TAURI_SIGNING_PRIVATE_KEY` GitHub Actions secret.
  No password secret is needed (the key has none — a missing secret resolves to empty).
- The updater **endpoint** points at this repo's latest release `latest.json`.

To cut a release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The workflow builds the installers, signs them, generates `latest.json`,
**publishes** the GitHub Release (no draft), and submits the new version to
winget — all hands-off. Existing installs then see it via Settings →
**Check for updates**. (Prefer a manual review gate? Set `releaseDraft: true`
in `release.yml` and publish the draft yourself.)

To regenerate the key from scratch (only if compromised/lost), repeat
`bun tauri signer generate -w <path> --ci -f`, update the `pubkey` in
`tauri.conf.json`, and reset the `TAURI_SIGNING_PRIVATE_KEY` secret.

> **Code signing:** without an Authenticode certificate, Windows SmartScreen will
> warn on first run. The Tauri updater signature above is separate from OS code
> signing; add a code-signing certificate later for a warning-free install.

## Publishing to winget

The `winget` job in `.github/workflows/release.yml` submits a manifest PR to
[microsoft/winget-pkgs](https://github.com/microsoft/winget-pkgs) after every
release (it uses the `.msi` asset, so winget gets a ProductCode for clean
upgrade detection). No code-signing certificate is required.

**One-time setup**

1. Create a **classic** GitHub Personal Access Token with the `public_repo`
   scope and add it to this repo as the **`WINGET_TOKEN`** secret
   (Settings → Secrets and variables → Actions). The default `GITHUB_TOKEN`
   can't fork winget-pkgs, so a PAT is required.
2. Submit the **first** version once (the workflow only *updates* an existing
   package). With [wingetcreate](https://github.com/microsoft/winget-create):

   ```powershell
   wingetcreate new `
     https://github.com/lexandro/mdedit/releases/download/v0.9.0/mdedit_0.9.0_x64_en-US.msi `
     --submit --token <your-PAT>
   ```

   Fill the prompted metadata (PackageIdentifier `lexandro.mdedit`, publisher
   `lexandro`, MIT, homepage `https://github.com/lexandro/mdedit`). The first PR
   goes through Microsoft's review; later releases are submitted automatically.

**After that** every release auto-opens a winget update PR — no manual steps.
Install with `winget install lexandro.mdedit`.

## Publishing to Chocolatey

`.github/workflows/choco.yml` packs the `packaging/chocolatey/` package
(downloading the `.msi` and embedding its SHA256) and `choco push`es it to the
community repo automatically after each Release — and can be run manually
(Actions → Chocolatey → Run workflow) to (re)publish a specific version.

**One-time setup:** create a [community.chocolatey.org](https://community.chocolatey.org)
account, generate an **API Key** (account → API Keys), and add it to this repo as
the **`CHOCO_API_KEY`** secret.

Each pushed version goes through **Chocolatey moderation** (automated checks +
review) before it's publicly visible — that part is on Chocolatey's side. The
push itself is automatic; the current version publishes from the next release (or
push once manually with `choco pack`/`choco push`). Install with
`choco install mdedit`.

> The in-app updater and winget are independent: a winget install that later
> self-updates will drift from the winget-tracked version until the next winget
> release. That's expected and harmless.
