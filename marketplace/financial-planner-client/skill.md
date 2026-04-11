# Financial Planner Client Engagement

**One-line description:** A financial planner and a client each submit their real financial situation, goals, and fears before the engagement begins — Claude aligns on a financial plan that addresses what the client actually needs, not a generic portfolio allocation delivered to someone who hasn't told the advisor the whole story.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both planner and client must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_planner_and_client` (string, required): Financial planner/firm name and client name(s).
- `shared_planning_scope` (string, required): Comprehensive financial planning, retirement, estate, college funding, insurance, or specific concern.

### Financial Planner Submits Privately
- `planner_initial_assessment` (object, required): Your read on this client's financial situation — wealth stage, key gaps, what they most need to address.
- `planner_service_and_fee_structure` (object, required): Fee model — AUM, flat fee, hourly, retainer — what is included, what triggers additional fees, full disclosure.
- `planner_fiduciary_and_product_position` (object, required): Fiduciary status, whether you sell products, compensation from product sales, how conflicts are managed.
- `planner_concerns_about_this_client` (array, required): Complexity, debt situation, family dynamics, prior advisor problems, behavioral patterns that undermine financial plans.
- `planner_what_they_cannot_help_with` (array, required): Areas outside your expertise or services — tax preparation, legal drafting, specific investment categories.

### Client Submits Privately
- `client_real_financial_picture` (object, required): Full financial situation including what you have not disclosed — debt, past mistakes, financial dependents, business interests, inheritance.
- `client_financial_goals` (object, required): What you want — retirement, paying for college, buying property, business sale, financial security, what "enough" looks like to you.
- `client_financial_fears` (object, required): What you are most afraid of — running out of money, market crash, divorce, disability, the financial mistake you keep replaying.
- `client_past_advisor_experiences` (array, required): What prior advisors got wrong, why you changed, what you do not want to repeat.
- `client_financial_behaviors` (object, required): How you actually behave with money — spending, saving, risk tolerance when markets fall, whether you follow financial plans or abandon them.

## Outputs
- `financial_situation_assessment` (object): Where the client actually stands — net worth, cash flow, gaps, and what needs immediate attention.
- `planning_priorities` (object): The three to five financial issues that will most impact this client's financial future, prioritized.
- `fee_and_compensation_disclosure` (object): Full disclosure — how the planner is compensated, conflicts of interest, fiduciary status.
- `planning_engagement_structure` (object): What the planning engagement includes, timeline, deliverables, review cadence.
- `behavioral_and_implementation_plan` (object): How this specific client's behavioral patterns are accounted for — what ensures the plan gets implemented.
- `engagement_agreement_framework` (object): Key terms for the advisory agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm planner's fee structure and client's full financial picture and goals both present.
**Output:** Readiness confirmation.
**Quality Gate:** Planner's fee and compensation structure and client's real financial situation both present.

---

### Phase 1: Assess Financial Situation and Fit
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate the full financial picture including undisclosed items. 2. Prioritize planning needs against what this planner can provide. 3. Assess behavioral patterns against plan viability. 4. Identify conflicts of interest.
**Output:** Financial assessment, planning priorities, behavioral risk, conflict assessment.
**Quality Gate:** Every conflict of interest is named specifically — not "potential conflicts exist" but named conflicts and how they are managed.

---

### Phase 2: Define the Planning Engagement
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the scope of planning work — areas covered, deliverables, timeline. 2. Build the fee and compensation disclosure. 3. Establish the review cadence and ongoing service model. 4. Define behavioral safeguards — how the plan accounts for this client's patterns.
**Output:** Planning scope, fee disclosure, service model, behavioral plan.
**Quality Gate:** Fee disclosure is complete — AUM fee, flat fee, any product commissions — in writing.

---

### Phase 3: Define Implementation and Governance
**Entry Criteria:** Engagement defined.
**Actions:** 1. Define the implementation plan — what happens first, timeline, accountabilities. 2. Build the performance and progress review process. 3. Define what triggers plan revision — life events, market conditions, goal changes. 4. Assemble the advisory agreement framework.
**Output:** Implementation plan, review process, revision triggers, agreement framework.
**Quality Gate:** Implementation plan assigns specific actions to specific people with specific deadlines.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — financial assessment, planning priorities, fee disclosure, engagement structure, behavioral plan, implementation plan, agreement framework.
**Quality Gate:** Client understands what they are paying, what conflicts exist, and what the plan requires of them. Planner knows the full financial picture and behavioral profile.

---

## Exit Criteria
Done when: (1) financial priorities are ranked, (2) fee and compensation are fully disclosed, (3) planning scope is defined, (4) behavioral safeguards are built in, (5) implementation plan is specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
