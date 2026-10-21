# Trademark Common-Law Search

**One-line description:** Finds unregistered (common-law) uses of a proposed mark in actual commerce  --  web presence, state business-entity filings, social handles, and domain corroboration.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** No  --  single-party research.

**Why this matters:** A party using a mark in commerce without USPTO registration can still hold geographically-limited common-law rights that predate your filing. Missing these in pre-clearance is how cease-and-desists arrive after a brand launch.

---

## Inputs

- `proposed_mark` (string, required): Primary form of the proposed mark.
- `mark_variants` (array, optional): Variants to include in search.
- `target_jurisdictions` (array, optional, default all 50 US states): State business-entity registries to search.
- `include_social_handles` (boolean, optional, default true): Whether to check LinkedIn Company, Twitter/X, Instagram, GitHub.

## Outputs

- `web_presence_hits` (array): Web search results where the proposed mark is used as a business/product name. Each row: url, title, snippet, apparent_industry, first_indexed_date_estimate.
- `state_business_registrations` (array): Matching entities in state Secretary of State databases. Each row: state, entity_name, entity_type, filing_date, status (active/inactive).
- `social_handle_matches` (array): Active social-media accounts using the exact mark or close variants.
- `domain_corroboration` (array): Any domain names with the mark that host live sites (feeds into/from the `domain-availability-checker` flow).
- `common_law_conflict_candidates` (array): Consolidated, de-duplicated list of uses that could establish prior common-law rights, with industry/geography tags.

---

## Execution Phases

### Phase 0: Query Preparation
### Entry Criteria
`proposed_mark` present.
### Actions
Build query list: exact-quoted mark, plus each variant, plus exact-quoted mark with industry qualifier (e.g., `"the governance provider" software`, `"the governance provider" insurance`).
### Output
Query plan with expected search volume.
### Quality Gate
At least 5 query variants (base, + software, + insurance, + SaaS, + AI).

### Phase 1: Web Presence Search
### Entry Criteria
Query plan ready.
### Actions
Execute WebSearch for each query variant. Capture top 10 results per query. Parse each for: business/product name usage, industry indicators, apparent active-commerce signals.
### Output
`web_presence_hits`.
### Quality Gate
Every hit classified as "active business use" / "legacy/defunct" / "non-commercial / unrelated".

### Phase 2: State Business-Entity Registry Search
### Entry Criteria
Web phase complete.
### Actions
Query each state Secretary of State business-entity database for the proposed mark. Prioritize Delaware, Wyoming, Nevada (common incorporation states) + California, New York, Texas (highest commerce density). Capture active LLCs, corporations, and DBAs.
### Output
`state_business_registrations`.
### Quality Gate
Each match tagged active/inactive with filing date; jurisdictions not-searched listed explicitly.

### Phase 3: Social Media Handle Check
### Entry Criteria
`include_social_handles == true`.
### Actions
Check LinkedIn Company, Twitter/X, Instagram, GitHub, Facebook Pages, TikTok for exact-handle usage.
### Output
`social_handle_matches`.
### Quality Gate
Each platform checked produces either a match or an explicit "no match" record.

### Phase 4: Domain Corroboration
### Entry Criteria
Prior phases complete.
### Actions
Cross-reference with `domain-availability-checker` output (if available in same chain). Live commercial sites at any variant domain → automatically a common-law conflict candidate.
### Output
`domain_corroboration`.
### Quality Gate
Each live site confirmed to be active-commerce (not parking/squatter) via HTTP response inspection.

### Phase 5: Conflict Consolidation
### Entry Criteria
All searches complete.
### Actions
De-duplicate across web / state / social / domain (same entity often appears in multiple). Consolidate into `common_law_conflict_candidates` with: entity_name, earliest_known_use_date, industry, geography, strength_estimate (strong/moderate/weak  --  based on breadth of use).
### Output
Consolidated candidate list.
### Quality Gate
Every candidate has an earliest-use-date estimate and an industry tag.


---

## Worked Example

Illustrative only.

Given typical inputs for Finds unregistered (common-law) uses of a proposed mark in actual commerce: web , the pipeline produces structured outputs through each phase, with quality gates verified at every stage.


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
