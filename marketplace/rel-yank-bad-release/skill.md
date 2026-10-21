# Withdraw a Bad Release

**One-line description:** Withdraws a broken or vulnerable published version with the mechanism each registry actually provides (PyPI yank per PEP 592, `npm deprecate` and dist-tag repoint, Go `retract` directive, `cargo yank`, container tag repoint, GitHub release edit), never reusing or overwriting the version, and records exactly what consumers will now see.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `package_name` (string, required): Package, module path, crate or image repository.
- `bad_version` (string, optional): The version to withdraw. If empty, take it from the first install report with `status` = `FAIL`.
- `registry` (string, required): `pypi`, `npm`, `go`, `crates`, or `container`.
- `py_install_report` (object, optional): From rel-py-verify-install.
- `node_install_report` (object, optional): From rel-node-verify-install.
- `go_install_report` (object, optional): From rel-go-verify-install.
- `rust_install_report` (object, optional): From rel-rust-verify-install.

---

## Outputs

- `withdrawal_actions` (object): `bad_version`, `reason`, `severity` (`security` or `functional`), each command or UI action taken, the consumer-visible result checked afterwards, and the version consumers should move to.

---

## Phase 1: Decide Whether to Withdraw

### Entry Criteria
- `bad_version` is given, or at least one install report has `status` = `FAIL`.

### Actions
1. Write the reason in one sentence with the failing command from the report (for example "`import acme` raises ModuleNotFoundError: yaml").
2. Classify with this table:

   | Situation | Withdraw? |
   |---|---|
   | Install or import fails for all users | yes |
   | Security vulnerability introduced in this version | yes, and follow the project's security disclosure process |
   | Broken only for an optional feature or one platform | ask the user; default is to ship a patch without withdrawing |
   | Wrong dist-tag only (npm pre-release on `latest`) | no withdrawal; fix the tag only |

3. If withdrawing, the replacement is a new patch version from rel-hotfix-from-tag. A version number is never reused on any of these registries.

### Output
Decision with reason and severity.

### Quality Gate
- The reason quotes a command and its output from an install report or user evidence.
- The table row used is recorded.

---

## Phase 2: Withdraw with the Registry Mechanism

### Entry Criteria
- Decision is "withdraw".

### Actions
1. Use only the row for `registry`:

   | `registry` | Action | Effect for consumers |
   |---|---|---|
   | pypi | Project, Manage, Releases, Options, Yank, with a reason (PyPI web UI) | pip skips the version unless pinned with `==` (PEP 592); pinned users see the yank reason as a warning |
   | npm | `npm deprecate <pkg>@<version> "<reason>; use <fixed version>"`; if it was `latest`, `npm dist-tag add <pkg>@<previous good> latest` | installs still work but print the deprecation message. `npm unpublish <pkg>@<version>` is only allowed under npm's unpublish policy (time window and no dependents); prefer deprecate |
   | go | Add `retract <version> // <reason>` to `go.mod` and release a NEW version containing it (the retraction is read from the latest version's `go.mod`) | `go get` skips the retracted version for `@latest`; `go list -m -u` shows it as retracted |
   | crates | `cargo yank --version <version> <crate>` (newer Cargo also accepts `cargo yank <crate>@<version>`; check `cargo yank --help`) | new lockfiles will not select it; existing lockfiles keep working |
   | container | `docker buildx imagetools create -t <repo>:<moving tag> <repo>@<previous good digest>` for moving tags like `latest` or `1.9`; leave the version tag and digest in place | pullers of moving tags get the good image; digest pins still resolve |

2. Also mark the GitHub release: `gh release edit <tag> --prerelease --notes "<reason>. Use <fixed version>."` so it is not shown as the latest release.
3. Never delete the git tag, never force-push it, and never delete a container digest that others may pin.

### Output
Actions taken.

### Quality Gate
- Each action's command output (or UI confirmation text) is recorded.
- No command in the record deletes a tag or reuses the version.

---

## Phase 3: Confirm Consumer-Visible State

### Entry Criteria
- Actions taken.

### Actions
1. Check with the consumer's tool:
   - pypi: `curl -s https://pypi.org/pypi/<pkg>/<version>/json | jq '.urls[0].yanked, .urls[0].yanked_reason'` prints `true` and the reason.
   - npm: `npm view <pkg>@<version> deprecated` prints the message; `npm view <pkg> dist-tags` shows `latest` on a good version.
   - go (after the retracting version is published): `go list -m -retracted -versions <module>` lists the version; `go list -m -u <module>@<version>` shows `(retracted)`.
   - crates: `curl -s -A "<contact>" https://crates.io/api/v1/crates/<crate>/<version> | jq .version.yanked` prints `true`.
   - container: `docker buildx imagetools inspect <repo>:<moving tag>` shows the good digest.
2. Record the result and the recommended replacement version in `withdrawal_actions`.

### Output
`withdrawal_actions`.

### Quality Gate
- The registry check command for `registry` shows the withdrawn state.
- `withdrawal_actions` names the replacement version (or "pending hotfix").

---

## Worked Example

Illustrative. `registry` = `pypi`, `package_name` = `acme-parser`, `py_install_report.status` = `FAIL` (`ModuleNotFoundError: No module named 'yaml'`), `bad_version` taken from it: `1.9.0`.

- Phase 1: row "Install or import fails for all users": withdraw. Severity `functional`.
- Phase 2: PyPI UI yank with reason "missing PyYAML dependency; use 1.9.1". `gh release edit v1.9.0 --prerelease --notes "Missing dependency. Use 1.9.1."`.
- Phase 3: `curl -s https://pypi.org/pypi/acme-parser/1.9.0/json | jq '.urls[0].yanked, .urls[0].yanked_reason'` prints `true` and `"missing PyYAML dependency; use 1.9.1"`. Replacement: "pending hotfix 1.9.1".

---

## Exit Criteria

DONE when a withdraw decision is recorded with evidence, the registry-correct action was taken (or deliberately not taken), the consumer-visible state is confirmed by a registry query, and the replacement version is named.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No failing report and no user evidence | **Stop**: do not withdraw on suspicion. |
| Phase 2 | `npm unpublish` refused by policy | **Adjust**: use `npm deprecate`; that is the intended path. |
| Phase 2 | Go retract added but not visible | **Adjust**: the retraction must ship in a newer version than the retracted one; publish it through rel-go-publish-module-proxy. |
| Phase 2 | User asks to delete and re-upload the same version | **Stop**: no registry here allows reuse; explain and proceed with a new version. |
| Phase 3 | Registry still shows the version as current | **Retry**: caches can lag; re-query, then **Return** with the raw response. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
