# Legal-Sales Contract Alignment

**One-line description:** Sales and legal each submit their real deal context and contract positions — AI aligns on approved fallback positions, surfaces what requires escalation, and produces a negotiation strategy that closes the deal without creating legal exposure.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both sales and legal must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_customer_name` (string, required): Customer name.
- `shared_contract_type` (string, required): Contract type. e.g., "Master Services Agreement," "SaaS subscription," "Professional services SOW."

### Account Executive / Sales Lead Submits Privately
- `sales_deal_context` (object, required): Deal size, strategic importance, customer segment, and competitive situation.
- `sales_customer_redlines` (array, required): What has the customer marked up or requested? What specific terms are they pushing on?
- `sales_timeline_to_close` (string, required): What is the close timeline? Is there a quarter-end or event driving urgency?
- `sales_terms_they_promised_customer` (array, required): What have you already committed to or implied to the customer during the sales process?
- `sales_concerns_about_legal_blocking_deal` (array, required): What do you worry legal will refuse that would kill or delay this deal?

### Legal / GC Submits Privately
- `legal_terms_they_will_not_accept` (array, required): Terms the company will not accept under any circumstances.
- `legal_standard_fallback_positions` (object, required): For common customer redlines, what are the approved fallback positions?
- `legal_risk_assessment_of_redlines` (object, required): For each customer redline, what is the legal risk — low, medium, or high — and why?
- `legal_what_needs_escalation` (array, required): Terms that go beyond standard fallback positions and require leadership sign-off.
- `legal_concerns_about_sales_commitments` (array, required): What has sales committed to or implied that creates legal exposure?

## Outputs
- `redline_risk_assessment` (object): Each customer redline with legal risk level and recommended position.
- `approved_fallback_positions` (object): The approved negotiating positions for each redline, ready to use in negotiations.
- `escalation_requirements` (array): Terms requiring leadership approval with the business case for escalation.
- `commitment_alignment` (object): Resolution of any commitments sales made that legal has concerns about.
- `negotiation_strategy` (object): How to sequence the contract negotiation — what to concede early, what to hold, what to escalate.
- `contract_path_to_close` (object): A specific path from current position to signed contract given the timeline.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm customer redlines and legal risk assessment present.
**Output:** Readiness confirmation.
**Quality Gate:** Customer redlines and legal's fallback positions both present.

---

### Phase 1: Assess Redline Risk and Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. For each customer redline, align on the legal risk level and the recommended negotiating position. 2. Identify redlines where the standard fallback position resolves the customer's ask vs. where the customer is pushing beyond standard. 3. Flag sales commitments that legal has concerns about — assess whether the commitment is recoverable in negotiation or creates binding exposure. 4. Identify terms that require leadership escalation.
**Output:** Redline risk assessment, fallback coverage map, commitment exposure assessment, escalation list.
**Quality Gate:** Every redline has a risk level and a recommended position. Sales commitments are assessed — not ignored.

---

### Phase 2: Resolve Commitment Conflicts
**Entry Criteria:** Risk assessed.
**Actions:** 1. For each sales commitment that legal flagged, determine whether it can be honored, needs to be walked back in negotiation, or requires escalation. 2. Draft the language or approach for walking back problematic commitments without damaging the relationship. 3. Identify whether any escalation items can be resolved by legal offering an alternative that meets the customer's underlying need. 4. Clear the escalation path — who approves, what information they need, and what the timeline is.
**Output:** Commitment resolution decisions, walkback language, alternative proposals, escalation path.
**Quality Gate:** Every flagged commitment has a resolution decision. Walk-back language is specific and customer-friendly.

---

### Phase 3: Build the Negotiation Strategy
**Entry Criteria:** Conflicts resolved.
**Actions:** 1. Sequence the contract negotiation — start with easy wins (company accepts customer position), move to negotiated terms, reserve escalation items for last. 2. Build the concession strategy — what to offer proactively vs. hold in reserve. 3. Define the path to close — a specific sequence of steps given the timeline pressure. 4. Draft communication to the customer on redlines.
**Output:** Negotiation sequence, concession strategy, path to close, customer communication draft.
**Quality Gate:** Sequence is specific — "concede X on day 1, negotiate Y in round 2, escalate Z if needed." Path to close has specific dates.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Strategy built.
**Actions:** 1. Present redline risk assessment. 2. Present approved fallback positions. 3. Deliver escalation requirements. 4. Deliver negotiation strategy and path to close. 5. State commitment alignment resolutions.
**Output:** Full synthesis — risk assessment, fallback positions, escalation list, negotiation strategy, commitment resolutions.
**Quality Gate:** Sales has a clear negotiating mandate. Legal has confidence that the approved positions protect the company.

---

## Exit Criteria
Done when: (1) every redline has risk level and approved position, (2) every sales commitment has a resolution, (3) escalation requirements defined with approval path, (4) negotiation sequence is specific, (5) path to close with timeline.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
