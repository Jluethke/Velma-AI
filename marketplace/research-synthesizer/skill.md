# Research Synthesizer

Conduct structured research through five sequential phases: scope the question, gather from multiple sources, analyze claims and credibility, synthesize findings into a coherent narrative, and deliver a tiered report with confidence levels and identified gaps.

## Execution Pattern: Phase Pipeline

```
PHASE 1: SCOPE      --> Define research question, identify source types, set depth
PHASE 2: GATHER     --> Collect from multiple sources (docs, web, APIs, databases)
PHASE 3: ANALYZE    --> Extract key claims, assess credibility, identify consensus vs debate
PHASE 4: SYNTHESIZE --> Merge findings into coherent narrative, resolve contradictions
PHASE 5: DELIVER    --> Executive summary + detailed findings + confidence levels + gaps
```

## Inputs

- `research_question`: string -- The question to answer. Should be specific enough to be answerable but broad enough to be interesting. Bad: "Tell me about databases." Good: "What are the tradeoffs between PostgreSQL and DynamoDB for a write-heavy event sourcing system processing 50K events/sec?"
- `source_types`: list[string] -- Which source types to consult: "documentation", "academic", "web", "api", "database", "codebase", "expert_opinion"
- `depth_level`: string -- "survey" (breadth, 2-3 sources per sub-topic), "review" (moderate depth, 5-10 sources), "deep_dive" (exhaustive, 10+ sources with cross-referencing)
- `existing_knowledge`: string -- What the requester already knows, to avoid restating the obvious
- `constraints`: object -- Time budget, source restrictions, recency requirements (e.g., "only sources from 2024+")

## Outputs

- `executive_summary`: string -- 3-5 sentence answer to the research question, suitable for a busy decision-maker
- `detailed_findings`: list[object] -- Each finding: `{claim, evidence, sources, confidence, counter_evidence}`
- `source_credibility_scores`: list[object] -- Each source: `{source_id, type, credibility_score (0-1), reasoning}`
- `confidence_levels`: object -- Overall confidence and per-finding confidence with calibration notes
- `knowledge_gaps`: list[string] -- Questions the research could not answer, areas needing more investigation
- `contradiction_report`: list[object] -- Pairs of findings that conflict, with conflict scores and resolution status

---

## Execution

### Phase 1: SCOPE -- Define the Research Boundaries

**Entry criteria:** A research question is provided.

**Actions:**

1. **Parse the research question.** Decompose into:
   - **Core question**: The primary thing to answer
   - **Sub-questions**: Component questions that, answered together, answer the core
   - **Out-of-scope**: Explicitly define what this research will NOT cover
   - **Success criteria**: What would a satisfying answer look like?

2. **Classify the question type.** Different question types require different research strategies:
   - **Factual**: Has a definitive answer ("What is X?") -- prioritize authoritative sources
   - **Comparative**: Evaluating alternatives ("X vs Y") -- prioritize balanced sources, require evidence for both sides
   - **Causal**: Understanding mechanisms ("Why does X happen?") -- prioritize empirical evidence, beware correlation/causation
   - **Predictive**: Forecasting ("Will X work for Y?") -- prioritize analogous cases, track record of predictors
   - **Normative**: Value judgment ("Should we X?") -- separate facts from values, present multiple frameworks

3. **Set depth parameters.** Based on `depth_level`:
   - Survey: 2-3 sources per sub-question, surface-level extraction, 30-60 min equivalent effort
   - Review: 5-10 sources per sub-question, claim-level extraction, 2-4 hour equivalent
   - Deep dive: 10+ sources, systematic extraction, contradiction analysis, 8+ hour equivalent

4. **Identify source strategy.** For each sub-question, determine which source types are most likely to have answers. Prioritize:
   - Primary sources > secondary sources > tertiary sources
   - Empirical evidence > expert opinion > anecdote
   - Recent sources > older sources (with domain-specific exceptions)

**Output:** Research plan: core question, sub-questions, scope boundaries, source strategy per sub-question, depth parameters.

**Quality gate:** At least 2 sub-questions identified. Scope boundaries explicitly stated. Source strategy maps to available source types.

---

### Phase 2: GATHER -- Collect Information

**Entry criteria:** Research plan with sub-questions and source strategy is complete.

**Actions:**

