# Pros and Cons Analyzer

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Foundation pattern for balanced decision analysis. Takes a proposed action or decision, identifies arguments for and against, weights them by importance and reversibility, identifies hidden risks and overlooked benefits, and produces a recommendation with confidence level. Not just a list -- a structured framework that forces consideration of second-order effects. Fork this for: investment decisions, career moves, relocation decisions, business pivots, relationship decisions, technology adoption, etc.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Define the proposed action, gather context, identify stakeholders
REASON  --> Generate pros and cons, weight by importance, assess reversibility
PLAN    --> Synthesize into recommendation with confidence and conditions
ACT     --> Output weighted analysis, recommendation, and decision conditions
     \                                                              /
      +--- Hidden factor discovered --- loop OBSERVE ---------------+
```

## Inputs

- `proposed_action`: string -- The decision or action being evaluated ("Should I X?")
- `context`: string -- Relevant background: timeline, constraints, who is affected, what has been tried
- `stakeholders`: list[string] -- People or groups affected by this decision (optional but improves analysis)
- `risk_tolerance`: string -- "conservative" (minimize downside), "moderate" (balance risk/reward), "aggressive" (maximize upside)

## Outputs

- `pros`: list[object] -- Arguments in favor. Each: `{argument, importance (1-5), likelihood (0.0-1.0), timeframe ("short"|"medium"|"long")}`
- `cons`: list[object] -- Arguments against. Same structure as pros.
- `hidden_factors`: list[object] -- Non-obvious considerations: second-order effects, opportunity costs, precedent-setting implications
- `recommendation`: object -- `{action ("proceed"|"proceed_with_conditions"|"hold"|"reject"), confidence (0.0-1.0), rationale, conditions}`
- `reversibility_assessment`: object -- How easily this decision can be undone, and at what cost

---

## Execution

### OBSERVE: Frame the Decision

**Entry criteria:** A proposed action is stated.

**Actions:**
1. Restate the proposed action as a clear, evaluable statement. Transform vague framing ("Should I change jobs?") into specific framing ("Should I accept the offer from Company X at $Y salary, starting in Z weeks?"). The more specific, the better the analysis.
2. Identify the status quo alternative. Every "should I do X?" implicitly compares against "continue not doing X." Make the comparison explicit. The status quo has its own risks and costs -- not deciding is itself a decision.
3. Map stakeholders. Who benefits? Who is harmed? Who has veto power? Whose opinion matters most? Even personal decisions affect others.
4. Set the evaluation timeframe. Short-term (weeks), medium-term (months), long-term (years). Many decisions look different across timeframes -- a con in the short term may be a pro in the long term.

**Output:** Specific decision statement, status quo description, stakeholder map, evaluation timeframes.

**Quality gate:** Decision is specific enough to evaluate. Status quo is articulated. At least one timeframe is defined.

---

### REASON: Generate and Weight Arguments

**Entry criteria:** Decision is clearly framed with context.

**Actions:**
1. Generate pros. Brainstorm all arguments in favor. For each: state the argument, rate importance (1-5), estimate likelihood of materializing (0.0-1.0), and note the timeframe (short/medium/long). Aim for at least 5 pros. Push past the obvious ones.
2. Generate cons. Same process as pros. Aim for at least 5 cons. Force yourself to find cons even if the decision seems obvious -- the exercise itself is valuable. Ask: "What would a smart person who disagrees with this say?"
3. Compute weighted impact. For each pro and con: `weighted_impact = importance * likelihood`. This separates "important but unlikely" from "likely but trivial."
4. Identify hidden factors. Actively look for:
   - **Second-order effects**: If this works, what happens next? If it fails?
   - **Opportunity costs**: What can you NOT do if you choose this?
   - **Precedent**: Does this set a pattern you will be expected to repeat?
   - **Reversibility cost**: Can you undo this? At what price (money, time, relationships, reputation)?
   - **Asymmetric information**: What do you NOT know that could change the analysis?
5. Assess reversibility. Classify as: easily reversible (low switching cost), moderately reversible (significant but manageable cost), or irreversible (cannot undo). This should heavily influence the recommendation threshold.

**Output:** Weighted pros list, weighted cons list, hidden factors, reversibility classification.

**Quality gate:** At least 5 pros and 5 cons generated. Each has importance, likelihood, and timeframe. At least 2 hidden factors identified. Reversibility assessed.

---

### PLAN: Synthesize Recommendation

**Entry criteria:** Weighted pros, cons, and hidden factors are complete.

**Actions:**
1. Sum weighted impacts. Total pro impact vs. total con impact. The ratio gives a rough signal but should not be the sole basis for recommendation.
2. Apply risk tolerance filter. Conservative: weight cons 1.5x. Moderate: weight equally. Aggressive: weight pros 1.5x. This adjusts the recommendation to the user's stated risk appetite.
3. Check for dealbreakers. Any single con with importance = 5 and likelihood > 0.7 may be a dealbreaker regardless of the overall balance. Flag it.
4. Formulate recommendation. Four possible outputs:
   - **Proceed**: pros clearly outweigh cons, no dealbreakers, acceptable reversibility.
   - **Proceed with conditions**: pros outweigh cons, but specific conditions must be met first (risk mitigations, timing constraints, information gaps to close).
   - **Hold**: analysis is inconclusive, key information is missing, or timing is wrong. Specify what would change the recommendation.
   - **Reject**: cons clearly outweigh pros, dealbreakers present, or irreversible with insufficient upside.
5. Set confidence level. Based on: information completeness, sensitivity to assumptions, and reversibility. Low (0.0-0.3): too many unknowns. Medium (0.3-0.6): reasonable but uncertain. High (0.6-1.0): clear and well-supported.

**Output:** Recommendation with action, confidence, rationale, and conditions.

**Quality gate:** Recommendation action is one of the four options. Confidence is justified. If "proceed with conditions," conditions are specific and verifiable.

---

### ACT: Deliver Analysis

**Entry criteria:** Recommendation is formulated.

**Actions:**
1. Output pros ranked by weighted impact (highest first).
2. Output cons ranked by weighted impact (highest first).
3. Output hidden factors with explanations.
4. Output recommendation with confidence and rationale.
5. Output reversibility assessment.
6. Check for loop trigger: did the analysis reveal a factor that changes the framing of the original question? If so, note it but do not loop automatically.

**Output:** Complete analysis package.

**Quality gate:** Pros and cons are balanced in analytical rigor (not skewed to support a predetermined conclusion). Recommendation flows logically from the analysis.

## Exit Criteria

The skill is DONE when:
1. At least 5 pros and 5 cons are identified with weights
2. Hidden factors (second-order effects, opportunity costs) are surfaced
3. Reversibility is assessed
4. A recommendation with confidence level is stated
5. The analysis is balanced (not advocacy for a predetermined conclusion)

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Proposed action too vague to evaluate | **Escalate** -- ask for specifics (timeline, alternatives, stakes) |
| REASON | Cannot generate 5 cons (seems like an obvious decision) | **Adjust** -- steelman the opposition. Ask "under what conditions would this be wrong?" |
| REASON | Cannot generate 5 pros (seems like an obvious rejection) | **Adjust** -- steelman the proposal. Ask "what would need to be true for this to be right?" |
| PLAN | Pros and cons are exactly balanced | **Adjust** -- apply the "regret minimization" tiebreaker: which choice would you regret more at age 80? |
| PLAN | Critical information is missing | **Hold** -- recommend gathering specific information before deciding |

## State Persistence

Between runs, this skill accumulates:
- **Decision log**: past analyses with outcomes (when available) for calibration
- **Hidden factor library**: commonly overlooked factors per decision domain
- **Confidence calibration**: how often each confidence level matched actual outcomes

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
