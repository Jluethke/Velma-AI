# Manufacturing Supplier Contract

**One-line description:** Procurement and the supplier each submit their real requirements, constraints, and risks before contract negotiations begin — Claude aligns on terms that protect supply continuity without destroying the supplier relationship or creating unworkable obligations on either side.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both procurement and supplier must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_and_supplier` (string, required): Buyer company and supplier company names.
- `shared_component_or_material` (string, required): What is being sourced — component, raw material, service.

### Procurement Submits Privately
- `procurement_volume_and_forecast` (object, required): Expected annual volume, forecast reliability, and variability in demand.
- `procurement_quality_and_delivery_requirements` (object, required): Specifications, tolerances, delivery lead times, and performance standards required.
- `procurement_pricing_target` (object, required): Target price, price improvement expectations, and what the market benchmark is.
- `procurement_supply_security_concerns` (array, required): What risks keep you up at night — single source, capacity constraints, geopolitical risk, financial health of supplier?
- `procurement_terms_they_need` (array, required): Payment terms, liability, IP ownership, audit rights — what must be in the contract?

### Supplier Submits Privately
- `supplier_capacity_and_constraints` (object, required): What volume can you commit to, what is your capacity ceiling, and what are your lead time constraints?
- `supplier_pricing_floor` (object, required): What you need to make this business viable — cost structure, margin requirements, price floor.
- `supplier_what_they_need_from_the_buyer` (array, required): Forecast commitments, payment terms, minimum volumes, tooling investment — what makes this relationship work for you?
- `supplier_risks_they_see_in_this_contract` (array, required): What terms or commitments worry you — liability exposure, volume variability, IP provisions, audit rights?
- `supplier_relationship_goals` (string, required): Is this a transactional relationship or a strategic partnership? What do you want this to grow into?

## Outputs
- `commercial_term_alignment` (object): Where pricing, volume, and payment terms are aligned or in conflict.
- `supply_security_plan` (object): Commitments, safety stock, capacity reservations, and escalation protocols that protect the buyer's supply.
- `performance_standards` (object): Quality, delivery, and service standards with measurement and consequence.
- `risk_allocation` (object): How liability, IP, tooling, and force majeure are handled — what each party owns.
- `contract_framework` (object): The key commercial terms ready for legal drafting — price, volume, term, termination, performance, liability.
- `relationship_development_plan` (object): If strategic, what investment and collaboration both parties are committing to.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm procurement's requirements and supplier's constraints present.
**Output:** Readiness confirmation.
**Quality Gate:** Procurement's volume and quality requirements and supplier's capacity and pricing floor both present.

---

### Phase 1: Assess Commercial Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare procurement's pricing target against supplier's price floor — is there a viable deal? 2. Check procurement's volume forecast against supplier's committed capacity — can they actually supply what is needed? 3. Identify payment term conflicts — what procurement needs vs. what the supplier's cash flow requires. 4. Assess supplier's risks about the contract — are they legitimate concerns or standard negotiation positions?
**Output:** Price viability, volume coverage, payment term gap, supplier risk assessment.
**Quality Gate:** Price gap is specific — "buyer target of $X/unit vs. supplier floor of $Y/unit based on stated cost structure; gap is $Z."

---

### Phase 2: Design the Supply Security Structure
**Entry Criteria:** Commercial alignment assessed.
**Actions:** 1. Design volume commitment structure — minimum purchase obligations, forecast windows, capacity reservations. 2. Build supply security provisions — safety stock requirements, alternate source rights, business continuity obligations. 3. Define performance standards — quality acceptance criteria, on-time delivery metrics, consequences of non-performance. 4. Resolve tooling and IP ownership — who owns what, what happens at termination.
**Output:** Volume commitment structure, supply security provisions, performance standards, tooling/IP resolution.
**Quality Gate:** Volume commitments are specific — minimum annual quantities, forecast notification windows, capacity reservation terms.

---

### Phase 3: Build the Contract Framework
**Entry Criteria:** Structure designed.
**Actions:** 1. Assemble the commercial term sheet — price, volume, payment, term length, renewal, termination rights. 2. Define the risk allocation — liability caps, indemnification, force majeure, audit rights. 3. Build the relationship development plan if this is strategic — joint improvement targets, technology sharing, preferred supplier status. 4. Flag what needs legal drafting vs. what can be agreed now.
**Output:** Commercial term sheet, risk allocation framework, relationship plan, legal drafting requirements.
**Quality Gate:** Term sheet is specific enough to hand to attorneys. Every material term has a position from both sides.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Contract framework built.
**Actions:** 1. Present commercial term alignment. 2. Deliver supply security plan. 3. Deliver performance standards. 4. Deliver contract framework. 5. Present relationship development plan.
**Output:** Full synthesis — commercial terms, supply security, performance standards, contract framework, relationship plan.
**Quality Gate:** Both parties can walk into formal contract negotiations with a shared understanding of what the deal is.

---

## Exit Criteria
Done when: (1) price viability confirmed or gap acknowledged, (2) volume commitments are specific, (3) supply security provisions defined, (4) performance standards are measurable, (5) contract framework is specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
