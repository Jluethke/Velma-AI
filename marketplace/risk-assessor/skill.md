# Risk Assessor

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Foundation pattern for identifying and scoring risks in any plan, project, or decision. Takes a plan description, produces a risk register with: risk description, likelihood (1-5), impact (1-5), risk score (L x I), mitigation strategy, owner, and monitoring trigger. Includes both obvious and hidden risks. Fork this for: project risk management, investment risk, travel safety, health risk, business continuity.

## Execution Pattern: ORPA Loop

```
OBSERVE  --> Read the plan and identify all risk surfaces
REASON   --> Score each risk by likelihood and impact
PLAN     --> Design mitigation strategies and assign owners
ACT      --> Produce the risk register and monitoring plan
LOOP     --> Re-assess when plan changes or risks materialize
```

## Inputs

- `plan_description`: string -- The plan, project, or decision to assess for risks.
- `plan_type`: string (optional) -- Category: "project", "investment", "decision", "launch", "travel", "health", "operational" (default: inferred).
- `stakeholders`: string[] (optional) -- People or teams who own or are affected by the plan.
- `time_horizon`: string (optional) -- How far out to assess risks (e.g., "2 weeks", "6 months", "3 years").
- `risk_appetite`: string (optional) -- "conservative" (avoid all risk), "moderate" (accept calculated risk), "aggressive" (accept high risk for high reward). Default: "moderate".
- `known_risks`: string[] (optional) -- Risks the user has already identified, to avoid duplication.

## Outputs

- `risk_register`: object[] -- Complete list of risks with all scoring and mitigation fields.
- `risk_matrix`: object -- 5x5 likelihood vs. impact grid showing where risks cluster.
- `top_risks`: object[] -- The 3-5 highest-scoring risks with detailed mitigation plans.
- `monitoring_plan`: object[] -- Triggers and check-in schedule for ongoing risk monitoring.
- `hidden_risks`: string[] -- Non-obvious risks that are easy to overlook.

---

## Execution

### OBSERVE -- Identify Risk Surfaces

**Actions:**

1. Read the plan description and identify every assumption it makes. An assumption is something that must be true for the plan to work but is not guaranteed. Each assumption is a candidate risk if it fails.
2. Scan for risks across 7 categories:
   - **Technical**: technology fails, integrations break, performance degrades.
   - **Resource**: people leave, budget cut, time runs out, skills gap.
   - **External**: market shifts, regulation changes, competitor moves, supply chain disruption.
   - **Operational**: process breaks, communication fails, handoff drops.
   - **Financial**: costs exceed estimates, revenue falls short, cash flow timing.
   - **Reputational**: public perception, trust damage, media exposure.
   - **Legal/Compliance**: regulatory violation, contract breach, IP infringement.
3. For each risk category, generate at least 2 candidate risks specific to this plan. Use the "pre-mortem" technique: imagine the plan has failed — what went wrong?
4. Add known_risks to the list (avoid duplication).
5. Identify hidden risks: second-order effects, risks that emerge only when two other things go wrong simultaneously, risks everyone assumes someone else is handling.

**Output:** Candidate risk list organized by category, with hidden risks flagged separately.

**Quality gate:** At least 10 candidate risks identified. At least 5 of 7 categories are represented. At least 2 hidden risks are identified that were not in known_risks.

---

### REASON -- Score Each Risk

**Actions:**

1. For each candidate risk, score **likelihood** (1-5):
   - 1: Rare — less than 5% chance
   - 2: Unlikely — 5-20% chance
   - 3: Possible — 20-50% chance
   - 4: Likely — 50-80% chance
   - 5: Almost certain — greater than 80% chance

2. For each candidate risk, score **impact** (1-5):
   - 1: Negligible — minor inconvenience, easily absorbed
   - 2: Minor — noticeable but manageable with existing resources
   - 3: Moderate — requires plan adjustment, delays, or additional resources
   - 4: Major — significant damage to timeline, budget, or objectives
   - 5: Catastrophic — plan failure, existential threat, irrecoverable

3. Calculate **risk score** = likelihood x impact. Maximum 25.
4. Classify risk level: Low (1-4), Medium (5-9), High (10-15), Critical (16-25).
5. Build the risk matrix: plot all risks on a 5x5 grid. Identify clusters — multiple risks in the same cell indicate a systemic vulnerability.
6. Filter by risk_appetite: conservative = escalate anything Medium+, moderate = escalate High+, aggressive = escalate Critical only.

**Output:** Scored risk list with levels, risk matrix, escalation recommendations.

**Quality gate:** Every risk has both a likelihood and impact score with justification (not just a number). Risk levels are calculated correctly. The matrix is populated.

---

### PLAN -- Design Mitigations

**Actions:**