1. **Execute source strategy.** For each sub-question, collect from planned source types:
   - **Documentation**: Official docs, READMEs, changelogs, API references
   - **Academic**: Papers, surveys, meta-analyses (prefer systematic reviews)
   - **Web**: Blog posts, forum discussions, conference talks (assess credibility carefully)
   - **API**: Live data queries, benchmarks, current-state checks
   - **Database**: Historical records, logs, metrics
   - **Codebase**: Actual implementations, test suites, commit history
   - **Expert opinion**: Interviews, keynotes, published opinions from domain authorities

2. **Extract claims.** From each source, extract discrete claims. A claim is a single assertable statement:
   - Bad: "PostgreSQL is great for most workloads" (vague, not testable)
   - Good: "PostgreSQL handles up to 10K TPS on a single node with proper indexing (source: Percona benchmark, 2024)"
   - Each claim: `{statement, source, date, type (fact/opinion/estimate), context}`

3. **Assess source credibility.** For each source, score on 0-1 scale:
   - **Authority (0.3 weight)**: Is the source an expert in this domain? Published, cited, experienced?
   - **Evidence quality (0.3 weight)**: Does the source present data, benchmarks, experiments, or just opinions?
   - **Recency (0.2 weight)**: How current is the information? Domain-specific decay: tech (2 years), science (5 years), history (50 years)
   - **Independence (0.2 weight)**: Does the source have a conflict of interest? Vendor benchmarks score lower than independent benchmarks.
   - Formula: `credibility = 0.3*authority + 0.3*evidence + 0.2*recency + 0.2*independence`

4. **Track provenance.** Every claim must link to its source. Unattributed claims are noise. If the same claim appears in multiple sources, record all sources (convergence is a signal of reliability).

**Output:** Claim database: list of extracted claims with source links, credibility scores, and types.

**Quality gate:** Minimum claims per sub-question met (survey: 3, review: 8, deep dive: 15). Every claim has at least one source. Every source has a credibility score.

---

### Phase 3: ANALYZE -- Evaluate and Cross-Reference

**Entry criteria:** Claim database is populated with credibility-scored sources.

**Actions:**

1. **Cluster claims by sub-question.** Group related claims. Identify:
   - **Consensus claims**: Multiple independent sources agree. High confidence.
   - **Contested claims**: Sources disagree. Needs further analysis.
   - **Singleton claims**: Only one source. Flag for verification.

   - For each pair of claims within the same sub-question cluster:
     - Compute **keyword overlap** (Jaccard similarity): `|words_a AND words_b| / |words_a OR words_b|`
     - If similarity >= 0.4 (claims discuss the same topic):
       - Check for **negation markers**: "not", "never", "no", "incorrect", "wrong", "false", "invalid", "unlike", "opposite", "contrary", "avoid", "don't", "doesn't", "shouldn't", "can't", "cannot", "instead", "rather"
       - Check for **antonym pairs**: (increase/decrease), (positive/negative), (always/never), (high/low), (strong/weak), (safe/dangerous), (correct/incorrect), (true/false), (success/failure), (rising/falling), (above/below)
       - **Asymmetric negation score**: If one claim has negation markers and the other doesn't: `negation_score = count(exclusive_negations) / max(count(overlap), 1)`
       - **Antonym score**: +0.3 for each antonym pair found across the two claims
       - **Conflict score** = `similarity * (negation_score + antonym_score)`
       - Flag if conflict score >= 0.25

3. **Weight claims by source credibility.** A claim from a 0.9-credibility source outweighs a contradicting claim from a 0.3-credibility source. When contradictions exist, the credibility-weighted consensus wins, but the dissenting view must be reported.

4. **Identify knowledge gaps.** For each sub-question, check:
   - Are there sub-questions with zero or very few claims? (Gap)
   - Are there contested claims where no credible source tips the balance? (Unresolved)
   - Are there claims that depend on assumptions that haven't been validated? (Assumption risk)

**Output:** Analyzed claim clusters with consensus/contested/singleton labels, contradiction report with conflict scores, knowledge gap inventory.

**Quality gate:** Every sub-question has a consensus/contested/gap classification. All contradictions with conflict score >= 0.25 are documented. Knowledge gaps are explicitly listed.

---

### Phase 4: SYNTHESIZE -- Build the Narrative

**Entry criteria:** Claims are analyzed, contradictions identified, gaps documented.

**Actions:**

1. **Resolve contradictions.** For each flagged contradiction:
   - **Credibility resolution**: If one side has significantly higher credibility-weighted support, adopt it and note the dissent
   - **Context resolution**: Often contradictions dissolve when context is added ("X is true for small datasets, Y is true for large datasets")
   - **Temporal resolution**: Newer evidence may supersede older evidence if the domain has changed
   - **Irreconcilable**: If genuinely unresolvable, present both views with their evidence and let the reader decide
   - Mark each contradiction as: resolved-by-evidence, resolved-by-context, resolved-by-recency, or unresolved

