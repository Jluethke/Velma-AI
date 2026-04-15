# International Joint Venture

**One-line description:** The domestic company and the foreign partner each submit their real strategic objectives, contribution expectations, and governance concerns before the JV is formed — AI aligns on a structure that achieves both parties' market goals without creating a governance trap or an equity split that poisons the relationship.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both companies must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_and_partner` (string, required): Domestic company and foreign partner names.
- `shared_jv_market_and_purpose` (string, required): Target market and business purpose of the joint venture.

### Domestic Company Submits Privately
- `domestic_strategic_objectives` (object, required): What market access, capabilities, or distribution you are trying to achieve through this JV.
- `domestic_contributions` (object, required): What you bring — technology, brand, capital, product, management — and how you value it.
- `domestic_governance_requirements` (object, required): Equity stake, board control, veto rights, what decisions must require your approval.
- `domestic_concerns_about_the_partner` (array, required): IP protection, partner reliability, local practices, regulatory risk, exit if things go wrong.
- `domestic_exit_requirements` (object, required): How you need to be able to exit — buyout rights, put options, what happens if the JV fails.

### Foreign Partner Submits Privately
- `partner_strategic_objectives` (object, required): What you get from this JV — technology transfer, product access, brand, distribution, financial return.
- `partner_contributions` (object, required): What you bring — local market knowledge, distribution, regulatory relationships, capital, manufacturing.
- `partner_governance_requirements` (object, required): Equity stake, operational control, what you need to manage the business day to day.
- `partner_concerns_about_the_jv` (array, required): Technology transfer obligations, domestic partner interference, competitive use of JV assets, cultural differences.
- `partner_local_regulatory_constraints` (array, required): Local ownership rules, approval requirements, currency controls, regulatory filings.

## Outputs
- `strategic_alignment_assessment` (object): Whether both parties are building the same business and whether the JV can serve both sets of objectives.
- `equity_and_contribution_framework` (object): Equity split, how contributions are valued, capital call structure.
- `governance_structure` (object): Board composition, approval thresholds, operational authority, deadlock resolution.
- `ip_and_technology_framework` (object): What IP is contributed, what is licensed, what stays proprietary, post-JV IP ownership.
- `exit_and_termination_framework` (object): Exit rights, buyout mechanics, what happens to the JV business on dissolution.
- `jv_term_sheet` (object): Key terms for cross-border legal counsel.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm both parties' strategic objectives and contributions present.
**Output:** Readiness confirmation.
**Quality Gate:** Both parties' objectives and contribution valuations present.

---

### Phase 1: Assess Strategic and Structural Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Assess whether both parties' strategic objectives are compatible — are they building the same business? 2. Compare contribution valuations — does each party's view of what they bring produce an equity split both can accept? 3. Identify governance conflicts — where one party's control requirements conflict with the other's. 4. Check local regulatory constraints against the proposed structure.
**Output:** Strategic alignment, equity valuation gap, governance conflicts, regulatory feasibility.
**Quality Gate:** Equity gap is specific — "domestic values technology contribution at 60%; partner values distribution at 50%; implied equity is 110%; reconciliation needed."

---

### Phase 2: Design the JV Structure
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Design the equity structure — split, classes of interest, anti-dilution provisions. 2. Build the governance framework — board size, representation, approval thresholds, operational authority. 3. Define IP contributions and licensing — what goes into the JV, what is licensed, what protections exist. 4. Design the deadlock resolution — what happens if the board cannot agree.
**Output:** Equity structure, governance framework, IP framework, deadlock mechanism.
**Quality Gate:** Governance approval thresholds are specific dollar amounts. Deadlock mechanism is a named process — casting vote, put/call, or mediation.

---

### Phase 3: Define Exit and Contingency
**Entry Criteria:** Structure designed.
**Actions:** 1. Build exit mechanics — right of first refusal, put and call options, drag-along, change of control. 2. Define the buyout formula — how the JV is valued on exit. 3. Identify the regulatory approval requirements and timeline. 4. Assemble the JV term sheet.
**Output:** Exit mechanics, buyout formula, regulatory timeline, JV term sheet.
**Quality Gate:** Buyout formula is a specific methodology — not "fair market value" but "X times trailing EBITDA as determined by [named process]."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Term sheet built.
**Actions:** 1. Present strategic alignment assessment. 2. Deliver equity and contribution framework. 3. Deliver governance structure. 4. Deliver IP framework and exit mechanics. 5. Present regulatory path and JV term sheet.
**Output:** Full synthesis — alignment, equity, governance, IP, exit, regulatory, term sheet.
**Quality Gate:** Both parties can brief their cross-border counsel from this synthesis.

---

## Exit Criteria
Done when: (1) strategic objectives are aligned, (2) equity split is agreed with valuation basis, (3) governance thresholds are specific, (4) IP ownership is clear, (5) exit mechanics have a specific valuation formula.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