1. For each risk scoring High or Critical, design a mitigation strategy using one of four approaches:
   - **Avoid**: change the plan to eliminate the risk entirely.
   - **Reduce**: take action to lower the likelihood or impact.
   - **Transfer**: shift the risk to another party (insurance, outsourcing, contracts).
   - **Accept**: consciously decide to bear the risk (only for low-impact or low-likelihood risks after applying risk_appetite).

2. For each mitigation, specify:
   - **Action**: what specifically to do.
   - **Owner**: who is responsible for executing the mitigation.
   - **Deadline**: when the mitigation must be in place.
   - **Cost**: what the mitigation costs (time, money, complexity).
   - **Residual risk**: after mitigation, what is the new likelihood x impact score?

3. For Medium risks, provide a brief mitigation recommendation (1-2 sentences) without full detail.
4. For Low risks, note them as accepted and document why.
5. Design monitoring triggers for the top 5 risks: what observable event signals that the risk is materializing? (e.g., "if sprint velocity drops below 70% for 2 consecutive sprints, the resource risk is materializing").

**Output:** Mitigation strategies for all High/Critical risks, brief recommendations for Medium, acceptance notes for Low, monitoring triggers for top 5.

**Quality gate:** Every High/Critical risk has a mitigation with owner and deadline. Residual risk scores are lower than original scores. Monitoring triggers are observable events, not vague "keep an eye on it."

---

### ACT -- Produce the Register

**Actions:**

1. Assemble the risk register as a table with columns: ID, Risk Description, Category, Likelihood (1-5), Impact (1-5), Score (L x I), Level, Mitigation Strategy, Owner, Monitoring Trigger, Residual Score.
2. Sort by risk score descending (highest risks first).
3. Produce the top risks summary: the 3-5 highest-scoring risks with full mitigation detail, written in plain language suitable for stakeholder communication.
4. Produce the monitoring plan: a schedule of risk check-ins (weekly for Critical, biweekly for High, monthly for Medium) with what to look for at each check-in.
5. List all hidden risks with a recommendation to investigate each one further.

**Output:** Complete risk register, top risks summary, monitoring plan, hidden risks list.

**Quality gate:** Risk register has at least 10 entries. Top risks summary is under 300 words. Monitoring plan has specific check-in dates or frequencies. Every risk has an owner (even if "TBD").

---

## Exit Criteria

The skill is DONE when:
- At least 10 risks are identified across at least 5 categories
- Every risk is scored with likelihood, impact, and calculated risk score
- High and Critical risks have mitigation strategies with owners
- A monitoring plan with observable triggers exists for the top 5 risks
- Hidden risks are identified and documented
- The risk register is sorted and formatted for stakeholder review

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Plan description is a single sentence with no detail | **Adjust** -- ask clarifying questions about scope, timeline, resources, and dependencies before proceeding |
| OBSERVE | Fewer than 10 risks identified | **Retry** -- apply the pre-mortem technique more aggressively, check each of the 7 categories again |
| REASON | All risks score Low (1-4) | **Adjust** -- re-examine assumptions; either the plan is genuinely low-risk or the scoring is too optimistic. Flag for review. |
| PLAN | No stakeholders provided to assign as owners | **Adjust** -- assign ownership by role ("project lead", "finance team") rather than by name |
| ACT | Risk register exceeds 30 entries | **Adjust** -- merge similar risks and focus detail on the top 15. List the remainder as a watch list. |
| ACT | User rejects final output | **Targeted revision** -- ask which risk's scoring, mitigation strategy, or monitoring trigger fell short and rerun only that risk's REASON-PLAN phases. Do not reassess all risks. |

---

## Reference

### Risk Score Matrix

| Score | Level | Response |
|---|---|---|
| 1-4 | Low | Accept; document rationale |
| 5-9 | Medium | Brief mitigation recommendation |
| 10-15 | High | Full mitigation plan with owner + deadline |
| 16-25 | Critical | Immediate escalation; plan may need redesign |

### Risk Appetite Escalation Thresholds

| Appetite | Escalate at Score... |
|---|---|
| Conservative | 5+ (Medium and above) |
| Moderate | 10+ (High and above) |
| Aggressive | 16+ (Critical only) |

### Mitigation Strategy Types

| Type | When to Use |
|---|---|
| Avoid | Change the plan to eliminate the risk entirely |
| Reduce | Lower likelihood (better testing) or impact (backup plan) |
| Transfer | Insurance, outsourcing, contracts, SLAs |
| Accept | Conscious decision after applying risk appetite; Low risks |

### Seven Risk Categories Checklist

- Technical: technology failure, integration issues, performance
- Resource: people, budget, time, skills
- External: market, regulation, competitors, supply chain
- Operational: process, communication, handoffs
- Financial: cost overruns, revenue shortfalls, cash flow
- Reputational: public perception, trust, media
- Legal/Compliance: regulation, contracts, IP

### Monitoring Trigger Formula

"If [observable leading indicator] occurs [frequency/threshold], the [risk name] risk is materializing and [response action] must begin within [timeframe]."

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
