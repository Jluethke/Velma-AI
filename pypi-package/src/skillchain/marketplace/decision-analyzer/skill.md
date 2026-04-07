# Decision Analyzer

Systematically analyze decisions by identifying options, scoring them against weighted criteria, assessing tradeoffs and risks, and producing a decision matrix with a recommended action and confidence level.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Identify the decision, gather options, define success criteria
REASON  --> Score each option against weighted criteria, identify tradeoffs
PLAN    --> Recommend top options with confidence levels, flag risks
ACT     --> Output decision matrix, tradeoff visualization, recommended action
     \                                                              /
      +--- New information or changed criteria --- loop OBSERVE ---+
```

## Inputs

- `decision_statement`: string -- The decision to be made, framed as a question ("Should we X or Y?")
- `options`: list[string] -- The available options (minimum 2). If not provided, OBSERVE phase generates them.
- `criteria`: list[object] -- Success criteria with optional weights. Each: `{name, weight (0-1), direction ("maximize"|"minimize")}`
- `constraints`: list[string] -- Hard constraints that eliminate options (budget caps, deadlines, regulatory requirements)
- `context`: string -- Background information, stakeholder concerns, organizational values
- `past_decisions`: list[object] -- Historical decisions and their outcomes for pattern matching (from accumulated state)

## Outputs

- `decision_matrix`: object -- Options x criteria scoring table with weighted totals
- `tradeoff_visualization`: object -- Pairwise tradeoff map showing what you gain/lose with each option
- `recommended_action`: object -- Top recommendation with confidence level (0-1), rationale, and conditions
- `risk_assessment`: object -- Per-option risk profile: probability, impact, mitigation, reversibility
- `decision_journal_entry`: object -- Structured record for future pattern recognition: decision, context, prediction, actual (to be filled later)

---

## Execution

### OBSERVE: Frame the Decision

**Entry criteria:** A decision statement or vague problem requiring a choice is provided.

**Actions:**

1. **Clarify the decision frame.** Restate the decision as a precise question. A well-framed decision has: a clear actor (who decides), a clear timeframe (by when), and measurable success criteria (how we know it worked). Bad frame: "What should we do about performance?" Good frame: "Should the platform team invest 2 sprints in caching (option A) or database indexing (option B) to reduce p95 latency below 200ms by Q3?"

2. **Generate options.** If options are not provided, brainstorm at least 3. Always include: (a) the status quo / do nothing option, (b) the obvious choice, (c) at least one creative alternative that reframes the problem. Watch for false dichotomies -- most "A or B" decisions have options C, D, E hiding in the framing.

3. **Define success criteria.** Extract from context and stakeholder concerns. Each criterion needs:
   - A name (e.g., "cost", "time-to-value", "risk")
   - A direction: maximize or minimize
   - A weight from 0.0 to 1.0 (weights must sum to 1.0 across all criteria)
   - A measurement method: how will we score options on this criterion?

4. **Apply hard constraints.** Eliminate any options that violate hard constraints before scoring. Document why each was eliminated. An eliminated option might still inform creative alternatives.

5. **Assess reversibility.** For each surviving option, classify:
   - **Type 1 (irreversible):** Cannot be undone. Mergers, public launches, architectural migrations. These deserve maximum analysis.
   - **Type 2 (reversible):** Can be undone at some cost. Feature flags, A/B tests, pilot programs. These deserve speed over analysis.
   - The reversibility classification should influence how much time you spend in REASON. Jeff Bezos's razor: Type 2 decisions should be made with ~70% of the information you wish you had.

**Output:** Decision frame document containing: precise question, list of viable options (constraints applied), weighted criteria, reversibility classification.

**Quality gate:** At least 2 viable options remain after constraints. Criteria weights sum to 1.0. Each option has a reversibility classification.

---

### REASON: Score and Analyze

**Entry criteria:** Decision frame is complete with options and weighted criteria.

**Actions:**

1. **Build the scoring matrix.** For each option x criterion pair, assign a score from 1-10. Scoring rules:
   - 1-2: Actively harmful on this criterion
   - 3-4: Below expectations
   - 5-6: Meets minimum requirements
   - 7-8: Strong performance
   - 9-10: Exceptional, best-in-class
   - Document the reasoning for each score in one sentence. Undocumented scores are useless.

2. **Compute weighted scores.** For each option: `weighted_total = SUM(score_i * weight_i)`. Normalize to 0-100 scale for readability.

3. **Sensitivity analysis.** Identify which criteria weights, if changed by +/- 20%, would change the top-ranked option. If the top option changes with small weight perturbations, the decision is sensitive and needs more scrutiny. Report: "This decision is robust/fragile to weight changes in [criterion]."

4. **Identify tradeoffs.** For each pair of top-scoring options, identify the tradeoff: "Option A beats Option B on [criteria X, Y] but loses on [criteria Z]. Choosing A means accepting [concrete consequence] in exchange for [concrete benefit]." Tradeoffs are not bugs -- they are the actual decision. A decision with no tradeoffs is not a real decision.

5. **Second-order effects analysis.** For each top option, ask: "If we choose this, what happens next? And what happens after that?" Map at least 2 levels deep:
   - First-order: Direct consequences of the choice
   - Second-order: Consequences of the consequences
   - Look for: feedback loops (positive or negative), unintended incentives, precedent-setting effects, optionality created or destroyed

6. **Pre-mortem.** For each top option, imagine it is 12 months later and the decision failed spectacularly. Write the story of how it failed. This surfaces risks that optimism bias hides. Key question: "What would have to be true for this to be the wrong choice?"

**Output:** Scored matrix with weighted totals, sensitivity analysis results, tradeoff map, second-order effects, pre-mortem narratives.

**Quality gate:** Every option-criterion pair has a documented score. Sensitivity analysis completed. At least one pre-mortem narrative per top-2 option. No score is assigned without a reasoning sentence.

---

### PLAN: Formulate Recommendation

**Entry criteria:** Scoring, tradeoffs, and risk analysis are complete.

**Actions:**

1. **Rank options by weighted total.** Report the ranking with scores and the gap between adjacent options. A 2-point gap on a 100-point scale is noise. A 15-point gap is signal.

2. **Assign confidence levels.** Based on:
   - Sensitivity analysis: fragile rankings reduce confidence
   - Information completeness: how much of the decision-relevant information do we actually have?
   - Reversibility: Type 2 decisions can have lower confidence thresholds
   - Confidence scale: 0.0-0.3 (low, need more info), 0.3-0.6 (moderate, acceptable for Type 2), 0.6-0.8 (high, acceptable for Type 1), 0.8-1.0 (very high, rare)

3. **Flag risks.** For the recommended option, enumerate:
   - **Probability** (low/medium/high) of each identified risk
   - **Impact** (low/medium/high) if the risk materializes
   - **Mitigation** strategy for each medium/high risk
   - **Monitoring** trigger: what early signal would indicate this risk is materializing?

4. **Define decision triggers.** Under what conditions should this decision be revisited? Examples: "If customer churn exceeds 5% in Q3", "If the new hire doesn't start by April", "If competitor launches feature X". Decisions without revisit triggers become permanent by inertia.

5. **Check for cognitive biases.** Scan the analysis for common decision traps:
   - **Anchoring**: Is the first option given undue weight?
   - **Sunk cost**: Are we favoring an option because of past investment?
   - **Confirmation bias**: Did we seek disconfirming evidence?
   - **Status quo bias**: Is "do nothing" being unfairly favored or unfairly dismissed?
   - **Availability bias**: Are recent dramatic events distorting risk assessment?

**Output:** Ranked recommendation with confidence, risk register, decision triggers, bias check.

**Quality gate:** Recommendation has a confidence level. At least 2 risks identified with mitigations. At least 1 decision trigger defined. Bias check completed.

---

### ACT: Deliver Decision Package

**Entry criteria:** Recommendation is formulated with confidence and risks.

**Actions:**

1. **Produce the decision matrix.** Format:
   ```
   Option        | Criterion A (w=0.3) | Criterion B (w=0.5) | Criterion C (w=0.2) | Weighted Total
   --------------|---------------------|---------------------|---------------------|---------------
   Option 1      | 8 (2.4)             | 6 (3.0)             | 7 (1.4)             | 68.0
   Option 2      | 5 (1.5)             | 9 (4.5)             | 4 (0.8)             | 68.0
   Do Nothing    | 3 (0.9)             | 3 (1.5)             | 9 (1.8)             | 42.0
   ```

2. **Produce tradeoff visualization.** For each pair of top options:
   ```
   Option 1 vs Option 2:
     Option 1 wins on: Criterion A (+3), Criterion C (+3)
     Option 2 wins on: Criterion B (+3)
     Net tradeoff: Choose 1 if A and C matter more than B in practice.
   ```

3. **Write the recommendation.** Structure:
   - One-sentence recommendation
   - Three-sentence rationale
   - Key risk to monitor
   - Revisit trigger

4. **Generate decision journal entry.** Record for future pattern matching:
   ```json
   {
     "decision": "precise question",
     "date": "ISO date",
     "options_considered": ["list"],
     "chosen": "option name",
     "confidence": 0.0-1.0,
     "key_criteria": ["what mattered most"],
     "predicted_outcome": "what we expect to happen",
     "revisit_trigger": "when to re-evaluate",
     "actual_outcome": null  // filled in later
   }
   ```

5. **Check for loop trigger.** Does the act of producing this recommendation reveal new information that changes the inputs? New options discovered during pre-mortem? Criteria that turned out to be unmeasurable? If yes, loop back to OBSERVE with the new information.

**Output:** Decision matrix, tradeoff visualization, recommendation statement, decision journal entry.

**Quality gate:** Matrix is internally consistent (weighted scores match totals). Recommendation confidence matches the analysis rigor. Journal entry is complete except `actual_outcome`.

## Exit Criteria

The skill is DONE when:
1. A decision matrix with weighted scores exists for all viable options
2. A recommendation with confidence level is stated
3. At least one pre-mortem has been conducted for the recommended option
4. A decision journal entry is generated for future pattern recognition
5. No new information emerged in ACT that requires another OBSERVE cycle

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Fewer than 2 options survive constraints | Adjust -- relax lowest-priority constraint and regenerate options |
| OBSERVE | Cannot define measurable criteria | Escalate -- ask decision-maker to clarify what "good" looks like |
| REASON | Two options score identically | Adjust -- add a tiebreaker criterion (speed of implementation, reversibility, team preference) |
| REASON | Scoring data unavailable for a criterion | Adjust -- use best estimate and flag confidence as reduced |
| PLAN | Confidence too low for any recommendation | Escalate -- report the analysis but flag that more information is needed before deciding |
| ACT | Loop detected (3+ cycles without convergence) | Abort -- deliver best-available analysis with explicit uncertainty disclaimer |

## State Persistence

- Decision journal (all past decisions with context, options considered, chosen option, confidence level, predicted outcome, and actual outcome when filled in later)
- Outcome tracking (retrospective accuracy -- when predictions are compared to actuals, calibration data accumulates)
- Criteria weight effectiveness (which criteria weightings correlated with good outcomes over time)
- Bias frequency log (which cognitive biases were flagged most often -- reveals systematic decision-making patterns)
- Framework performance (which decision frameworks produced the best outcomes for which types of decisions)
- Revisit trigger status (pending triggers and whether they have fired)

---

## Reference

### Decision Theory Foundations

**Multi-Criteria Decision Making (MCDM).** The scoring matrix approach is a simplified version of the Analytic Hierarchy Process (AHP). Full AHP uses pairwise comparison of criteria, but for most decisions, direct weight assignment is sufficient and faster. The key insight from MCDM: never evaluate options on a single criterion. Every real decision involves tradeoffs, and the matrix makes them explicit.

**Expected Value vs. Regret Minimization.** Two fundamental decision frameworks:
- *Expected value*: Choose the option with highest probability-weighted outcome. Best when you make many similar decisions (law of large numbers applies).
- *Regret minimization*: Choose the option you'd least regret at age 80. Best for one-shot, irreversible decisions where expected value can mislead.

For Type 1 decisions, lean toward regret minimization. For Type 2 decisions, lean toward expected value.

**The Eisenhower Matrix for Decision Urgency.**
- Urgent + Important: Decide now with available information
- Not Urgent + Important: Invest in thorough analysis (this skill's sweet spot)
- Urgent + Not Important: Apply simple heuristics, don't waste analysis time
- Not Urgent + Not Important: Don't decide at all -- defer or eliminate

### Cognitive Bias Checklist

| Bias | How It Distorts Decisions | Countermeasure |
|---|---|---|
| Anchoring | First number or option dominates | Score all options before comparing |
| Sunk Cost | Past investment distorts future choice | Ask: "If we hadn't invested anything, would we still choose this?" |
| Confirmation Bias | Seeking only supporting evidence | Assign someone to argue against the leading option |
| Status Quo Bias | Inertia favors doing nothing | Score "do nothing" like any other option |
| Availability Bias | Recent vivid events overweighted | Use base rates, not anecdotes |
| Overconfidence | Believing our estimates are precise | Always report ranges, not point estimates |
| Groupthink | Social pressure toward consensus | Collect scores independently before discussion |
| Loss Aversion | Losses loom larger than equivalent gains | Reframe losses as opportunity costs |

### Pre-Mortem Protocol

The pre-mortem (Klein, 2007) is the single most effective debiasing technique in decision-making research:

1. Assume the decision has been made and it failed
2. Set the failure 12 months in the future
3. Each participant independently writes the story of how it failed
4. Share stories and extract unique failure modes
5. For each failure mode: assess probability, define preventive action

Pre-mortems work because they give permission to voice concerns that would be suppressed by optimism pressure. They convert "what could go wrong?" (speculative) into "what did go wrong?" (narrative), which activates different cognitive processes and surfaces more specific risks.

### Reversibility Framework (Bezos Type 1/Type 2)

**Type 1 (One-Way Door):** Irreversible or nearly so. Examples: selling a business unit, choosing a database architecture for a 10-year system, making a public commitment. These decisions deserve: full ORPA cycle, multiple pre-mortems, sensitivity analysis, stakeholder review.

**Type 2 (Two-Way Door):** Reversible at reasonable cost. Examples: feature flags, pricing experiments, hiring contractors, choosing a library. These decisions deserve: rapid OBSERVE-REASON, skip pre-mortem, bias toward action. The cost of delay often exceeds the cost of a wrong choice.

**Decision speed heuristic:** If a decision is Type 2 and you have 70% of the information you want, decide now. The marginal value of additional information decays exponentially while the cost of delay is linear.

### Decision Journal Template

The decision journal is the long-term learning mechanism. After enough decisions are journaled with both predictions and outcomes, patterns emerge:
- Which criteria do you consistently overweight or underweight?
- What types of decisions do you make well vs. poorly?
- What is your calibration curve? (When you say 80% confident, are you right 80% of the time?)

Minimum journal fields: decision, date, options, chosen option, confidence, predicted outcome, revisit trigger, actual outcome (filled later), retrospective notes (filled later).

### Weighted Scoring Best Practices

- **Never use equal weights.** If all criteria are equally important, you haven't thought hard enough about what matters.
- **Weights should be set BEFORE scoring options.** Setting weights after seeing scores is a recipe for rationalization.
- **Use an odd number of scale points (1-5 or 1-7).** This creates a natural midpoint. Using 1-10 feels precise but introduces false precision.
- **Calibrate scores across options.** Score the same criterion for ALL options before moving to the next criterion. This prevents the halo effect (one strong option getting inflated scores across all criteria).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
