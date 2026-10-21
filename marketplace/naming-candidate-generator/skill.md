# Naming Candidate Generator

**One-line description:** Generates enterprise-ready company-name candidates from semantic roots drawn from the company's purpose and patent themes, combined with prefix/suffix templates, filtered by length and blocked-word rules.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** No  --  single-party generator.

---

## Inputs

- `company_purpose` (string, required): What the company does (e.g., "enterprise-sales arm licensing runtime AI-governance patents to insurance carriers and CRE lenders").
- `patent_theme_keywords` (array, required): Semantic themes tied to the underlying IP (e.g., ["governance", "audit", "runtime", "envelope", "trust", "non-bypassable"]).
- `vibe_categories` (array, required): Desired linguistic/emotional registers (e.g., ["navigation", "assurance", "evidence", "classical-roots"]).
- `include_roots` (array, required): Curated root words to seed generation (e.g., ["Lodestar", "Veridion", "Aegis"]).
- `prefix_candidates` (array, optional): Prefixes to combine with roots (e.g., ["", "Assured", "Known", "Sure"]).
- `suffix_candidates` (array, optional): Suffixes (e.g., ["", "Systems", "Labs", "Runtime", "Governance"]).
- `blocked_words` (array, optional): Words that must not appear (e.g., ["bank", "crypto", "token", "chain"]).
- `min_length` (integer, required): Minimum candidate length in characters.
- `max_length` (integer, required): Maximum candidate length in characters.
- `generate_count` (integer, required): Target number of candidates to emit.

## Outputs

- `candidate_names` (array): Deduped list of name candidates that satisfy the length + blocked-word rules.
- `generation_metadata` (object): Counts and combinatorial coverage info (roots × prefixes × suffixes explored, dedupe rate, why-skipped reasons).

---

## Execution Phases

### Phase 0: Seed Check
### Entry Criteria
All required inputs present.
### Actions
Validate that `include_roots` has at least one entry, `min_length < max_length`, and `generate_count > 0`.
### Output
Validated config snapshot.
### Quality Gate
No input violations; at least one root is present.

### Phase 1: Combinatorial Expansion
### Entry Criteria
Config validated.
### Actions
1. For each (prefix, root, suffix) triple, form a candidate string. 2. Normalize whitespace; compute a lowercase-alphanumeric shadow for de-duplication. 3. Discard candidates outside length bounds or containing any `blocked_words` token.
### Output
Raw candidate list with shadow keys.
### Quality Gate
Every candidate is a unique shadow key and passes length/blocked-word filters.

### Phase 2: Vibe Balancing
### Entry Criteria
Raw candidates produced.
### Actions
1. Bucket candidates by which `vibe_categories` they touch (e.g., "Lodestar" → navigation). 2. Ensure no single vibe accounts for more than ~60% of the final emitted list  --  rebalance by sampling across buckets.
### Output
Balanced candidate list, size ≤ `generate_count`.
### Quality Gate
Vibe distribution is reported; no over-weighting of any single register.

### Phase 3: Emit
### Entry Criteria
Balanced list built.
### Actions
1. Emit `candidate_names` in stable order (roots first, then prefixed roots, then suffixed). 2. Emit `generation_metadata` summarizing combinatorial size, dedupe rate, per-vibe distribution.
### Output
Final outputs.
### Quality Gate
`len(candidate_names) ≤ generate_count` and every item is distinct after shadow normalization.

---

## Reference Runner

The reference Python implementation lives at:

`F:/The Wayfinder Trust/IP/projects/MarketingOutreach/Naming/naming_flow.py` (function `generate_candidates`)

Chain-level dependents should consume `candidate_names` as input.

---

## Worked Example

Illustrative only.

Given typical inputs for Generates enterprise-ready company-name candidates from semantic roots drawn fro, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.


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
