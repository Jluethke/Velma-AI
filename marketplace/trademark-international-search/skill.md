# Trademark International Search

**One-line description:** Searches TMView (EU IPO), WIPO Global Brand Database (Madrid System), and jurisdiction-specific registries for international marks that could conflict with a proposed US mark if the business operates cross-border.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** No  --  single-party research.

**Why this matters:** If the business plans to sell into the UK, EU, Canada, Australia, or Japan, a US-only clearance is insufficient. Many international trademark offices grant rights to first-filers, not first-users. A senior mark in the UK can block you from ever operating there.

---

## Inputs

- `proposed_mark` (string, required)
- `mark_variants` (array, optional)
- `trademark_classes` (array, required): Nice Classification classes (same 1-45 system used internationally).
- `jurisdictions_required` (array, optional, default ["US", "EU", "UK", "CA"]): Jurisdictions where business will operate.

## Outputs

- `tmview_eu_matches` (array): Matches from TMView covering all EU member states. Each row: application_number, mark_text, owner, filing_date, classes, status, member_state.
- `wipo_madrid_matches` (array): Marks filed under the Madrid Protocol that designate any `jurisdictions_required` country.
- `jurisdiction_specific_matches` (array): Matches from UK IPO, CIPO (Canada), IP Australia, JPO, and other national registries outside the Madrid Protocol designations.
- `international_conflict_candidates` (array): Consolidated, de-duplicated international conflict list with jurisdictional scope.

---

## Execution Phases

### Phase 0: Jurisdiction Scoping
### Entry Criteria
`jurisdictions_required` list valid; all entries are ISO country codes or EU.
### Actions
Build per-jurisdiction search plan. Note which jurisdictions are Madrid Protocol signatories (most are) vs. non-Madrid (requires direct registry search).
### Output
Per-jurisdiction search spec.
### Quality Gate
Every required jurisdiction has a search path assigned.

### Phase 1: TMView EU Search
### Entry Criteria
Search plan ready.
### Actions
Query TMView for each mark variant across all EU member states. Capture LIVE registrations + pending applications.
### Output
`tmview_eu_matches`.
### Quality Gate
Results cover at least France, Germany, Italy, Spain, Netherlands, Poland, Sweden (top EU economies).

### Phase 2: WIPO Madrid Search
### Entry Criteria
TMView search complete.
### Actions
Query WIPO Global Brand Database for Madrid Protocol filings. Filter to those designating any `jurisdictions_required` country.
### Output
`wipo_madrid_matches`.
### Quality Gate
Each hit lists all designated contracting parties.

### Phase 3: Jurisdiction-Specific Registries
### Entry Criteria
`jurisdictions_required` includes non-TMView/non-Madrid jurisdictions.
### Actions
Direct search of UK IPO (post-Brexit), CIPO (Canada), IP Australia, JPO (Japan), KIPO (Korea), China CNIPA as applicable.
### Output
`jurisdiction_specific_matches`.
### Quality Gate
Every listed jurisdiction either returns results or an explicit "no match" record.

### Phase 4: Consolidation
### Entry Criteria
All regional searches complete.
### Actions
De-duplicate (same mark often appears in TMView + WIPO + national registries). Tag each conflict with jurisdictional scope. Flag any that designate multiple `jurisdictions_required`.
### Output
`international_conflict_candidates`.
### Quality Gate
De-duplication logged; each final entry has at least one listed jurisdiction.


---

## Worked Example

Illustrative only.

Given typical inputs for Searches TMView (EU IPO), WIPO Global Brand Database (Madrid System), and jurisd, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.


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
