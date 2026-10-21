# Brand Conflict Search

**One-line description:** For each candidate name: runs WebSearch (web presence), USPTO TESS (trademark), and LinkedIn Company search (existing companies) to surface brand conflicts before registration.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** No  --  single-party research.

---

## Inputs

- `shortlist_names` (array, required): Candidate base names (typically the top-scoring subset from `domain-availability-checker`).
- `conflict_depth` (string, optional, default "standard"): "quick" (web only), "standard" (web + LinkedIn), "deep" (web + LinkedIn + USPTO TESS + state-of-incorporation checks).
- `search_domains_to_include` (array, optional): Domains to include in WebSearch (e.g., ["linkedin.com", "uspto.gov", "crunchbase.com"]).

## Outputs

- `conflict_report` (array of objects): Per name, a record of:
    - `web_hits`: top 5 web results with title + URL + relevance summary.
    - `linkedin_companies`: LinkedIn company pages matching the name.
    - `uspto_marks`: live USPTO trademark registrations (if depth = "deep").
    - `conflict_severity`: "none", "low", "medium", "high".
    - `notes`: human-readable summary of why this is or isn't a conflict.
- `safe_names` (array): Names with `conflict_severity` ∈ {"none", "low"}.

### Severity rubric

| Severity | Condition |
|---|---|
| none | No WebSearch hits with the candidate as the dominant token; no LinkedIn company; no USPTO live mark. |
| low | Niche/small-business web mention; no LinkedIn company; no USPTO live mark. |
| medium | LinkedIn company exists but in unrelated industry, OR USPTO application filed but abandoned. |
| high | Active, well-established company or USPTO live mark in an overlapping class (e.g., software/SaaS/financial services). |

---

## Execution Phases

### Phase 0: Shortlist Gate
### Entry Criteria
`shortlist_names` present with at least 3 entries.
### Actions
Confirm list size reasonable (< 30 to keep search-call budget bounded).
### Output
Confirmed shortlist.
### Quality Gate
Size within bounds.

### Phase 1: Web Presence Check
### Entry Criteria
Shortlist confirmed.
### Actions
For each candidate: WebSearch with exact-match quotes (e.g., `"Veridion Systems"`). Capture top 5 results. Flag hits where the candidate is the dominant token and the hit is a software/SaaS/financial company.
### Output
`web_hits` per candidate.
### Quality Gate
Every candidate has at least a "no results" or "N results" entry.

### Phase 2: LinkedIn Company Check
### Entry Criteria
Web phase complete; `conflict_depth` ≥ "standard".
### Actions
Search `linkedin.com/company` for each candidate. Record any company page that matches the exact name.
### Output
`linkedin_companies` per candidate.
### Quality Gate
All candidates searched; zero-result candidates explicitly marked as "no LinkedIn match".

### Phase 3: USPTO TESS (deep only)
### Entry Criteria
`conflict_depth` == "deep".
### Actions
Query USPTO TESS for live marks in classes 9 (software), 36 (insurance/financial), 42 (SaaS/tech services). Record mark status.
### Output
`uspto_marks` per candidate.
### Quality Gate
Only checks live/pending; dead marks don't block.

### Phase 4: Severity Scoring
### Entry Criteria
All enabled searches complete.
### Actions
Apply severity rubric per candidate. Build `conflict_report`. Emit `safe_names` (severity ∈ {none, low}).
### Output
Final `conflict_report` + `safe_names`.
### Quality Gate
Every candidate has an explicit severity label and a human-readable `notes` line.

---

## Reference Runner

Not yet implemented in Python. Intended to be executed via the Claude Code WebSearch tool with structured prompts per candidate. A MCP-bound version can be added when volume justifies automation.

---

## Worked Example

Illustrative only.

Given typical inputs for For each candidate name: runs WebSearch (web presence), USPTO TESS (trademark), , the pipeline produces structured outputs through each phase, with quality gates verified at every stage.


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
