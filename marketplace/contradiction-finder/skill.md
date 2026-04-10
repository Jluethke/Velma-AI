# Contradiction Finder

Ingest a body of claims, statements, or documents and systematically detect contradictions using keyword overlap, negation markers, and antonym pair detection. Output a ranked contradiction report with conflict scores, shared context, and resolution suggestions.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Ingest a body of claims/statements/documents
REASON  --> Compare pairs for semantic overlap + negation markers + antonym pairs
PLAN    --> Rank contradictions by confidence score, group by topic
ACT     --> Output contradiction report with specific conflicting claims, shared context, resolution suggestions
     \                                                              /
      +--- New claims added or contradictions resolved --- loop ---+
```

## Inputs

- `claims`: list[object] -- Statements to analyze for contradictions. Each: `{id, content, source, timestamp, tags}`
- `documents`: list[object] -- Full documents to extract claims from before analysis. Each: `{id, content, source}`
- `context`: string -- Domain context that affects how contradictions are interpreted (e.g., "financial analysis" changes how "long" and "short" are interpreted)
- `resolution_history`: list[object] -- Previously resolved contradictions (from accumulated state) to avoid re-flagging

## Outputs

- `contradiction_report`: list[object] -- Ranked contradictions: `{claim_a, claim_b, conflict_score, shared_context, resolution_suggestion, status}`
- `conflict_scores`: list[float] -- All computed conflict scores for transparency
- `conflicting_pairs`: list[object] -- Paired claims with their specific conflict indicators (which negation markers, which antonyms)
- `shared_context`: list[string] -- The overlapping keywords that establish topical relatedness for each contradiction
- `resolution_suggestions`: list[object] -- For each contradiction: possible resolution paths (temporal, contextual, evidential)
- `consistency_score`: float -- Overall consistency of the claim body (0 = riddled with contradictions, 1 = fully consistent)

---

## Execution

### OBSERVE: Ingest and Extract Claims

**Entry criteria:** At least one claim or document is provided.

**Actions:**

1. **Extract claims from documents.** If full documents are provided, decompose them into discrete claims. A claim is a single assertable statement:
   - Split on sentence boundaries
   - Filter out questions, commands, and procedural text (not assertable)
   - Retain: declarative statements that assert something is true
   - Each extracted claim inherits the source and tags of its parent document

2. **Normalize claims.** Prepare for comparison:
   - Convert to lowercase for matching
   - Tokenize into word sets (split on whitespace and punctuation)
   - Remove stop words that add noise to overlap computation: "the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "shall", "should", "may", "might", "can", "could", "of", "in", "to", "for", "with", "on", "at", "by", "from", "as", "into", "through", "about", "between"
   - Retain negation markers even if they appear in stop word lists (they are signals, not noise)

3. **Group claims by topic.** Use tags or keyword clustering to form topic groups:
   - Claims with shared tags go in the same group
   - Claims without tags: cluster by keyword overlap (>= 0.3 Jaccard similarity)
   - Contradiction detection runs within groups first (same-topic contradictions are more meaningful than cross-topic ones)

4. **Check resolution history.** Filter out claim pairs that have already been resolved in previous runs (from `resolution_history`). Mark them as "previously resolved" in the output.

**Output:** Normalized claim database grouped by topic, with resolution history applied.

**Quality gate:** At least 2 claims exist in at least 1 topic group (otherwise, no contradictions are possible). Claims are normalized and tokenized.

---

### REASON: Detect Contradictions

**Entry criteria:** Normalized, grouped claims are ready for pairwise comparison.

**Actions:**

1. **Pairwise comparison within topic groups.** For each pair of claims (i, j) within the same topic group:

   **Step 1 -- Compute keyword overlap (Jaccard similarity):**
   ```
   words_a = set(claim_a.lower().split())  // after stop word removal
   words_b = set(claim_b.lower().split())
   overlap = words_a AND words_b
   max_len = max(|words_a|, |words_b|)
   ```

   **Step 2 -- Check for negation markers:**
   ```
   NEGATION_MARKERS = {
     "not", "never", "no", "neither", "nor",
     "incorrect", "wrong", "false", "invalid",
     "unlike", "opposite", "contrary",
     "avoid", "don't", "doesn't", "shouldn't", "can't", "cannot",
     "instead", "rather"
   }

   neg_a = words_a AND NEGATION_MARKERS
   neg_b = words_b AND NEGATION_MARKERS

   // Asymmetric negation: one claim negates, the other doesn't
   negation_score = 0.0
   if (neg_a AND NOT neg_b) OR (neg_b AND NOT neg_a):
       negation_score = |neg_a XOR neg_b| / max(|overlap|, 1)
   ```
   Asymmetric negation is the key signal. If both claims use negation, they might agree ("A is not good" and "A is not recommended" are consistent). If only one negates, they likely disagree ("A is good" vs "A is not good").

   **Step 3 -- Check for antonym pairs:**
   ```
   ANTONYM_PAIRS = {
     (increase, decrease), (positive, negative),
     (bullish, bearish), (always, never),
     (buy, sell), (long, short),
     (high, low), (strong, weak),
     (safe, dangerous), (correct, incorrect),
     (true, false), (success, failure),
     (rising, falling), (above, below),
     (accept, reject), (agree, disagree),
     (better, worse), (fast, slow),
     (open, closed), (start, stop),
     (grow, shrink), (profit, loss),
     (support, oppose), (include, exclude)
   }

   antonym_score = 0.0
   for (word_a, word_b) in ANTONYM_PAIRS:
       if (word_a in words_a AND word_b in words_b) OR
          (word_b in words_a AND word_a in words_b):
           antonym_score += 0.3
   ```

   **Step 4 -- Compute conflict score:**
   ```
   conflict_score = similarity * (negation_score + antonym_score)
   ```
   Flag if `conflict_score >= 0.25`.

2. **Cap comparisons.** To prevent quadratic blowup on large claim sets, cap pairwise comparisons at `max_comparisons` (default: 500). Prioritize comparisons within smaller topic groups (more likely to find contradictions) and between high-importance claims.

3. **Record conflict details.** For each flagged contradiction:
   - The two claims (full text)
   - The conflict score
   - Which negation markers triggered the flag
   - Which antonym pairs triggered the flag
   - The shared context words (overlap minus negation markers, top 5)

**Output:** List of flagged contradictions with conflict scores, trigger details, and shared context.

**Quality gate:** All within-group pairs (up to max_comparisons) have been evaluated. Every flagged contradiction has a conflict score >= 0.25. Trigger details (negation/antonym) are recorded.

---

### PLAN: Rank and Group Contradictions

**Entry criteria:** Contradictions are detected with conflict scores.

**Actions:**

1. **Rank by conflict score.** Sort contradictions descending by conflict score. Higher scores indicate more confident contradiction detection:
   - 0.25-0.40: Possible contradiction, worth reviewing
   - 0.40-0.60: Likely contradiction
   - 0.60-0.80: Strong contradiction
   - 0.80+: Near-certain contradiction (high overlap + strong negation/antonym signals)

2. **Group by topic.** Cluster related contradictions. If claims A-B and B-C both contradict, they form a contradiction cluster around claim B. This reveals "nexus claims" -- statements that are central to a web of disagreement.

3. **Assess resolution difficulty.** For each contradiction, predict how hard it will be to resolve:
   - **Easy (temporal)**: Claims may both be true at different times ("Revenue is increasing" in Q1 report vs "Revenue is decreasing" in Q3 report)
   - **Easy (contextual)**: Claims may both be true in different contexts ("Caching improves performance" for read-heavy vs "Caching doesn't improve performance" for write-heavy)
   - **Medium (evidential)**: One claim has stronger evidence than the other
   - **Hard (fundamental)**: Genuinely opposing views on the same thing at the same time in the same context

4. **Generate resolution suggestions.** For each contradiction:
   - **Temporal**: "Check if these claims refer to different time periods"
   - **Contextual**: "Check if these claims apply to different scenarios or conditions"
   - **Evidential**: "Compare the sources -- which has stronger evidence?"
   - **Definitional**: "Check if the same word is being used differently in each claim"
   - **Partial**: "Both claims may be partially true -- look for a synthesis that incorporates both"

5. **Compute consistency score.** Overall consistency of the claim body:
   ```
   consistency = 1.0 - (weighted_contradictions / total_possible_pairs)
   where weighted_contradictions = sum(conflict_score for all flagged pairs)
   and total_possible_pairs = n * (n-1) / 2 within each topic group
   ```
   Scale so that 1.0 = no contradictions, 0.0 = maximum contradiction density.

**Output:** Ranked, grouped contradiction list with resolution suggestions and overall consistency score.

**Quality gate:** Contradictions are sorted by conflict score. Each has a resolution difficulty estimate. Each has at least one resolution suggestion. Consistency score is computed.

---

### ACT: Deliver the Contradiction Report

**Entry criteria:** Contradictions are ranked, grouped, and have resolution suggestions.

**Actions:**

1. **Format the contradiction report.** For each contradiction:
   ```
   CONTRADICTION #1 (conflict score: 0.72, difficulty: medium)
   ─────────────────────────────────────────────────────────
   Claim A: "The database migration will increase query performance by 40%"
     Source: Engineering RFC #47, 2026-02-15
   Claim B: "The database migration will not improve performance for our workload"
     Source: DBA team assessment, 2026-03-01

   Conflict indicators:
     Negation: "not" in Claim B (asymmetric)
     Antonyms: "increase" vs implied "decrease"
     Shared context: database, migration, performance, query

   Resolution suggestion: EVIDENTIAL -- Compare the methodology behind
   each claim. RFC #47 may reference different workload characteristics
   than the DBA assessment.

   Status: UNRESOLVED
   ```

2. **Produce the summary.** Report:
   - Total claims analyzed
   - Total pairs compared
   - Contradictions found (count and percentage)
   - Consistency score
   - Top 3 most severe contradictions
   - Topics with highest contradiction density (likely areas of organizational confusion)

3. **Update accumulated state.** Record:
   - All contradictions found (for future resolution tracking)
   - Resolution status for each (unresolved, resolved-temporal, resolved-contextual, etc.)
   - Claims that were central to multiple contradictions (nexus claims)
   - Consistency score trend over time (is the claim body getting more or less consistent?)

4. **Check for loop trigger.** Loop back to OBSERVE if:
   - New claims are added to the corpus
   - A resolution is provided by a user (update status, re-check related contradictions)
   - The consistency score drops below a threshold (indicates the claim body is becoming unreliable)

**Output:** Formatted contradiction report, summary statistics, updated state.

**Quality gate:** Every contradiction has a specific conflict score, trigger details, and resolution suggestion. Summary accurately reflects the findings. State is updated for persistence.

## Exit Criteria

The skill is DONE when:
1. All claim pairs within topic groups have been compared (up to max_comparisons)
2. All contradictions with conflict score >= 0.25 are reported
3. Each contradiction has a resolution suggestion
4. Overall consistency score is computed
5. No new claims are pending analysis

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Fewer than 2 claims after extraction | Abort -- cannot detect contradictions with fewer than 2 claims |
| OBSERVE | Documents contain no extractable claims | Adjust -- lower extraction threshold, include weaker assertions |
| REASON | Max comparisons exceeded before all pairs checked | Adjust -- prioritize high-importance claims, report coverage percentage |
| REASON | All pairs have similarity < 0.4 | Abort -- claims are topically unrelated, contradiction detection not applicable |
| PLAN | No contradictions found (conflict scores all < 0.25) | Report consistency score of 1.0, note that the claim body appears consistent |
| ACT | Too many contradictions to report usefully (>50) | Adjust -- report only top 20 by conflict score, provide summary statistics for the rest |
| ACT | User rejects final output | **Targeted revision** -- ask which contradiction finding, conflict score, or resolution suggestion fell short and rerun only that section. Do not re-analyze the full claim set. |

## State Persistence

- Contradiction history (all detected contradictions with conflict scores, resolution status, and timestamps)
- Resolution log (how each contradiction was resolved: temporal, contextual, evidential, definitional, synthesis, or irreconcilable)
- Source credibility scores (accumulated reliability ratings for recurring sources)
- Nexus claims (claims that appeared in multiple contradictions -- central points of disagreement)
- Consistency score trend (per-run consistency scores to track whether the claim body is becoming more or less consistent over time)
- Antonym pair extensions (domain-specific antonym pairs discovered during analysis)

---

## Reference

### The Contradiction Detection Algorithm


**Design philosophy:**
- Keyword overlap (Jaccard) is a cheap proxy for topical relatedness. It misses synonyms but avoids the computational cost of embeddings.
- Negation markers are the strongest surface-level contradiction signal. If two statements discuss the same topic but one negates and the other doesn't, they likely disagree.
- Antonym pairs catch contradictions where the claims use different words rather than negation ("price is rising" vs "price is falling").
- The multiplicative formula `similarity * (negation + antonym)` ensures that both topical relatedness AND opposing signals must be present. High similarity alone is not a contradiction. High negation alone is not a contradiction (if the topics differ).

### Negation Markers -- Full Reference

```
Primary negation:     not, never, no, neither, nor
Adjective negation:   incorrect, wrong, false, invalid
Contrastive:          unlike, opposite, contrary
Verbal negation:      avoid, don't, doesn't, shouldn't, can't, cannot
Alternative framing:  instead, rather
```

**Subtleties:**
- "Not" can be part of "not only" (which is NOT a negation of the whole sentence)
- "Never" is stronger than "not" -- it implies absolute exclusion
- "Instead" and "rather" imply replacement, which is a softer form of contradiction
- Domain-specific negation may exist (e.g., "bearish" in finance negates "bullish")

### Antonym Pairs -- Extended Set


| Pair | Domain | Notes |
|---|---|---|
| increase / decrease | General | Also: grow/shrink, expand/contract, rise/fall |
| positive / negative | General | Also: good/bad, favorable/unfavorable |
| bullish / bearish | Finance | Strong contradiction in financial context |
| always / never | Logic | Absolute contradiction |
| buy / sell | Finance/Commerce | Direct opposites in transaction context |
| long / short | Finance | Position direction; ambiguous in other contexts |
| high / low | General | Also: more/less, greater/fewer |
| strong / weak | General | Also: robust/fragile, resilient/brittle |
| safe / dangerous | Risk | Also: secure/vulnerable, stable/unstable |
| correct / incorrect | Logic | Also: right/wrong, accurate/inaccurate |
| true / false | Logic | Boolean opposition |
| success / failure | Outcomes | Also: win/lose, pass/fail |
| rising / falling | Trends | Also: ascending/descending, up/down |
| above / below | Position | Also: over/under, higher/lower |
| accept / reject | Decisions | Also: approve/deny, include/exclude |
| agree / disagree | Opinion | Also: concur/dissent, support/oppose |
| better / worse | Comparison | Relative quality judgment |
| fast / slow | Performance | Also: quick/sluggish, rapid/gradual |
| open / closed | State | Also: available/unavailable, accessible/restricted |
| start / stop | Process | Also: begin/end, launch/terminate |
| profit / loss | Finance | Direct financial opposition |
| support / oppose | Stance | Also: endorse/criticize, back/undermine |

### Conflict Score Interpretation

The conflict score is a product of similarity and opposition signals. Interpretation ranges:

| Score Range | Meaning | Action |
|---|---|---|
| 0.00-0.24 | No meaningful contradiction detected | No action needed |
| 0.25-0.39 | Possible contradiction, may be contextual | Review -- often resolves with context |
| 0.40-0.59 | Likely contradiction | Investigate -- determine which claim is more supported |
| 0.60-0.79 | Strong contradiction | Resolve -- one claim is likely wrong or outdated |
| 0.80-1.00 | Near-certain contradiction | Urgent -- claims directly oppose each other on the same topic |

### Resolution Strategies

When a contradiction is found, resolution follows this hierarchy:

1. **Temporal resolution** (easiest): Are the claims from different time periods? The newer claim may supersede the older one. Check timestamps first.

2. **Contextual resolution**: Do the claims apply to different conditions? "X works for small datasets" and "X doesn't work" may both be true if the second refers to large datasets.

3. **Definitional resolution**: Are the claims using the same words differently? "Our system is fast" (meaning: 100ms response time) vs "Our system is not fast" (meaning: compared to competitor's 10ms) -- they agree on the facts but disagree on the label.

4. **Evidential resolution**: Which claim has stronger evidence? Apply source credibility scoring (see research-synthesizer skill) to determine which claim is better supported.

5. **Synthesis**: Both claims may be partially true. The resolution is a new claim that incorporates both perspectives with appropriate qualifications.

6. **Irreconcilable**: Genuinely opposing claims with equal evidence. Document as an open question. This is valuable -- it identifies areas where knowledge is uncertain.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
