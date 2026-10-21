# Triage Image Vulnerability Findings

**One-line description:** Sorts every threshold finding from Trivy and Grype by where the vulnerable package came from (base image, OS package added in the Dockerfile, or application dependency), applies the matching fix (re-pin the base digest, upgrade the package, bump the lockfile), and records any remaining finding with an expiring, reasoned suppression in `.trivyignore.yaml` and `.grype.yaml` or an OpenVEX statement.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `trivy_report` (object, required): From `ctr-trivy-scan`.
- `grype_report` (object, required): From `ctr-grype-scan`.
- `pinned_bases` (object, required): From `ctr-pin-base-digest`.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `vuln_triage` (object): One row per finding: ID(s), package, origin, decision (`fixed`, `suppressed`, `blocked`), the change made (file and line) or the suppression entry with reason and expiry, and the rescan exit codes after changes.

---

## Phase 1: Classify Origin

### Entry Criteria
- Both reports exist; the threshold lists are non-empty (if both gates exited 0, record "no findings at threshold" and finish).

### Actions
1. Merge both threshold lists into one table keyed by CVE (map GHSA to CVE using Grype's `relatedVulnerabilities`).
2. Find the origin of each package:

| Evidence | Origin |
|---|---|
| Trivy target is the OS line (for example `(debian 12.7)`) AND the package is in the base: `docker run --rm --entrypoint dpkg-query <runtime_ref> -W <pkg>` prints it (or `apk info -e <pkg>` on Alpine) | `base` |
| OS target, but the package is absent from the base image and the Dockerfile installs it (or pulls it as a dependency) | `dockerfile-os` |
| Language target (`Python`, `Node.js`, `gobinary`, `jar`) and the package is in the project lockfile: `grep -n "<pkg>" <lockfile>` | `app-direct` or `app-transitive` (check the manifest file to tell which) |
| Go `stdlib` | `toolchain` (fixed by a newer Go version in the builder) |
| Java runtime packages (in a JRE image) | `base` |

3. Do NOT classify by guessing from the package name. Each origin cites the command output above.

### Output
Classified finding table.

### Quality Gate
- Every row has an origin with the command or file line that proves it.

---

## Phase 2: Apply Fixes One at a Time

### Entry Criteria
- Classified table.

### Actions
1. Work one finding (or one shared fix) at a time. Rebuild and rescan after each change. Never batch unrelated upgrades.
2. By origin:

| Origin | Fix |
|---|---|
| `base`, `FixedVersion` present | Re-resolve the same tag's digest (`ctr-pin-base-digest` Phase 1). If the new digest's package version is fixed, update the pin. If the upstream image has not rebuilt yet, `apt-get install --only-upgrade <pkg>` in the runtime stage is allowed on images with apt, recorded as temporary. |
| `base`, no fix | Check whether another supported base (distroless instead of slim, newer Debian release) lacks the package; propose it, do not switch silently. Otherwise suppress (step 3). |
| `dockerfile-os` | Remove the package if not needed (check usage with `grep`), or upgrade it. |
| `app-direct` | Bump to the fixed version in the manifest, regenerate the lockfile with the project's tool (`uv lock --upgrade-package <pkg>`, `npm install <pkg>@<ver>`, `go get <mod>@<ver> && go mod tidy`, Maven/Gradle version property), run the test suite. |
| `app-transitive` | Upgrade the parent that pulls it in; if impossible, use the tool's override mechanism (`overrides` in package.json for npm, `[tool.uv] override-dependencies`, Maven `dependencyManagement`, Gradle constraints). |
| `toolchain` | Bump the builder Go version to one listed as fixed in the Go security announcement, re-pin. |

3. Suppression is the last option and needs: reason, who decided, and an expiry date the user gives. Trivy (`.trivyignore.yaml`):
```
vulnerabilities:
  - id: CVE-2026-XXXX
    paths: []
    statement: "Not reachable: <reason>. Decided by <name>."
    expired_at: <YYYY-MM-DD from user>
```
   Grype (`.grype.yaml`):
```
ignore:
  - vulnerability: CVE-2026-XXXX
    reason: "<same reason>"
```
   Check the config keys against each tool's documentation for the installed version. For a statement consumers can read, write an OpenVEX document with `vexctl create` (status `not_affected` and a justification), if the user publishes VEX.
4. Do NOT suppress to make a gate pass when a fix exists. Do NOT downgrade `severity_threshold`.

### Output
Changes per finding.

### Quality Gate
- Each `fixed` row cites the file and line changed and the test suite result after the change.
- Each `suppressed` row has reason, decider and an expiry supplied by the user.

---

## Phase 3: Rescan and Close

### Entry Criteria
- All rows decided.

### Actions
1. Rebuild the image, regenerate the SBOM, and rerun both gate commands from `ctr-trivy-scan` Phase 2 step 2 and `ctr-grype-scan` Phase 2 step 1.
2. Paste both `exit=` values. Both must be 0, or the remaining findings must be exactly the `blocked` rows.
3. A `blocked` row is a finding with no fix and no approved suppression. List them for the user; the release gate will fail on them.

### Output
`vuln_triage`.

### Quality Gate
- Rescan exit codes are pasted.
- The remaining finding list equals the `blocked` rows.

---

## Worked Example

Illustrative. Findings: `CVE-2026-XXXX1` in `libexpat1` (OS), `CVE-2026-XXXX2` in `jinja2`.

Phase 1: `dpkg-query -W libexpat1` in the base prints `libexpat1 2.5.0-1` so origin `base`. `grep -n jinja2 uv.lock` matches; `pyproject.toml` does not list it, so `app-transitive` via `flask`.

Phase 2: re-resolved `python:3.12-slim-bookworm` digest; new image has `libexpat1 2.5.0-1+deb12u2`; pin updated in Dockerfile line 3. `uv lock --upgrade-package jinja2` moves it to 3.1.5; `uv run pytest -q` prints `214 passed`.

Phase 3: Trivy gate `exit=0`, Grype gate `exit=0`. No blocked rows.

---

## Exit Criteria

DONE when every threshold finding is fixed, suppressed with a reason and expiry, or listed as blocked, and rescans confirm the remaining set.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Package origin unclear | **Adjust**: inspect `docker history --no-trunc` for the `RUN` that installed it; cite it. |
| Phase 2 | Upgrade breaks tests | **Stop**: revert that one change, record the finding as blocked with the failing test names. |
| Phase 2 | User gives no expiry for a suppression | **Return**: leave it as blocked; suppressions without expiry are not allowed. |
| Phase 3 | New findings appear after rebuild | **Retry**: run Phase 1 on the new findings; base image updates can add them. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