2. **Build the narrative arc.** Structure findings to answer the core question:
   - Start with the strongest, highest-confidence findings
   - Layer in nuance from contested areas
   - Acknowledge gaps and their implications
   - End with practical implications

3. **Calibrate confidence.** For each finding and for the overall answer:
   - **High confidence (0.8-1.0)**: Multiple independent high-credibility sources agree, no credible dissent
   - **Moderate confidence (0.5-0.8)**: Good evidence with some caveats, minor dissent from lower-credibility sources
   - **Low confidence (0.2-0.5)**: Limited evidence, significant contested areas, relies on extrapolation
   - **Speculative (0.0-0.2)**: Insufficient evidence, mostly expert opinion or analogical reasoning
   - Confidence calibration check: are you more confident than your evidence warrants? Reduce by 10% as a default pessimism adjustment.

4. **Connect to existing knowledge.** Reference what the requester already knows (from `existing_knowledge` input) to avoid redundancy and build on their mental model.

**Output:** Synthesized narrative answering the core question, confidence-calibrated findings, resolved/unresolved contradiction status.

**Quality gate:** Core question has a direct answer (even if hedged). Every finding has a confidence level. All contradictions have a resolution status. Narrative is coherent (findings don't contradict each other unless explicitly flagged as unresolved).

---

### Phase 5: DELIVER -- Format the Report

**Entry criteria:** Synthesis is complete with calibrated findings.

**Actions:**

1. **Write the executive summary.** 3-5 sentences that directly answer the research question. Include: the answer, the confidence level, the most important caveat. This should stand alone -- a reader who reads only the summary should have a correct (if incomplete) understanding.

2. **Format detailed findings.** For each finding:
   ```
   FINDING: [claim statement]
   CONFIDENCE: [high/moderate/low/speculative] ([0.0-1.0])
   EVIDENCE: [supporting evidence summary]
   SOURCES: [source list with credibility scores]
   COUNTER-EVIDENCE: [dissenting views, if any]
   ```

3. **Compile source bibliography.** All sources used, with credibility scores and contribution summary. Enables the reader to verify and go deeper.

4. **Document knowledge gaps.** For each gap:
   - What question remains unanswered
   - Why (no sources, conflicting sources, outside scope)
   - Suggested next steps to fill the gap

5. **Generate contradiction report.** List all contradictions found with:
   - The conflicting claims
   - Conflict score
   - Resolution status and method
   - Remaining uncertainty

6. **Update accumulated state.** If this is a recurring research topic, merge new findings into the knowledge graph:
   - New claims added with timestamps
   - Changed confidence levels flagged
   - Previously unknown gaps filled
   - New contradictions surfaced

**Output:** Complete research report: executive summary, detailed findings, source bibliography, knowledge gaps, contradiction report.

**Quality gate:** Executive summary answers the core question. Every finding has confidence. Source list is complete. Gaps are actionable (reader knows what to do next).

## Exit Criteria

The skill is DONE when:
1. The core research question has a direct answer with a calibrated confidence level
2. All sub-questions have findings or are explicitly flagged as gaps
3. All contradictions are documented with resolution status
4. Sources are credibility-scored and cited
5. The executive summary can stand alone as a useful answer

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| SCOPE | Research question is too vague to decompose | Adjust -- generate clarifying questions, propose a more specific framing |
| GATHER | Insufficient sources for a sub-question | Adjust -- broaden source types, relax recency constraints, flag as gap |
| GATHER | All sources have low credibility | Abort for that sub-question -- report as gap with note on source quality |
| ANALYZE | Too many contradictions to resolve (>50% of claims contested) | Escalate -- report the contested landscape rather than forcing a synthesis |
| SYNTHESIZE | Cannot form coherent narrative (findings are disconnected) | Adjust -- reframe sub-questions to find connecting threads, or deliver findings as a structured list rather than narrative |
| DELIVER | Confidence is speculative across all findings | Adjust -- explicitly label the report as preliminary/exploratory, recommend specific follow-up research |
| DELIVER | User rejects final output | **Targeted revision** -- ask which sub-question synthesis, source assessment, or conclusion fell short and rerun only that section. Do not regenerate the full research synthesis. |

## State Persistence

- Source library (all sources encountered with credibility scores, domain tags, and last-accessed dates)
- Claim knowledge graph (accumulated claims as nodes with supports/contradicts/supersedes edges and confidence decay over time)
- Synthesis history (past research questions, findings, and confidence levels -- enables building on prior work)
- Citation graph (which sources cite each other -- reveals authority clusters and intellectual lineages)
- Confidence calibration data (predicted confidence vs actual accuracy when outcomes are known -- improves calibration over time)
- Knowledge gap registry (unresolved questions carried forward for future research cycles)

---

## Reference

### Source Credibility Scoring Framework

Source credibility is the foundation of research quality. A synthesis is only as good as its weakest unchallenged source.

**Authority Indicators (weight 0.3):**
- Published in peer-reviewed venue: +0.3
- Author has 10+ years domain experience: +0.2
- Author is affiliated with reputable institution: +0.2
- Author has track record of accurate claims: +0.2
- Self-published with no credentials: +0.05
- Anonymous source: +0.0

**Evidence Quality Indicators (weight 0.3):**
- Controlled experiment with statistical significance: +0.3
- Systematic benchmark with methodology described: +0.25
- Case study with measurable outcomes: +0.2
- Observational data with caveats noted: +0.15
- Anecdote or personal experience: +0.05
- Unsupported assertion: +0.0

**Recency Indicators (weight 0.2):**
- Within domain-specific relevance window: +0.2
- 1-2x the relevance window: +0.1
- Older than 2x the relevance window: +0.05
- Domain relevance windows: technology (2 years), business (3 years), science (5 years), mathematics (50 years), history (100 years)

**Independence Indicators (weight 0.2):**
- No financial or reputational stake in the claim: +0.2
- Minor conflict of interest disclosed: +0.1
- Vendor promoting own product: +0.05
- Undisclosed conflict of interest: +0.0



```python
NEGATION_MARKERS = {
    "not", "never", "no", "neither", "nor",
    "incorrect", "wrong", "false", "invalid",
    "unlike", "opposite", "contrary",
    "avoid", "don't", "doesn't", "shouldn't", "can't", "cannot",
    "instead", "rather",
}

ANTONYM_PAIRS = {
    ("increase", "decrease"), ("positive", "negative"),
    ("bullish", "bearish"), ("always", "never"),
    ("buy", "sell"), ("long", "short"),
    ("high", "low"), ("strong", "weak"),
    ("safe", "dangerous"), ("correct", "incorrect"),
    ("true", "false"), ("success", "failure"),
    ("rising", "falling"), ("above", "below"),
}

def detect_contradiction(claim_a: str, claim_b: str) -> float:
    words_a = set(claim_a.lower().split())
    words_b = set(claim_b.lower().split())

    overlap = words_a & words_b
    union = words_a | words_b
    similarity = len(overlap) / len(union) if union else 0.0

    if similarity < 0.4:
        return 0.0  # Not discussing the same topic

    # Asymmetric negation
    neg_a = words_a & NEGATION_MARKERS
    neg_b = words_b & NEGATION_MARKERS
    negation_score = 0.0
    if (neg_a and not neg_b) or (neg_b and not neg_a):
        negation_score = len(neg_a ^ neg_b) / max(len(overlap), 1)

    # Antonym pairs
    antonym_score = 0.0
    for word_a, word_b in ANTONYM_PAIRS:
        if ((word_a in words_a and word_b in words_b) or
                (word_b in words_a and word_a in words_b)):
            antonym_score += 0.3

    return similarity * (negation_score + antonym_score)
    # Flag if >= 0.25
```

### Confidence Calibration

Most people are overconfident. Research on calibration (Tetlock, 2005) shows that when experts say they are 90% confident, they are right about 70% of the time. To improve calibration:

1. **Use ranges, not points.** Instead of "the answer is X," say "the answer is between X and Y with 80% confidence."
2. **Track your calibration over time.** After 50+ predictions with confidence levels, plot your calibration curve. Adjust.
3. **Apply the 10% pessimism adjustment.** Whatever confidence you initially assign, subtract 10%. This simple correction significantly improves calibration for most people.
4. **Reference classes.** Instead of estimating from scratch, ask "what is the base rate for this type of claim being true?"

### Knowledge Graph Accumulation

Across sessions, the research synthesizer builds a knowledge graph:
- **Nodes**: Claims (with confidence, sources, timestamps)
- **Edges**: Supports, contradicts, refines, supersedes
- **Decay**: Confidence decays over time for technology claims (half-life: 2 years)
- **Reinforcement**: Claims confirmed by new research get confidence boosts
- **Contradiction tracking**: Unresolved contradictions persist until new evidence tips the balance

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
