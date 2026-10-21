# Domain Availability Checker

**One-line description:** For each candidate × TLD combination: runs DNS lookup, HTTP HEAD, and optional WHOIS to produce a buy-readiness score per domain.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** No  --  single-party technical check.

---

## Inputs

- `candidate_names` (array, required): Name candidates from `naming-candidate-generator`.
- `tlds` (array, required): TLDs to test per candidate (e.g., [".com", ".ai", ".io", ".co", ".systems"]).
- `http_timeout_s` (number, optional, default 3.0): HTTP HEAD timeout in seconds.
- `whois_enabled` (boolean, optional, default true): Whether to run WHOIS queries.
- `max_whois_per_run` (integer, optional, default 40): Cap on WHOIS calls to avoid rate-limiting.

## Outputs

- `availability_grid` (array of objects): One row per (candidate, tld) with fields `full_domain`, `dns_resolves`, `http_status`, `whois_registered`, `score`.
- `score_per_candidate` (array of objects): Per base-name summary with `best_tld`, `best_score`, and list of available TLDs.

### Scoring rubric

| Score | Meaning | Typical action |
|---|---|---|
| 3 | No DNS, no HTTP, WHOIS unregistered | Register immediately at any budget registrar. |
| 2 | No DNS, no HTTP, WHOIS ambiguous | Almost certainly available  --  verify on Namecheap/Porkbun before claiming. |
| 1 | DNS resolves, HTTP dead or parked, WHOIS registered | Registered but unused  --  possibly for sale, likely > $500. |
| 0 | DNS resolves, HTTP live | Taken and in use  --  pass. |

---

## Execution Phases

### Phase 0: Budget Gate
### Entry Criteria
`candidate_names` and `tlds` both present.
### Actions
Compute `len(candidate_names) × len(tlds)` total checks; warn if > 500.
### Output
Check count, WHOIS budget.
### Quality Gate
Total checks within reasonable bounds (< 1000).

### Phase 1: DNS Resolution
### Entry Criteria
Budget validated.
### Actions
For each `{name}{tld}`: run DNS A-record lookup with 3s timeout. Record `dns_resolves` boolean.
### Output
DNS-annotated grid.
### Quality Gate
Every row has a `dns_resolves` value.

### Phase 2: HTTP Live-Check
### Entry Criteria
DNS phase complete.
### Actions
For each row where `dns_resolves == true`: HTTP HEAD request with `http_timeout_s`, follow redirects, inspect status and Server header for parked-page markers.
### Output
`http_status` ∈ {"live", "parked", "error", "none"} per row.
### Quality Gate
Timeouts recorded as "error", not silently dropped.

### Phase 3: WHOIS Confirmation
### Entry Criteria
HTTP phase complete, `whois_enabled == true`.
### Actions
Up to `max_whois_per_run` queries. Record `whois_registered` ∈ {"yes", "no", "ambiguous", "skipped"}.
### Output
WHOIS-annotated grid.
### Quality Gate
Budget respected; rows beyond budget marked "skipped".

### Phase 4: Scoring
### Entry Criteria
All prior phases complete.
### Actions
Apply scoring rubric. Emit `availability_grid` (per row) and `score_per_candidate` (per base name  --  the max score across its TLDs).
### Output
Final ranked output.
### Quality Gate
Every base name appears in `score_per_candidate` exactly once.

---

## Reference Runner

`F:/The Wayfinder Trust/IP/projects/MarketingOutreach/Naming/naming_flow.py`  --  functions `check_dns`, `check_http`, `check_whois`, `run_checks`.

---

## Worked Example

Illustrative only.

Given typical inputs for For each candidate × TLD combination: runs DNS lookup, HTTP HEAD, and optional W, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.


---

## Exit Criteria

DONE when all phase quality gates pass and all outputs are populated.


---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Any | Missing required input | **Stop**: report which input is missing and what it should contain. |
| Any | Upstream phase output incomplete | **Return**: re-run the upstream phase with the gap identified. |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
