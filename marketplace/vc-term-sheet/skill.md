# VC Term Sheet

**One-line description:** Investor and founder each submit their real valuation views and non-negotiable terms — AI models the economics, maps each term, and produces a term sheet draft both sides can actually close on.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both investor and founder must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_round_size` (string, required): Total round size being raised.

### Investor / VC Submits Privately
- `investor_valuation_view` (object, required): Pre-money valuation and the reasoning — comparable companies, revenue multiples, or stage norms.
- `investor_terms_required` (object, required): Liquidation preference, anti-dilution, pro-rata rights, board composition, information rights.
- `investor_governance_requirements` (array, required): What governance rights, approvals, or protective provisions do you require?
- `investor_concerns_about_deal` (array, required): What concerns you about this company, founder, or market?
- `investor_what_they_will_not_move_on` (array, required): What terms are non-negotiable?

### Founder / CEO Submits Privately
- `founder_valuation_expectations` (object, required): What pre-money valuation are you expecting and why?
- `founder_terms_they_can_accept` (object, required): Which standard terms are you comfortable with? Where have you already received guidance from counsel?
- `founder_dilution_concerns` (object, required): What total dilution from this round is acceptable? How does this affect your cap table and future rounds?
- `founder_governance_concerns` (array, required): What governance provisions concern you? Where do you need to retain control?
- `founder_what_they_will_not_give_up` (array, required): What terms are non-negotiable for you?

## Outputs
- `valuation_gap_analysis` (object): The gap between investor's valuation and founder's expectation with market context.
- `term_by_term_alignment_map` (array): Each major term rated — aligned, workable gap, or significant conflict — with trade options.
- `economic_dilution_model` (object): Modeled ownership percentages, liquidation preference scenarios, and dilution impact.
- `governance_structure_options` (array): Board composition and protective provision options that address both sides' core requirements.
- `term_sheet_draft` (string): Full term sheet — valuation, investment amount, preferences, governance, information rights, and conditions.
- `negotiation_path_to_close` (object): The trade-offs required to bridge remaining gaps.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm valuation views and non-negotiables present from both sides.
**Output:** Readiness confirmation.
**Quality Gate:** Investor's valuation and founder's expectation both present.

---

### Phase 1: Assess Valuation and Economic Compatibility
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare investor's pre-money valuation against founder's expectation — calculate the gap and assess it against market comparables. 2. Model the economic outcome under each valuation with the proposed round size — ownership percentages, founder dilution, and employee pool impact. 3. Model liquidation preference scenarios — what does each side receive in a 1x, 2x, and 5x outcome under different preference structures? 4. Identify where bridging terms (structure, warrant coverage, milestone-based pricing) could close the valuation gap.
**Output:** Valuation gap, economic model at multiple outcomes, bridging options.
**Quality Gate:** Valuation gap is in specific dollars. Liquidation scenarios show real dollar outcomes at specific exit values.

---

### Phase 2: Map Term-by-Term Alignment
**Entry Criteria:** Economics assessed.
**Actions:** 1. For each major term — liquidation preference, anti-dilution, pro-rata, board, protective provisions, information rights — compare investor's requirements against founder's position. 2. Identify non-negotiable conflicts — where investor's non-negotiable directly conflicts with founder's non-negotiable. 3. Assess governance balance — does the proposed board composition give the investor governance comfort while preserving founder control? 4. Identify terms where market standard provides a resolution path.
**Output:** Term alignment map, non-negotiable conflict list, governance balance assessment, market standard references.
**Quality Gate:** Every term has a status. Non-negotiable conflicts are named — not softened as "areas to discuss."

---

### Phase 3: Draft the Term Sheet
**Entry Criteria:** Terms mapped.
**Actions:** 1. Draft the term sheet using market standard language for agreed terms. 2. Draft both sides' preferred language for disputed terms, with the trade required to accept each. 3. Build the negotiation path — what each side needs to give to reach agreement. 4. Note any terms that require legal review before the founder commits.
**Output:** Full term sheet draft, disputed term alternatives, negotiation path, legal review flags.
**Quality Gate:** Term sheet is complete enough to negotiate from. Every disputed term has two specific options, not open language.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Term sheet drafted.
**Actions:** 1. Present valuation gap with market context. 2. Present economic dilution model. 3. Deliver term-by-term alignment map. 4. Deliver term sheet draft. 5. State negotiation path to close.
**Output:** Full synthesis — valuation gap, dilution model, term map, term sheet, negotiation path.
**Quality Gate:** Founder understands the economics they are agreeing to. Investor has a term sheet that reflects their investment thesis.

---

## Exit Criteria
Done when: (1) valuation gap stated with market context, (2) dilution modeled at multiple exit scenarios, (3) every major term has alignment status, (4) full term sheet draft, (5) negotiation path identifies specific trades required.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
