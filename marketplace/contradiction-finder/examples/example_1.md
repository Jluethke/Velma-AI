# Contradiction Finder -- Analyzing Project Requirements for Consistency

## Scenario

A product team has 8 requirements statements for a new feature. Before development begins, the team wants to verify that the requirements are internally consistent. No one has read all 8 documents end-to-end.

## OBSERVE: Ingest Claims

**Extracted claims (from 8 requirements documents):**

| ID | Content | Source | Tags |
|---|---|---|---|
| C1 | "The system must respond to all API requests within 200ms" | Performance requirements v2 | performance, api |
| C2 | "Every API response must include a full audit trail of all data transformations" | Compliance requirements | compliance, api |
| C3 | "The audit trail computation adds approximately 150ms to each request" | Architecture decision record #12 | compliance, performance |
| C4 | "User data must never leave the EU region" | Data residency policy | compliance, data |
| C5 | "The system should use a global CDN for all static and dynamic content" | Infrastructure plan | infrastructure, performance |
| C6 | "API responses should be cached at the edge for 5 minutes" | Performance optimization plan | performance, api |
| C7 | "Every API response must reflect the current state of the database" | Data freshness requirement | data, api |
| C8 | "The system must support real-time updates via WebSocket" | Feature requirements | api, real-time |

**Topic groups (by tag overlap):**
- Group A (performance + api): C1, C2, C3, C6
- Group B (compliance + data): C2, C4, C5
- Group C (api + data): C6, C7

## REASON: Detect Contradictions

### Pair 1: C1 vs C2+C3

**C1:** "The system must respond to all API requests within 200ms"
**C3:** "The audit trail computation adds approximately 150ms to each request"
**C2:** "Every API response must include a full audit trail"

Combined implication: If audit trails are mandatory (+150ms) and the budget is 200ms, only 50ms remains for actual business logic and database queries. This is likely infeasible.

```
C1 words: {system, must, respond, all, api, requests, within, 200ms}
C3 words: {audit, trail, computation, adds, approximately, 150ms, each, request}

Overlap: {request/requests} -- similarity after normalization: 0.15
```

This pair has low keyword overlap (different vocabulary) but high **logical** contradiction. The keyword-based algorithm misses it because the contradiction is arithmetic, not linguistic. This is a limitation -- flagged for human review.

### Pair 2: C4 vs C5

**C4:** "User data must never leave the EU region"
**C5:** "The system should use a global CDN for all static and dynamic content"

```
C4 words: {user, data, must, never, leave, eu, region}
C5 words: {system, should, use, global, cdn, all, static, dynamic, content}

Overlap: {} -- similarity: 0.0
```

Again, low keyword overlap. The contradiction is semantic (global CDN + dynamic content would replicate user data outside EU). Keyword algorithm doesn't catch this -- flagged as a limitation.

### Pair 3: C6 vs C7 (DETECTED)

**C6:** "API responses should be cached at the edge for 5 minutes"
**C7:** "Every API response must reflect the current state of the database"

```
C6 words: {api, responses, should, cached, edge, 5, minutes}
C7 words: {every, api, response, must, reflect, current, state, database}

Overlap: {api, response/responses} (normalized)
After stop word removal: {api, response}
similarity = 2 / max(5, 6) = 0.33
```

Similarity is below 0.4 threshold. Borderline miss. However, applying domain-aware synonym matching (responses ~ response) and lowering threshold to 0.3 for small claim sets:

```
Negation: None explicit, but "cached for 5 minutes" semantically contradicts "current state"
Antonyms: "cached" vs "current" -- not in standard antonym list but functionally opposed
```

**Manual override applied:** This is a genuine contradiction caught by human review after the algorithm flagged it as borderline. **Caching a response for 5 minutes means it does NOT reflect the current database state.** Conflict score: assigned 0.65 manually.

### Pair 4: C5 vs C4 (Semantic, Manually Flagged)

Although the algorithm's keyword overlap is 0.0, this pair represents the most dangerous contradiction in the requirements:

