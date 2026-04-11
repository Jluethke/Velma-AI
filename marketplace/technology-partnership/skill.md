# Technology Partnership

**One-line description:** Two technology companies each submit their real integration goals, IP boundaries, and commercial expectations before formalizing a partnership — Claude aligns on a structure that delivers customer value, protects each party's core IP, and defines who owns what when the partnership produces something new.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both companies must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_a_and_b` (string, required): Both company names.
- `shared_partnership_purpose` (string, required): What the partnership is meant to create or enable — joint product, integration, distribution, co-selling.

### Company A Submits Privately
- `company_a_strategic_objective` (object, required): What you get from this partnership — customers, capability, distribution, market position.
- `company_a_contribution` (object, required): What you bring — technology, API access, customer relationships, brand, go-to-market.
- `company_a_ip_boundaries` (array, required): What you will not expose or transfer — core IP, proprietary algorithms, customer data, trade secrets.
- `company_a_commercial_requirements` (object, required): Revenue share, referral fees, co-sell structure, minimum commitments.
- `company_a_concerns_about_the_partner` (array, required): Competitive risk, IP leakage, partner prioritization, what happens if they get acquired.

### Company B Submits Privately
- `company_b_strategic_objective` (object, required): What you get from this partnership.
- `company_b_contribution` (object, required): What you bring.
- `company_b_ip_boundaries` (array, required): What you will not expose.
- `company_b_commercial_requirements` (object, required): What the commercial structure must look like to make this partnership worth the investment.
- `company_b_concerns_about_the_partner` (array, required): Competitive risk, commitment reliability, integration quality, support.

## Outputs
- `strategic_alignment_assessment` (object): Whether the partnership creates genuine value for both parties.
- `contribution_and_ip_framework` (object): What each party contributes and what IP boundaries are maintained.
- `commercial_structure` (object): Revenue share, referral, co-sell — specific commercial terms.
- `joint_development_framework` (object): If new IP is created together, who owns it and how it is licensed.
- `governance_and_termination` (object): How the partnership is managed and how it ends.
- `partnership_agreement_framework` (object): Key terms for technology and commercial counsel.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm both parties' objectives and contributions present.
**Output:** Readiness confirmation.
**Quality Gate:** Both parties' strategic objectives and IP boundaries present.

---

### Phase 1: Assess Strategic and Commercial Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Assess whether the partnership creates genuine mutual value. 2. Identify IP boundary conflicts — where each party's limits overlap. 3. Compare commercial requirements — are they compatible? 4. Assess competitive risk — could this partnership enable the other party to compete with you?
**Output:** Value assessment, IP conflict map, commercial compatibility, competitive risk.
**Quality Gate:** Strategic alignment is specific — "partnership creates value for A by enabling X; creates value for B by enabling Y; risks are Z."

---

### Phase 2: Design the Partnership Structure
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Define what each party contributes and the IP provisions. 2. Build the commercial structure — revenue sharing, referrals, minimums. 3. Design the joint development framework for any new IP. 4. Define the governance — partner management, escalation, change management.
**Output:** Contribution and IP framework, commercial structure, joint development terms, governance.
**Quality Gate:** Every IP boundary is specific — what is shared via API vs. what is never exposed.

---

### Phase 3: Define Terms and Exit
**Entry Criteria:** Structure designed.
**Actions:** 1. Define the term, renewal, and termination provisions. 2. Build the competitive restriction — what each party agrees not to do. 3. Define what happens to jointly developed IP on termination. 4. Assemble the partnership agreement framework.
**Output:** Term and termination, competitive restrictions, post-termination IP, agreement framework.
**Quality Gate:** Post-termination IP ownership is specific for each scenario.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — alignment, IP framework, commercial structure, joint development, governance, agreement.
**Quality Gate:** Both parties can brief their counsel from this synthesis.

---

## Exit Criteria
Done when: (1) value is mutual and specific, (2) IP boundaries are clear, (3) commercial structure is specific, (4) joint IP ownership is defined, (5) termination terms are complete.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
