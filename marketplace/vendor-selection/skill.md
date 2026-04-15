# Vendor Selection

**One-line description:** Buyer submits real requirements and budget; vendor submits real capabilities and constraints — AI scores the fit, surfaces the gaps, and builds the decision meeting agenda.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both buyer and vendor must submit before synthesis runs. Neither sees the other's input until the synthesis is shared.

---

## Inputs

### Shared (visible to both before submitting)
- `shared_product_service_category` (string, required): What category is this? e.g., "CRM software," "Marketing agency," "IT managed services."
- `shared_deal_size_range` (string, required): Approximate contract value range, e.g., "$50K-$100K/year."

### Buyer Submits Privately
- `requirements` (array, required): Specific functional and non-functional requirements. Include must-haves vs. nice-to-haves.
- `budget` (object, required): Budget range, payment structure preference (annual, monthly, milestone), and flexibility.
- `decision_criteria` (array, required): How will you decide? Rank the criteria: price, capability, reliability, support, integration, references, etc.
- `timeline` (object, required): When do you need to be live? Are there hard deadlines (contract renewal, go-live event)?
- `non_negotiables` (array, required): What would cause an immediate disqualification?
- `constraints` (object, optional): Internal constraints — procurement process, required approvals, existing vendor relationships, switching costs.

### Vendor Submits Privately
- `capabilities` (object, required): What can you actually deliver against the buyer's category? Be specific about what you do well and what you don't.
- `pricing_structure` (object, required): Your real pricing for this type of engagement. What drives the price up or down?
- `delivery_approach` (object, required): How do you actually deliver? Timeline from contract to live, implementation process, support model.
- `references` (array, optional): 2-3 comparable clients you can reference.
- `differentiators` (array, required): Why should this buyer choose you over alternatives? Be specific.
- `constraints` (object, optional): What do you need from the buyer to deliver successfully? What makes engagements fail on your end?

## Outputs
- `fit_score` (object): Scored assessment of how well the vendor meets buyer requirements — by category, with overall fit rating and confidence level.
- `gap_analysis` (array): Specific capability or requirement gaps with severity — deal-breaker / significant / minor.
- `pricing_alignment` (object): Gap between buyer budget and vendor pricing, with options and context.
- `risk_assessment` (array): Top risks to a successful engagement with owner and mitigation.
- `negotiation_agenda` (object): Structured agenda for the decision meeting, with the 3-5 items that need direct discussion.
- `decision_recommendation` (string): A clear recommendation — proceed, proceed with conditions, or don't proceed — with rationale.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both buyer and vendor have submitted their Fabric session.

**Actions:**
1. Confirm requirements (buyer) and capabilities (vendor) are present — these are the core comparison points.
2. Confirm budget (buyer) and pricing_structure (vendor) are present — the financial alignment is the second critical check.
3. Flag any absent required fields.

**Output:** Readiness confirmation or missing fields list.

**Quality Gate:** Requirements and capabilities are both present. Budget and pricing are both present.

---

### Phase 1: Map Requirements to Capabilities
**Entry Criteria:** Both submissions confirmed sufficient.

**Actions:**
1. Extract the buyer's requirements list and categorize as must-have vs. nice-to-have.
2. Map each requirement to the vendor's stated capabilities.
3. Score each requirement: met / partially met / not met / unclear.
4. Flag any requirements the vendor didn't address.
5. Flag any capabilities the vendor emphasized that the buyer didn't ask for — these may be irrelevant or may reveal something the buyer hasn't considered.

**Output:** Requirements-to-capabilities mapping with per-item scores.

**Quality Gate:** Every must-have requirement has a score. No requirements are left unmapped.

---

### Phase 2: Assess Financial and Timeline Fit
**Entry Criteria:** Requirements mapping complete.

**Actions:**
1. Budget fit: compare buyer's budget range to vendor's pricing. Is it compatible? What's the gap? What drives the vendor's price up or down relative to buyer's constraints?
2. Timeline fit: can the vendor deliver within the buyer's timeline? What are the dependencies? What are the risk factors?
3. Payment structure: do the buyer's payment preferences match the vendor's requirements?
4. Switching cost context: does the buyer have constraints (existing contracts, data migration) that affect the real cost of this decision?

**Output:** Financial fit assessment with specific gap or alignment, timeline feasibility, payment structure compatibility.

**Quality Gate:** Financial gap or alignment is stated with specific numbers. Timeline risk factors are specific.

---

### Phase 3: Build the Fit Score and Decision Recommendation
**Entry Criteria:** Requirements mapping and financial assessment complete.

**Actions:**
1. Produce an overall fit score: weighted by the buyer's decision criteria priorities.
2. Identify deal-breaker gaps: any must-have requirement that is not met, or any non-negotiable that the vendor can't satisfy.
3. Build the risk register: top 5 risks to a successful engagement with owner (buyer risk, vendor risk, or shared) and mitigation approach.
4. Draft the decision recommendation:
   - **Proceed:** Fit is strong, no deal-breakers, financial alignment is workable.
   - **Proceed with conditions:** Fit is strong but specific gaps need to be resolved (name them) before contracting.
   - **Don't proceed:** One or more deal-breakers, or the financial gap is unbridgeable.
5. Build the negotiation agenda: what needs to be resolved in the decision meeting?

**Output:** Fit score, deal-breaker flags, risk register, decision recommendation, negotiation agenda.

**Quality Gate:** Decision recommendation has a clear rationale. Any "Proceed with conditions" recommendation names specific conditions. No vague language.

---

### Phase 4: Deliver the Decision Package
**Entry Criteria:** Fit score and recommendation complete.

**Actions:**
1. Present the requirements-to-capabilities map with scores.
2. Present the gap analysis with severity and deal-breaker flags.
3. Present pricing alignment with options.
4. Present the risk register.
5. Deliver the decision recommendation with full rationale.
6. Deliver the negotiation agenda for the decision meeting.
7. If "Don't proceed": explain specifically what would need to be true for this to be reconsidered.

**Output:** Full decision package — requirements map, gap analysis, financial alignment, risk register, recommendation, negotiation agenda.

**Quality Gate:** The buyer can make a go/no-go decision from this output. The recommendation is specific enough to defend in a procurement review.

---

## Exit Criteria
Done when: (1) every must-have requirement scored, (2) financial gap or alignment quantified, (3) deal-breaker gaps explicitly identified, (4) risk register covers top 5 risks with owners, (5) decision recommendation stated with rationale, (6) negotiation agenda has 3-5 specific items.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Vendor didn't address several requirements | Score them as "not met." Note in synthesis: these gaps need to be addressed in the decision meeting before proceeding. |
| Phase 2 | Budget is significantly below vendor pricing | Name the gap clearly. Present options: descoped engagement, phased contract, or a frank conversation about whether this is the right vendor for this budget. |
| Phase 3 | One or more deal-breakers present | Make the recommendation "Don't proceed" clearly. Don't bury it in caveats. |
| Phase 4 | Buyer's decision criteria are vague or unstated | Infer from the requirements list and flag: "Decision criteria were not explicitly stated. The following weights were inferred. Buyer should confirm before using this score." |

## State Persistence
- Vendor evaluation history (track which vendors were evaluated and why decisions were made)
- Requirements evolution (how needs change over procurement cycles)
- Outcome tracking (did the chosen vendor deliver — useful for future evaluations)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
