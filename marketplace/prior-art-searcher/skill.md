# Prior Art Searcher

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Searches for and analyzes prior art relevant to a patent application. Identifies existing patents, publications, and systems that could affect patentability. For each prior art reference, produces a differentiation analysis explaining how the invention differs. Outputs a structured prior art report with clearance status and recommended claim modifications.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Identify invention's key claims and search terms
REASON  --> Analyze each reference for overlap with claims
PLAN    --> Build differentiation strategy for each reference
ACT     --> Produce prior art report with clearance status
     \                                                    /
      +--- New reference found --- loop OBSERVE ----------+
```

## Inputs

- `claims`: list[object] -- The claim set to evaluate against prior art
- `invention_summary`: string -- Brief description of the invention
- `domain_keywords`: list[string] -- Technical keywords for search (e.g., ["runtime governance", "trust computation", "autonomous systems"])
- `known_references`: list[object] -- Prior art already identified (to avoid re-searching)
- `search_sources`: list[string] -- Where to search (default: ["Google Patents", "USPTO", "IEEE", "arXiv", "Google Scholar"])

## Outputs

- `prior_art_report`: list[object] -- Each reference with: name, source, year, summary, overlap_analysis, differentiation, risk_level
- `clearance_status`: string -- "CLEARED", "AT_RISK", or "BLOCKED" with explanation
- `claim_modifications`: list[object] -- Suggested changes to strengthen claims against found prior art
- `search_log`: list[string] -- Queries performed and sources checked (for reproducibility)

---

## Execution

### OBSERVE: Identify Search Space

**Entry criteria:** Claims and invention summary provided

**Actions:**
1. Extract key concepts from each independent claim. Identify the novel combination of elements.
2. Generate search queries from:
   - Exact technical terms from claims (e.g., "exponential decay trust computation")
   - Broader category terms (e.g., "runtime safety monitoring autonomous systems")
   - Component-level terms (e.g., "controller-agnostic enforcement adapter")
   - Problem-level terms (e.g., "model-reality divergence detection")
3. Identify the most relevant patent classes (CPC/IPC codes) for the invention domain.
4. Search each source for each query combination. Record all queries in search_log.
5. Collect candidate references: patents, papers, products, open-source projects.

**Output:** List of candidate prior art references with source details.

**Quality gate:** At least 3 different search sources queried. At least 10 queries performed. All major claim concepts searched.

---

### REASON: Analyze Overlap

**Entry criteria:** Candidate references collected

**Actions:**
1. For each candidate reference, analyze:
   - Which claim elements it covers (if any)
   - Which claim elements it does NOT cover
   - Whether it addresses the same problem or a different one
   - Whether the approach is fundamentally different (different mechanism, not just different parameters)
2. Rate each reference by risk level:
   - **HIGH**: Covers most elements of an independent claim
   - **MEDIUM**: Covers some elements but misses key novel components
   - **LOW**: Overlaps only in general domain, not in specific mechanism
   - **NONE**: No meaningful overlap
3. For HIGH-risk references, identify the specific differentiating elements that save patentability.
4. Check for combination risk: do two or more LOW/MEDIUM references together cover an independent claim?

**Output:** Risk-rated prior art list with element-level overlap analysis.

**Quality gate:** Every candidate rated. Every HIGH-risk reference has specific differentiation identified.

---

### PLAN: Build Differentiation Strategy

**Entry criteria:** Overlap analysis complete

**Actions:**
1. For each HIGH or MEDIUM risk reference, draft explicit differentiation language:
   - "[Prior art] does X. The present invention does Y. Specifically, [prior art] lacks [novel element], which the present invention provides through [mechanism]."
2. Identify if any claims need narrowing to avoid overlap. Draft specific modifications:
   - Adding a dependent claim that narrows past the prior art
   - Rewording an independent claim element to emphasize the differentiating aspect
   - Adding "wherein" clauses that distinguish
3. Determine overall clearance status:
   - **CLEARED**: No HIGH-risk references. All claims defensible.
   - **AT_RISK**: HIGH-risk references exist but can be differentiated with claim modifications.
   - **BLOCKED**: A reference covers the core novel combination. Filing inadvisable without major redesign.

**Output:** Differentiation strategy, claim modifications, clearance status.

**Quality gate:** Every HIGH/MEDIUM reference has actionable differentiation language. Clearance status is justified.

---

### ACT: Produce Report

**Entry criteria:** Differentiation strategy complete

**Actions:**
1. Compile the full prior art report with all references, ratings, and differentiation.
2. Order references by risk level (HIGH first).
3. Include the search_log showing all queries and sources for reproducibility.
4. If clearance_status is AT_RISK, include the specific claim_modifications needed.
5. If new references were found during analysis, loop back to OBSERVE to search for related work.

**Output:** Complete prior art report, clearance status, claim modifications, search log.

**Quality gate:** Report is self-contained. Any reviewer can understand the risk landscape from the report alone.

## Exit Criteria

The skill is DONE when:
1. All major claim concepts have been searched across multiple sources
2. Every candidate reference is rated and analyzed
3. HIGH/MEDIUM risk references have explicit differentiation language
4. Clearance status is determined with justification
5. Claim modifications are provided for any AT_RISK findings
6. Search log records all queries performed

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Search sources unavailable | **Adjust** -- use available sources, note gaps in search_log |
| OBSERVE | Too many results to analyze | **Adjust** -- filter to top 20 most relevant, note filtering criteria |
| REASON | Can't determine overlap without reading full patent | **Flag** -- note reference needs manual review, rate conservatively |
| REASON | Reference is in a foreign language | **Flag** -- note language, attempt title/abstract analysis only |
| PLAN | No differentiation possible for a HIGH-risk reference | **Escalate** -- report BLOCKED status with details |
| ACT | New references discovered during analysis | **Loop** -- return to OBSERVE for additional searching |
| ACT | User rejects final output | **Targeted revision** -- ask which reference's analysis fell short (overlap rating, differentiation language, or claim modification) and rerun only that reference's REASON-PLAN phases. Do not re-search everything. |

## State Persistence

Between runs, this skill accumulates:
- **Reference database**: all prior art found across patent families
- **Search patterns**: effective query formulations per domain
- **Differentiation templates**: reusable language for common distinctions

---

## Reference

### Prior Art Risk Level Criteria

| Risk Level | Condition | Action Required |
|---|---|---|
| HIGH | Reference covers 3+ elements of an independent claim | Must differentiate or modify claim |
| MEDIUM | Reference covers 1-2 elements; misses key novel component | Draft differentiation language |
| LOW | Overlaps in general domain only; different mechanism | Note in report; no claim change needed |
| NONE | Different problem, different approach | Log in search_log; no action |

### Combination Risk Test

Two or more LOW/MEDIUM references together may constitute obviousness if:
1. They are from the same technical domain
2. A PHOSITA would have motivation to combine them
3. Together they cover all elements of an independent claim

If all three conditions hold: treat the combination as HIGH risk.

### Differentiation Language Template

"[Prior art name] discloses [what it does]. However, [prior art name] does not disclose [novel element], which is required to achieve [technical result]. The present invention differs in that [specific mechanism] achieves [specific result] that [prior art] cannot provide."

### Clearance Status Decision Rules

| Status | Condition |
|---|---|
| CLEARED | No HIGH-risk references; all claims defensible as-is |
| AT_RISK | 1+ HIGH-risk references exist but differentiation is possible with claim modifications |
| BLOCKED | Reference covers the core novel combination; no viable differentiation |

### Search Source Priority

| Source | Best For |
|---|---|
| Google Patents / USPTO | US patent applications and grants |
| EPO Espacenet | European patents and international families |
| IEEE Xplore | Peer-reviewed technical papers |
| arXiv | Pre-print papers (especially ML, CS, physics) |
| Google Scholar | Broad academic coverage |
| GitHub / open-source | Non-patent prior art (products, libraries) |

### Common CPC Code Families (Software/AI)

- G06N — Machine learning and neural networks
- G06F 11 — Error detection and fault tolerance
- G06F 21 — Security and access control
- H04L 41/069 — Network management by policy
- G06Q — Business methods and financial systems

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
