# OWASP ZAP Baseline and API Scan of the Running App

**One-line description:** Runs the OWASP ZAP packaged scans in Docker against a non-production instance (`zap-baseline.py` passive scan, and `zap-api-scan.py` against the OpenAPI document when one exists), reads the report by alert and rule ID, tunes the rules file with written reasons instead of silencing alerts, and records the exit code for CI.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_base_url` (string, required): URL of a non-production instance you are authorized to scan.
- `repo_path` (string, required): Repository root, where the ZAP rules file and reports are stored.
- `openapi_url` (string, optional): URL or path of the OpenAPI or Swagger document. If present, Phase 2 runs the API scan.

---

## Outputs

- `zap_findings` (object): `baseline_exit_code`, `api_exit_code` (or `not_run`), `alerts` (rule ID, name, risk, URL count, decision), `rules_file` (`.zap/rules.tsv`), `report_paths`.

---

## Phase 1: Passive Baseline Scan

### Entry Criteria
- Written authorization to scan `app_base_url` exists (your own staging counts; third-party hosts do not).
- `docker --version` prints a version; `curl -s -o /dev/null -w "%{http_code}" <app_base_url>` returns a status.

### Actions
1. Generate a starting rules file and report:

```bash
mkdir -p .zap
docker run --rm -v "$(pwd)/.zap:/zap/wrk:rw" -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t <app_base_url> -g gen.conf -r baseline.html -J baseline.json
echo "exit=$?"
```
   The baseline scan spiders the site and reports passive findings only; it does not send attack payloads.
2. Read the exit code (documented in the ZAP packaged scan docs): `0` no WARN or FAIL alerts, `1` at least one FAIL, `2` at least one WARN and no FAIL, `3` any other failure (for example the target was unreachable). Exit code 3 means the scan result is not valid; fix the cause before reading alerts.
3. Open `.zap/baseline.json` and list each alert's `pluginid`, `alert` name, `riskdesc`, and number of `instances`.

### Output
Baseline report and exit code.

### Quality Gate
- `baseline_exit_code` is 0, 1 or 2 (not 3).
- Every alert in `baseline.json` is listed with plugin ID and instance count.

---

## Phase 2: API Scan (When an OpenAPI Document Exists)

### Entry Criteria
- `openapi_url` provided; Phase 1 exit code was not 3.

### Actions
1. Run the API scan. It runs active rules against the API, so use the non-production instance only:

```bash
docker run --rm -v "$(pwd)/.zap:/zap/wrk:rw" -t ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py -t <openapi_url> -f openapi -r api.html -J api.json
echo "exit=$?"
```
2. If the API needs a token, pass it through ZAP's replacer options as described in the ZAP docs for authenticated packaged scans (`-z` with `replacer.full_list...` options); check the docs for the current syntax rather than guessing it. Use a test account token, never a production credential.
3. For every alert that maps to an input class (SQL injection, XSS, path traversal, command injection, SSRF, XXE, CRLF), note the endpoint and parameter, and check it against `ival-negative-test-suite`: if no negative test covers that endpoint and parameter, record a gap.

### Output
API report and gap list.

### Quality Gate
- `api_exit_code` is 0, 1 or 2, or `not_run` with the reason.
- Every injection-class alert has a gap decision (covered by test X, or gap).

---

## Phase 3: Triage and Tune With Reasons

### Entry Criteria
- Reports exist.

### Actions
1. Decide per alert:

| Alert | Decision |
|---|---|
| Real issue (for example CSP header missing, `X-Content-Type-Options` missing, injection confirmed) | `fix`: open a task; rerun the class flow |
| False positive confirmed by reading the response | `IGNORE` in rules file, with the reason in the third column |
| Real but accepted by the owner | `WARN` with the owner's name and date in the reason |
| Must block CI | `FAIL` |

2. Edit `.zap/gen.conf` into `.zap/rules.tsv` (tab-separated: rule ID, action, reason). Pass it with `-c rules.tsv` on later runs.
3. Do NOT set every rule to `IGNORE` to get exit code 0. Every `IGNORE` line needs a reason referencing what you checked.
4. Rerun the baseline with `-c rules.tsv` and record the new exit code. Put this command in CI; mark the job required only after the exit code is 0 or the remaining WARNs are owner-accepted.

### Output
`zap_findings`.

### Quality Gate
- Every line in `.zap/rules.tsv` with `IGNORE` has a non-empty reason column (`awk -F'\t' '$2=="IGNORE" && $3==""' .zap/rules.tsv` prints nothing).
- Rerun exit code recorded.

---

## Worked Example

Illustrative. `app_base_url` = `https://staging.shop.test`, `openapi_url` = `https://staging.shop.test/openapi.json`.

Phase 1: exit 2. Alerts: `10038 Content Security Policy (CSP) Header Not Set` (14 instances), `10021 X-Content-Type-Options Header Missing` (3), `10096 Timestamp Disclosure` (2).

Phase 2: exit 0 for injection rules; one `40003 CRLF Injection` informational alert on `/download?name=` already covered by `test_header.py::test_crlf_rejected`.

Phase 3: 10038 = fix (run `ival-csp-header-rollout`); 10021 = fix; 10096 = IGNORE ("values are order IDs, not timestamps; checked 2 responses"). Rerun after fixes: exit 0.

---

## Exit Criteria

DONE when baseline (and API scan when a spec exists) ran against an authorized non-production target with valid exit codes, every alert has a fix, IGNORE-with-reason, or owner-accepted WARN decision, injection alerts are mapped to negative tests or gaps, and the tuned command is ready for CI.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Exit code 3 | **Retry** after fixing reachability (Docker networking: on Linux use `--network host` or the host IP instead of `localhost`). |
| Phase 1 | No authorization for the target | **Stop**: do not scan. |
| Phase 2 | Spec uses relative server URLs and ZAP targets the wrong host | **Adjust**: pass the full spec URL from the target host, or check the API scan options for overriding the host in the ZAP docs. |
| Phase 3 | Pressure to ignore alerts to pass CI | **Return**: list unresolved alerts with risk to the owner; do not ignore without a reason. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
