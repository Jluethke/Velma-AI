# Scan the SBOM with Grype

**One-line description:** Scans the Syft SBOM (and, for comparison, the image itself) with Grype using `--fail-on` set from the user's threshold, writes JSON, extracts matches with fix versions, and lists where Grype and Trivy disagree so triage sees both databases' view.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sbom_file` (object, required): From `ctr-syft-sbom`; supplies `sbom/sbom.spdx.json`.
- `image_name` (string, required): The same image the SBOM describes.
- `severity_threshold` (string, required): The user's threshold in Trivy form (for example `CRITICAL,HIGH`); converted to Grype's single lowest level.

---

## Outputs

- `grype_report` (object): Path of `scan/grype-sbom.json`, Grype version and DB build date, counts by severity, matches at or above threshold (ID, package, version, fix versions, fix state), the gate exit code, and the SBOM-versus-image match count difference.

---

## Phase 1: Prepare

### Entry Criteria
- `grype version` works, or the container form is used: `docker run --rm -v <dir>:/work anchore/grype:<version> ...` (pin the tool image).
- `sbom_file` paths exist.

### Actions
1. Update and record the DB: `grype db update`, then `grype db status`. Copy the `Built:` (or equivalent build timestamp) and `Schema:` lines. Output field names vary by version; copy what is printed.
2. Convert the threshold. Grype's `--fail-on` takes ONE severity and fails on that level and above. Allowed values: `negligible`, `low`, `medium`, `high`, `critical`. Use the lowest severity in `severity_threshold`: `CRITICAL,HIGH` becomes `high`; `CRITICAL` becomes `critical`.
3. If `.grype.yaml` exists, read its `ignore:` rules and list each with its reason. Rules without a reason go to `ctr-vuln-triage`.

### Output
DB status and the `--fail-on` value.

### Quality Gate
- The `grype db status` output is pasted.
- The `--fail-on` value is the lowest level in `severity_threshold`, lowercase.

---

## Phase 2: Scan the SBOM and the Image

### Entry Criteria
- Phase 1 complete.

### Actions
1. Scan the SBOM (fast, no image pull, scans exactly what was cataloged):
```
grype sbom:<project_dir>/sbom/sbom.spdx.json -o json --file <project_dir>/scan/grype-sbom.json
grype sbom:<project_dir>/sbom/sbom.spdx.json --fail-on <level>
echo "exit=$?"
```
2. Scan the image directly once, to confirm the SBOM path did not lose packages: `grype <image_name>:dev -o json --file <project_dir>/scan/grype-image.json`.
3. Compare match counts: `jq '.matches | length' scan/grype-sbom.json` and the same on `grype-image.json`. A difference means the SBOM missed packages; return to `ctr-syft-sbom` Phase 2.
4. Extract threshold findings:
```
jq -r '.matches[] | select(.vulnerability.severity=="Critical" or .vulnerability.severity=="High") | [.vulnerability.id, .artifact.name, .artifact.version, (.vulnerability.fix.versions | join(",")), .vulnerability.fix.state, .vulnerability.severity] | @tsv' scan/grype-sbom.json
```
   Grype severity strings are capitalized (`Critical`, `High`). Edit the `select` to match the threshold.
5. Add `--only-fixed` to the gate run ONLY if the user's policy says unfixed findings do not block (the same choice as Trivy's `--ignore-unfixed`). Keep both scanners consistent.

### Output
`scan/grype-sbom.json` and the threshold list.

### Quality Gate
- The gate run's `exit=` value is pasted.
- SBOM and image match counts are both pasted.

---

## Phase 3: Compare With Trivy

### Entry Criteria
- `scan/trivy-image.json` exists from `ctr-trivy-scan` (if not, record "no Trivy comparison" and finish).

### Actions
1. List IDs from each tool:
```
jq -r '.matches[].vulnerability.id' scan/grype-sbom.json | sort -u > /tmp/grype-ids.txt
jq -r '.Results[] | (.Vulnerabilities // [])[] | .VulnerabilityID' scan/trivy-image.json | sort -u > /tmp/trivy-ids.txt
comm -3 /tmp/grype-ids.txt /tmp/trivy-ids.txt
```
2. Grype often reports GitHub advisory IDs (`GHSA-...`) where Trivy reports the CVE for the same issue. Before calling an ID "only in Grype", check `.relatedVulnerabilities[].id` in the Grype match for the CVE.
3. Record each true disagreement. A finding missing from one tool is NOT evidence of a false positive; the databases and matching rules differ (for example, distro-specific fix data). Triage decides.

### Output
`grype_report` with the disagreement list.

### Quality Gate
- The `comm -3` output is pasted, with GHSA-to-CVE mappings resolved per step 2.

---

## Worked Example

Illustrative. Same `orders-api:dev` as the Trivy example; threshold `CRITICAL,HIGH`, so `--fail-on high`.

Phase 1: `grype db status` shows a build date of the same day.

Phase 2: SBOM scan `exit=1`; matches `41` in SBOM scan and `41` in image scan. Threshold list:
```
GHSA-xxxx-yyyy-zzzz  jinja2     3.1.3    3.1.5            fixed  High
CVE-2026-XXXX1       libexpat1  2.5.0-1  2.5.0-1+deb12u2  fixed  High
```

Phase 3: `comm -3` shows `GHSA-xxxx-yyyy-zzzz` only in Grype; its `relatedVulnerabilities` contains `CVE-2026-XXXX2`, which Trivy reported. No true disagreement.

---

## Exit Criteria

DONE when the SBOM scan JSON exists, the gate exit code is recorded with the converted threshold, the SBOM and image scans agree on match count, and disagreements with Trivy are listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | DB update fails | **Retry**: rerun with network access; never scan with a stale DB without recording its date. |
| Phase 2 | SBOM and image counts differ | **Return**: to `ctr-syft-sbom` with both counts. |
| Phase 2 | `failed to catalog: unable to determine image source` | **Adjust**: use `docker:<image_name>:dev` or a `docker save` archive with `docker-archive:`. |
| Phase 3 | Many disagreements | **Return**: pass them all to `ctr-vuln-triage`; do not pick a "winning" scanner. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
