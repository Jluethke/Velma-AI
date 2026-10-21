# Signed Annotated Release Tag

**One-line description:** Creates exactly one annotated, signed release tag on the release commit using GPG, SSH or gitsign (Sigstore keyless), pushes only that tag, verifies the signature locally with `git tag -v` and on GitHub through the API, and handles the case where release-please or semantic-release already created an unsigned tag.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository root.
- `next_version` (object, required): Uses its `tag` field (for example `v1.9.0`).
- `signing_method` (string, required): `gpg`, `ssh` or `gitsign`.
- `rp_changelog` (object, optional): From rel-changelog-release-please, when that tool is in use.
- `sr_changelog` (object, optional): From rel-changelog-semantic-release, when that tool is in use.
- `cliff_changelog` (object, optional): From rel-changelog-git-cliff; its release notes become the tag message.

---

## Outputs

- `release_tag` (object): Tag name, tagged commit SHA, tag object SHA, signer identity, and whether it was created here or by a release tool.
- `tag_verification` (object): Output of `git tag -v`, the GitHub API `verification` object, and the push result.

---

## Phase 1: Decide Who Creates the Tag

### Entry Criteria
- The release commit (changelog and version bump) is on the release branch and pushed: `git status -sb` shows no `ahead`.

### Actions
1. Use this table:

   | Inputs present | Who tags | What this flow does |
   |---|---|---|
   | `rp_changelog` | release-please, through the GitHub API when the release PR merges | Do not create a tag. After the merge, verify the tag exists and points to the merge commit. The API-created tag is lightweight and unsigned; record that and rely on artifact signing and provenance for integrity. |
   | `sr_changelog` | semantic-release (git push of a lightweight tag) | Same as above. |
   | `cliff_changelog` or none | This flow | Continue to Phase 2. |

2. Check the tag does not exist anywhere: `git ls-remote --tags origin <tag>` must print nothing, and `git tag -l <tag>` must print nothing. If it exists, stop: never move or recreate a published tag.

### Output
Tagging owner.

### Quality Gate
- Both existence checks printed nothing (or the tool-created tag is confirmed with `git rev-parse <tag>^{commit}` equal to the release commit).

---

## Phase 2: Configure Signing and Create the Tag

### Entry Criteria
- This flow owns tagging.

### Actions
1. Configure the method (repository-local config, `git config --local`):

   | `signing_method` | Configuration |
   |---|---|
   | gpg | `git config user.signingkey <KEYID>`; the key's email must match a verified email on the GitHub account. |
   | ssh | `git config gpg.format ssh`; `git config user.signingkey ~/.ssh/id_ed25519.pub`; for local verification create an allowed signers file with the line `<email> <public key>` and set `git config gpg.ssh.allowedSignersFile ~/.config/git/allowed_signers`. Upload the key to GitHub as a Signing key, not only an Authentication key. |
   | gitsign | Install gitsign (sigstore/gitsign releases); `git config gpg.x509.program gitsign`; `git config gpg.format x509`. Signing opens a browser OIDC login locally, or uses the CI OIDC token. |

2. Write the tag message: first line `Release <tag>`, blank line, then the release notes from `cliff_changelog` (or `CHANGELOG.md` section). Save to a file outside the repo, for example `/tmp/tagmsg.txt`.
3. Create the tag on the release commit explicitly: `git tag -s <tag> -F /tmp/tagmsg.txt <release commit SHA>`. `-s` makes it annotated and signed. Do NOT use `git tag <tag>` (lightweight) or `-a` without `-s`.
4. Never use `git tag -f`. A tag consumed by a registry, the Go checksum database or a user must never move.

### Output
Local signed tag.

### Quality Gate
- `git cat-file -t <tag>` prints `tag` (annotated), not `commit`.
- `git tag -v <tag>` exits 0 and prints `Good signature` (gpg), `Good "git" signature for <email>` (ssh), or a gitsign verification line naming the identity.

---

## Phase 3: Push and Verify Remotely

### Entry Criteria
- Local verification passed.

### Actions
1. Push only this tag: `git push origin refs/tags/<tag>`. Do NOT use `git push --tags`; it pushes every stray local tag.
2. Read the tag object from GitHub:
   - `TAG_SHA=$(gh api repos/OWNER/REPO/git/ref/tags/<tag> --jq .object.sha)`
   - `gh api repos/OWNER/REPO/git/tags/$TAG_SHA --jq .verification`
3. Read `verified` and `reason`. `true` with reason `valid` means GitHub accepted the signature. gitsign signatures are not shown as verified by GitHub (Sigstore certificate authority is not trusted by GitHub's UI); for gitsign, verify with `gitsign verify-tag` per `gitsign --help`, using the expected `--certificate-identity` and `--certificate-oidc-issuer`.
4. Record everything in `tag_verification`.

### Output
`release_tag`, `tag_verification`.

### Quality Gate
- `git ls-remote --tags origin <tag>` prints two lines: the tag object and the peeled `^{}` commit, and the peeled SHA equals the release commit.
- The GitHub `verification.verified` value is recorded (true for gpg and ssh with an uploaded key).

---

## Worked Example

Illustrative. `next_version.tag` = `v1.9.0`, `signing_method` = `ssh`, git-cliff in use.

- Phase 1: no release tool tags; `git ls-remote --tags origin v1.9.0` prints nothing.
- Phase 2: `git tag -s v1.9.0 -F /tmp/tagmsg.txt 4e1f0c2` then `git tag -v v1.9.0` prints:
  ```
  object 4e1f0c2...
  type commit
  tag v1.9.0
  Good "git" signature for dev@acme.example with ED25519 key SHA256:Qm3...
  ```
- Phase 3: `git push origin refs/tags/v1.9.0`; `gh api repos/acme/parser/git/tags/$TAG_SHA --jq .verification` prints `{"verified":true,"reason":"valid",...}`.

---

## Exit Criteria

DONE when one annotated tag points at the release commit, its signature verifies locally and (for gpg or ssh) on GitHub, and only that tag was pushed; or, when a release tool owns tagging, the tool's tag is confirmed on the right commit and the unsigned state is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tag already exists on the remote | **Stop**: the version is taken; return to rel-semver-bump-decision for the next version. Never delete and recreate it. |
| Phase 2 | `error: gpg failed to sign the data` | **Adjust**: run `echo test \| gpg --clearsign` to see the real error (often `export GPG_TTY=$(tty)` is missing). |
| Phase 2 | `error: No signing key found` with ssh | **Adjust**: `user.signingkey` must point at the `.pub` file or a `key::` literal. |
| Phase 3 | GitHub `reason: unknown_key` | **Adjust**: upload the public key to GitHub as a signing key, then re-read the API (no re-tag needed). |
| Phase 3 | `reason: unverified_email` | **Adjust**: verify the email on GitHub or use a key with the verified email; the existing tag stays. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
