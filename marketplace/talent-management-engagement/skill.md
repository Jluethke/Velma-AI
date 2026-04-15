# Talent Management Engagement

**One-line description:** A talent manager and their client each submit their real career goals, income expectations, and working relationship requirements before signing — AI aligns on a representation arrangement that advances the talent's career without the misaligned incentives that end most management relationships.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both manager and talent must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_talent_and_manager` (string, required): Talent name and management company/manager name.
- `shared_talent_category` (string, required): Entertainment, music, sports, influencer, author, speaker, or other category.

### Manager Submits Privately
- `manager_career_strategy` (object, required): How you see this talent's career developing — what opportunities to pursue, what to avoid, the 3-5 year arc.
- `manager_commission_and_fees` (object, required): Commission rate, what it applies to, expense reimbursement policy, sub-agent fees.
- `manager_services_provided` (object, required): What you actually do — booking, brand deals, press, legal referrals, business management — and what you do not do.
- `manager_concerns_about_this_client` (array, required): Career stage, coachability, competing relationships, financial instability, unrealistic expectations.
- `manager_what_they_will_not_do` (array, required): Deals below a certain threshold, categories you will not pursue, client behaviors you will not tolerate.

### Talent Submits Privately
- `talent_career_goals` (object, required): Where you want to be in 3-5 years — specific roles, income, brand, legacy, what success looks like to you.
- `talent_financial_requirements` (object, required): Minimum income you need, financial obligations, what you are willing to sacrifice for long-term positioning.
- `talent_current_relationships` (object, required): Existing agents, publicists, lawyers, business managers — who stays, who goes, how this manager fits.
- `talent_concerns_about_management` (array, required): Commission on deals you find yourself, manager prioritizing other clients, lack of transparency on opportunities.
- `talent_what_they_will_not_do` (array, required): Work you refuse — categories, brands, content, public exposure you will not accept.

## Outputs
- `career_strategy_alignment` (object): Where manager and talent agree on direction and where there are gaps.
- `commission_and_economics_disclosure` (object): Full economic picture — what the manager earns, what comes out of gross income.
- `services_and_responsibilities` (object): What the manager does and does not do, what the talent is responsible for.
- `relationship_structure` (object): How manager fits with other representatives — who does what.
- `term_and_termination_framework` (object): Contract length, notice period, post-termination commission tail.
- `management_agreement_framework` (object): Key terms for entertainment counsel review.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm manager's commission structure and talent's career goals and financial requirements both present.
**Output:** Readiness confirmation.
**Quality Gate:** Both parties' career strategy and economic terms present.

---

### Phase 1: Assess Career and Economic Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare manager's career strategy against talent's stated goals — are they compatible? 2. Assess economic reality — can this talent's current earning generate enough income for both parties? 3. Identify relationship conflicts — how does this manager fit with existing representation? 4. Assess concerns about working together.
**Output:** Strategy alignment, economic viability, relationship structure, concern map.
**Quality Gate:** Career strategy gaps are specific — "manager sees X, talent wants Y — resolution required before signing."

---

### Phase 2: Structure the Arrangement
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Define services and responsibilities — what the manager provides and does not provide. 2. Build the economic structure — commission rate, scope, expense policy. 3. Define how manager coordinates with other representatives. 4. Establish the career development plan — specific milestones and opportunities to pursue.
**Output:** Services definition, economic structure, representative coordination plan, career development milestones.
**Quality Gate:** Commission scope is specific — what deals it applies to, what categories are excluded, what happens with self-generated opportunities.

---

### Phase 3: Define Term and Exit
**Entry Criteria:** Structure built.
**Actions:** 1. Define the term — initial period, renewal, what triggers renegotiation. 2. Build termination provisions — notice period, post-termination commission tail, cause provisions. 3. Define what the manager retains after the relationship ends. 4. Assemble the management agreement framework.
**Output:** Term structure, termination provisions, post-term rights, agreement framework.
**Quality Gate:** Post-termination commission tail is a specific period for specific deal categories.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — strategy alignment, economics, services, representative structure, term and termination, agreement framework.
**Quality Gate:** Talent knows what they are paying and what they are getting. Manager knows the scope and the economics.

---

## Exit Criteria
Done when: (1) career strategy is aligned, (2) commission scope is fully defined, (3) services are specific, (4) representative coordination is clear, (5) term and post-term provisions are complete.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
