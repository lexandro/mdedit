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

`.github/workflows/winget.yml` submits a manifest PR to
[microsoft/winget-pkgs](https://github.com/microsoft/winget-pkgs) after every
release (it uses the `.msi` asset, so winget gets a ProductCode for clean
upgrade detection), and can be run manually (Actions → **winget** → Run
workflow) to (re)publish a specific version. No code-signing certificate is
required.

**One-time setup**

1. Create a **classic** GitHub Personal Access Token with the `public_repo`
   scope and **no expiration**, then add it to this repo as the
   **`WINGET_TOKEN`** secret (`gh secret set WINGET_TOKEN`, or Settings →
   Secrets and variables → Actions). The default `GITHUB_TOKEN` can't fork
   winget-pkgs, so a PAT is required.
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

> **`lexandro does not have the correct permissions to execute CreateRef`** means
> the **`WINGET_TOKEN` PAT expired** — it is *not* a missing scope, despite the
> wording. It silently ate v0.11.0 and v0.11.1 (submitted late, by hand). Issue a
> replacement classic PAT with `public_repo` and **no expiration**, `gh secret set
> WINGET_TOKEN`, then Actions → **winget** → Run workflow for each missed version.

The action that opens the PR (`vedantmgoyal9/winget-releaser`) is third-party
code that receives this PAT, so it is pinned to a commit SHA rather than the
mutable `v2` tag. Bump the pin deliberately, not automatically.

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

> **`choco push` → 403 Forbidden** while the package has a version *in
> moderation and no approved version yet* — that's the community repo's rule,
> not a bad API key. It bit v0.10.0 (pushed while v0.9.0 was still pending, so
> Chocolatey stayed a version behind winget). Once one version is approved, run
> Actions → **Chocolatey** → Run workflow with the missed version to catch up.

Both publish workflows (winget and Chocolatey) run *after* Release completes and
**open a GitHub issue if the automatic run fails**, so a missed version reaches
your inbox instead of sitting unnoticed on the Actions tab. The issue names the
version and links the run; fix the cause and re-run that workflow manually with
the version. Manual re-runs deliberately do *not* file issues — you are watching
that run anyway.
They are separate workflows on purpose: while winget was a job inside `release.yml`
its failure marked the whole Release run failed, which skipped Chocolatey too.

The package is **download-only** (it fetches the signed MSI from the GitHub
release), so `tools/` must **not** contain `LICENSE.txt` / `VERIFICATION.txt` —
those are for packages that embed the payload, and a moderator asks for their
removal otherwise.

> The in-app updater and winget are independent: a winget install that later
> self-updates will drift from the winget-tracked version until the next winget
> release. That's expected and harmless.
