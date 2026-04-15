# Supply Chain Disruption Response

**One-line description:** An operations leader and a key supplier each submit their real disruption impact, recovery capacity, and business continuity needs when a supply chain problem emerges — AI aligns on a recovery plan that keeps the business running while both sides manage the fallout honestly.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both operations leader and supplier must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_buyer_and_supplier` (string, required): Buyer company and supplier company names.
- `shared_disruption_description` (string, required): What happened — shortage, quality failure, force majeure, capacity issue, logistics failure.

### Operations Leader Submits Privately
- `ops_business_impact` (object, required): What the disruption is doing to your business — production stoppages, customer commitments at risk, revenue impact, timeline.
- `ops_inventory_position` (object, required): Current inventory on hand, how long it will last, what the true run-out date is.
- `ops_alternative_sourcing_assessment` (object, required): What alternatives exist — secondary suppliers, substitutions, air freight — and the cost and timeline of each.
- `ops_customer_commitments_at_risk` (object, required): Which customers, which orders, which contracts are in jeopardy — prioritized by business impact.
- `ops_what_they_need_from_supplier` (array, required): What you need to manage through this — allocation priority, expedited shipments, transparency on recovery timeline.

### Supplier Submits Privately
- `supplier_disruption_root_cause` (object, required): What actually happened, why, and what the recovery path looks like — honest assessment including the uncertain parts.
- `supplier_recovery_timeline` (object, required): When you can resume normal supply — best case, likely case, worst case — with the specific constraints driving each.
- `supplier_allocation_capacity` (object, required): What volume you can supply during the disruption period, how you are allocating across customers.
- `supplier_financial_and_contractual_exposure` (object, required): Your liability under the supply agreement, what you can and cannot absorb financially.
- `supplier_concerns_about_this_buyer` (array, required): Force majeure position, financial claims risk, relationship impact, whether the buyer will move supply permanently.

## Outputs
- `disruption_reality_assessment` (object): What the actual situation is — timeline, volume impact, recovery probability.
- `business_continuity_plan` (object): How the buyer keeps operating through the disruption — allocation, alternatives, customer prioritization.
- `recovery_milestone_plan` (object): Supplier recovery timeline with specific milestones and what enables each.
- `allocation_and_priority_framework` (object): How available supply is allocated during the recovery period.
- `financial_and_contractual_resolution` (object): How extraordinary costs, penalties, and contract obligations are handled.
- `relationship_and_future_sourcing_framework` (object): What happens to the supply relationship after this disruption is resolved.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm operations leader's business impact and supplier's recovery timeline both present.
**Output:** Readiness confirmation.
**Quality Gate:** Business impact and supplier's recovery capacity and timeline both present.

---

### Phase 1: Assess the Disruption
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Build the timeline — run-out date vs. recovery date — what is the gap? 2. Assess alternative sourcing options against cost and feasibility. 3. Evaluate customer commitments at risk. 4. Assess financial and contractual exposure.
**Output:** Timeline gap, alternative sourcing assessment, customer risk map, financial exposure.
**Quality Gate:** Recovery timeline has best/likely/worst case with specific named constraints for each — not a range without explanation.

---

### Phase 2: Build the Business Continuity Plan
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the allocation plan — what volume from supplier, what from alternatives, priority order. 2. Define customer communication and commitment management. 3. Build the cost sharing framework for expedites, alternatives, and penalties. 4. Establish communication and transparency commitments.
**Output:** Allocation plan, customer management plan, cost framework, communication commitments.
**Quality Gate:** Allocation plan is specific volumes by customer category by week — not proportional concepts.

---

### Phase 3: Define Recovery and Future Relationship
**Entry Criteria:** Continuity plan built.
**Actions:** 1. Define supplier recovery milestones — what triggers ramp-up, what triggers normal supply. 2. Resolve contractual obligations — force majeure determination, penalty application or waiver. 3. Define whether this disruption triggers sourcing diversification requirements. 4. Assemble the recovery agreement framework.
**Output:** Recovery milestones, contractual resolution, future sourcing framework, recovery agreement.
**Quality Gate:** Recovery milestones are specific volume targets at specific dates — not "return to normal."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan complete.
**Output:** Full synthesis — disruption assessment, business continuity plan, recovery milestones, allocation framework, financial resolution, relationship framework.
**Quality Gate:** Operations leader knows how long they can run and what it will cost. Supplier knows what the buyer needs and what their exposure is.

---

## Exit Criteria
Done when: (1) timeline gap is quantified, (2) business continuity plan covers the gap, (3) recovery milestones are specific, (4) financial exposure is resolved, (5) future sourcing strategy is defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
