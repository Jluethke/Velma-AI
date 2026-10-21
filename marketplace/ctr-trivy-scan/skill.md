# Scan the Image with Trivy

**One-line description:** Scans a built image with Trivy for OS and language package vulnerabilities, embedded secrets and Dockerfile misconfigurations, using the user's severity threshold with `--severity` and `--exit-code`, writes JSON for triage, and records the vulnerability DB version so results are reproducible.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `image_name` (string, required): Image to scan (`:dev` locally, or a registry reference).
- `project_dir` (string, required): Where reports go (`scan/`) and where the Dockerfile is for the config scan.
- `severity_threshold` (string, required): Comma-separated Trivy severities that fail the gate, chosen by the user or the organization's policy, for example `CRITICAL,HIGH`. Never chosen by the model.

---

## Outputs

- `trivy_report` (object): Paths of `scan/trivy-image.json` and `scan/trivy-config.json`, Trivy version and DB `UpdatedAt`, counts by severity, the list of findings at or above the threshold (ID, package, installed, fixed version, target), and the gate exit code.

---

## Phase 1: Prepare

### Entry Criteria
- `trivy --version` prints a version, or the container form is used: `docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v <project_dir>:/work aquasec/trivy:<version> ...` (pin the tool image by digest).
- `severity_threshold` is provided.

### Actions
1. Record versions: `trivy --version` prints the Trivy version and, after a DB download, `Vulnerability DB: Version, UpdatedAt, NextUpdate`. Copy those lines.
2. Validate the threshold values: allowed severities are `UNKNOWN`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. Any other word: stop and ask.
3. If the image uses `.trivyignore` or `.trivyignore.yaml` already, read it fully and list each ignored ID with its comment or `statement`. Ignores without a reason are findings for `ctr-vuln-triage`.

### Output
Versions and validated threshold.

### Quality Gate
- The DB `UpdatedAt` line is pasted.
- `severity_threshold` contains only allowed values.

---

## Phase 2: Image Scan

### Entry Criteria
- Phase 1 complete.

### Actions
1. Full JSON report (no gating, all severities), used for triage:
```
mkdir -p <project_dir>/scan
trivy image --scanners vuln,secret --format json --output <project_dir>/scan/trivy-image.json <image_name>:dev
```
2. Gate run with the user's threshold:
```
trivy image --scanners vuln --severity <severity_threshold> --exit-code 1 <image_name>:dev
echo "exit=$?"
```
   `--exit-code 1` makes Trivy exit 1 when any finding at the listed severities exists. Add `--ignore-unfixed` ONLY if the user's policy says unfixed findings do not block; record that choice.
3. Read the table output: each target line (for example `orders-api:dev (debian 12.7)` or `opt/venv/lib/python3.12/site-packages/...`) has `Total: N (HIGH: x, CRITICAL: y)`. Columns: `Library`, `Vulnerability`, `Severity`, `Status` (`fixed`, `affected`, `will_not_fix`), `Installed Version`, `Fixed Version`, `Title`.
4. Extract the findings at or above threshold from the JSON:
```
jq -r '.Results[] | .Target as $t | (.Vulnerabilities // [])[] | select(.Severity=="CRITICAL" or .Severity=="HIGH") | [$t, .VulnerabilityID, .PkgName, .InstalledVersion, (.FixedVersion // "none"), .Severity] | @tsv' scan/trivy-image.json
```
   Edit the `select` to match `severity_threshold` exactly.
5. Secrets: `jq '[.Results[] | (.Secrets // [])[]] | length' scan/trivy-image.json` must be 0. Any secret finding goes straight to `ctr-build-args-secrets`.
6. Do NOT edit `.trivyignore` in this flow. Suppression decisions belong to `ctr-vuln-triage`.

### Output
`scan/trivy-image.json` and the threshold finding list.

### Quality Gate
- The gate run's `exit=` value is pasted (0 or 1).
- The threshold finding list is produced by the `jq` command, not typed by hand.

---

## Phase 3: Dockerfile Misconfiguration Scan

### Entry Criteria
- Image scan done.

### Actions
1. `trivy config --format json --output <project_dir>/scan/trivy-config.json <project_dir>` scans the Dockerfile (and Compose or Kubernetes files if present).
2. List failures: `jq -r '.Results[] | (.Misconfigurations // [])[] | select(.Status=="FAIL") | [.ID, .Severity, .Title] | @tsv' scan/trivy-config.json`. Typical IDs: `DS002` (image user should not be root), `DS026` (no HEALTHCHECK), `DS001` (`:latest` tag used). Look up each ID in Trivy's misconfiguration docs before acting.
3. Cross-check against earlier flows: a `DS002` failure contradicts `ctr-nonroot-user`; send it back there rather than suppressing.

### Output
`trivy_report`.

### Quality Gate
- `scan/trivy-config.json` exists and the FAIL list is pasted (or "none").

---

## Worked Example

Illustrative. `orders-api:dev`, `severity_threshold=CRITICAL,HIGH`.

Phase 1: `Version: 0.56.2`, `Vulnerability DB: UpdatedAt: 2026-10-20 06:12:33`.

Phase 2: table shows `orders-api:dev (debian 12.7) Total: 2 (HIGH: 2, CRITICAL: 0)` and `Python (python-pkg) Total: 1 (HIGH: 1, CRITICAL: 0)`. Gate prints `exit=1`. `jq` list:
```
orders-api:dev (debian 12.7)  CVE-2026-XXXX1  libexpat1  2.5.0-1  2.5.0-1+deb12u2  HIGH
Python (python-pkg)           CVE-2026-XXXX2  jinja2     3.1.3    3.1.5            HIGH
```
Secrets count `0`.

Phase 3: `trivy config` FAIL list: `none` (USER and HEALTHCHECK already set).

---

## Exit Criteria

DONE when JSON reports for image and config scans exist, the gate run's exit code is recorded against the user's threshold, and every threshold finding is listed for triage.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | DB download fails (rate limit or offline) | **Retry**: rerun later, or use the user's DB mirror with `--db-repository`; never scan with a missing DB. |
| Phase 2 | `unable to find the specified image` | **Adjust**: pass `--input` with a `docker save` tarball, or use `--image-src docker`. |
| Phase 2 | Gate exits 1 | **Return**: send the finding list to `ctr-vuln-triage`; do not add ignores here. |
| Phase 3 | Config FAIL that contradicts an earlier flow | **Return**: to that flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