- C4 mandates data stays in EU
- C5 mandates global CDN for ALL content including dynamic (which contains user data)
- These cannot both be true simultaneously

**Conflict score:** Assigned 0.80 manually (high confidence, fundamental contradiction).

## PLAN: Rank and Suggest Resolutions

| # | Claims | Score | Difficulty | Resolution |
|---|---|---|---|---|
| 1 | C5 (global CDN) vs C4 (EU data residency) | 0.80 | Hard | **Contextual**: Modify C5 to "global CDN for static content only; dynamic content served from EU-only endpoints." This preserves CDN benefits for static assets while respecting data residency. |
| 2 | C6 (5-min cache) vs C7 (current DB state) | 0.65 | Medium | **Contextual**: Define which API endpoints can be cached (read-only, non-personalized) vs which must be real-time (user-specific, transactional). C6 applies to the former, C7 to the latter. |
| 3 | C1 (200ms) vs C2+C3 (audit trail +150ms) | 0.50* | Hard | **Evidential**: Either relax the 200ms target to 350ms for audited endpoints, or make audit trail computation asynchronous (fire-and-forget, reconstruct on demand). |

*Score 0.50 assigned manually -- arithmetic contradiction not detectable by keyword algorithm.

**Consistency score:** 0.62 (3 contradictions in 28 possible pairs within groups = moderate inconsistency). This requirements set should NOT proceed to development without resolving contradictions #1 and #3.

## ACT: Contradiction Report

```
CONTRADICTION REPORT -- Project Requirements Consistency Check
═══════════════════════════════════════════════════════════════

Claims analyzed: 8
Pairs compared: 28 (within topic groups)
Contradictions found: 3 (10.7% of pairs)
Consistency score: 0.62 (MODERATE -- resolve before development)

CONTRADICTION #1 (score: 0.80, difficulty: HARD)
────────────────────────────────────────────────
  C5: "The system should use a global CDN for all static and dynamic content"
  C4: "User data must never leave the EU region"

  Conflict: Global CDN replicates dynamic content (containing user data) worldwide,
  violating EU data residency. These requirements cannot coexist as written.

  Resolution: Scope CDN to static content only. Serve dynamic content from EU
  endpoints. Update C5 to reflect this boundary.

CONTRADICTION #2 (score: 0.65, difficulty: MEDIUM)
────────────────────────────────────────────────
  C6: "API responses should be cached at the edge for 5 minutes"
  C7: "Every API response must reflect the current state of the database"

  Conflict: A 5-minute cache means responses are up to 5 minutes stale,
  contradicting the "current state" requirement.

  Resolution: Classify endpoints. Read-only public data: cacheable (C6 applies).
  User-specific transactional data: real-time (C7 applies). Neither requirement
  is wrong -- they apply to different endpoint classes.

CONTRADICTION #3 (score: 0.50, difficulty: HARD)
────────────────────────────────────────────────
  C1: "All API requests within 200ms"
  C2+C3: "Mandatory audit trail adds 150ms per request"

  Conflict: 200ms budget - 150ms audit = 50ms for all business logic, DB queries,
  and network. This is infeasible for most endpoints.

  Resolution: Either (a) increase budget to 350ms for audited endpoints,
  (b) make audit computation asynchronous, or (c) audit only specific
  high-risk endpoints rather than all requests.

ALGORITHM LIMITATIONS NOTED:
  - Pairs #1 and #3 were not detected by keyword overlap (similarity < 0.4)
  - These contradictions are semantic/arithmetic, not linguistic
  - Recommendation: supplement keyword algorithm with domain-specific rules
    and human review for small, high-stakes claim sets
```

**Key takeaway:** The keyword-based contradiction detector works well for linguistically-opposed claims (negation markers, antonyms) but misses semantic and arithmetic contradictions. For critical requirements, always supplement with human review. The algorithm's real value is at scale -- when you have hundreds of claims, it efficiently surfaces the linguistically obvious contradictions so humans can focus their limited attention on the subtle ones.
