# Container Image Release Gate

**One-line description:** Re-checks every earlier containerization result against the exact image digest about to ship (tests, hardened smoke run, secrets and build-arg checks, SBOM, vulnerability triage, size limits, reproducibility), reruns the cheap checks rather than trusting old reports, and returns a single PASS or FAIL verdict with each failing item and the flow that owns it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `image_name` (string, required): The candidate image.
- `image_test_report` (object, required): From `ctr-test-in-image`.
- `smoke_report` (object, required): From `ctr-hardened-run-smoke`.
- `size_report` (object, required): From `ctr-image-size-measure`.
- `sbom_file` (object, required): From `ctr-syft-sbom`.
- `vuln_triage` (object, required): From `ctr-vuln-triage`.
- `repro_report` (object, required): From `ctr-reproducible-build`.
- `build_config_report` (object, required): From `ctr-build-args-secrets`.

---

## Outputs

- `release_verdict` (object): `verdict` (`PASS` or `FAIL`), the image ID and digest checked, one row per check (status, evidence command and output, owning flow), and the list of failing checks.

---

## Phase 1: Pin the Candidate

### Entry Criteria
- All input reports exist.

### Actions
1. Record the image identity: `docker image inspect -f '{{.Id}}' <image_name>:dev`. If it has been pushed, also `docker buildx imagetools inspect <registry>/<image_name>:<tag>` and copy `Digest:`.
2. For each input report, compare the image ID or digest it recorded with step 1. Any report produced for a different image is stale. Mark it `STALE` and rerun its owning flow; do not reuse its result.
3. Do NOT rebuild the image during this flow. A rebuild produces a new ID and invalidates every report.

### Output
Candidate ID and the stale list.

### Quality Gate
- The image ID from step 1 is pasted, and every report is marked current or `STALE`.

---

## Phase 2: Rerun Cheap Checks

### Entry Criteria
- No `STALE` reports remain.

### Actions
1. Rerun these on the candidate, because each takes seconds and old output can lie:
   - User: `docker image inspect -f '{{.Config.User}}' <image_name>:dev` is a non-zero numeric UID.
   - Exec-form entrypoint: `docker image inspect -f '{{json .Config.Entrypoint}} {{json .Config.Cmd}}' <image_name>:dev` shows JSON arrays without `/bin/sh -c` wrapping the app.
   - Healthcheck present (unless `smoke_report` records why not): `docker image inspect -f '{{json .Config.Healthcheck}}' <image_name>:dev`.
   - Base digests: `grep -nE '^FROM' Dockerfile` shows `@sha256:` on every line that names an external image (lines that name an earlier stage, such as `FROM build AS test`, are exempt).
   - No secrets in config: `docker image inspect -f '{{json .Config.Env}}' <image_name>:dev` contains none of the variables marked `secret` in `build_config_report`.
   - SBOM matches the image: the image ID recorded in `sbom_file` equals step 1's ID, and `jq -r '.name' sbom/sbom.spdx.json` names the same image. If the ID differs, regenerate the SBOM with `ctr-syft-sbom`.
2. Write each result as a row: `check`, `status`, `evidence`, `owner flow`.

### Output
Rerun check rows.

### Quality Gate
- Each row has a pasted command output as evidence.

---

## Phase 3: Combine and Decide

### Entry Criteria
- Phase 2 rows complete.

### Actions
1. Add rows from the reports, using these rules exactly:

| Check | PASS when | Owner on FAIL |
|---|---|---|
| Tests | `image_test_report` shows zero failures and the test count matches a normal run | `ctr-test-in-image` |
| Smoke | `smoke_report` exit code row is a pass row and the real request returned its documented status | `ctr-hardened-run-smoke` |
| Vulnerabilities | `vuln_triage` rescan exit codes are 0, or the only remaining findings are suppressions with unexpired dates; ANY `blocked` row is FAIL | `ctr-vuln-triage` |
| Secrets | `build_config_report` leak checks all empty | `ctr-build-args-secrets` |
| SBOM | `sbom_file` has both files and all expected ecosystems | `ctr-syft-sbom` |
| Size | `size_report` gate passed, or is "report only" | `ctr-image-size-measure` |
| Reproducible | `repro_report` digests match, or the user has accepted the listed differences in writing | `ctr-reproducible-build` |

2. Check suppression expiries: any `expired_at` earlier than today's date is FAIL.
3. `verdict = PASS` only if every row is PASS. There is no partial pass and no "PASS with warnings" for a FAIL row.
4. Do NOT change any input report, threshold or suppression to reach PASS. Report the FAIL with its owner flow.

### Output
`release_verdict`.

### Quality Gate
- The verdict equals the logical AND of all row statuses.
- Every FAIL row names its owning flow.

---

## Worked Example

Illustrative. `orders-api:dev`, image ID `sha256:7d1c...`.

Phase 1: all reports recorded `sha256:7d1c...`; none stale.

Phase 2: user `10001:10001`; `Cmd` `["uvicorn","orders.main:app","--host","0.0.0.0","--port","8000"]`; healthcheck present; every `FROM` pinned; env has no secret names; SBOM image ID matches.

Phase 3: tests 214 passed; smoke exit 0 in 0.4 s; vuln rescans exit 0; secrets clean; SBOM complete; size "report only"; reproducible digests match. `verdict: PASS`.

---

## Exit Criteria

DONE when every check has a status backed by evidence for the exact candidate image, and the verdict is PASS only when all checks pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A report was produced for another image ID | **Return**: rerun the owning flow on the candidate. |
| Phase 2 | A rerun check contradicts its report | **Stop**: trust the rerun; mark FAIL and return to the owner. |
| Phase 3 | User asks to ship despite FAIL | **Stop**: report the FAIL rows; the decision and its record belong to the user, the verdict stays FAIL. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
