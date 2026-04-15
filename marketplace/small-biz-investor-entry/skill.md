# Small Business Investor Entry

**One-line description:** The owner and the incoming investor each submit their real terms, expectations, and concerns before any money changes hands — AI finds where the deal works, surfaces where the relationship will break, and produces an investment structure that does not destroy the business or the friendship.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both owner and investor must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_business_name` (string, required): Business name.
- `shared_investment_amount` (string, required): Amount being invested.

### Business Owner Submits Privately
- `owner_why_they_are_taking_investment` (string, required): What is the investment for — growth capital, working capital, buying out a partner, buying equipment?
- `owner_what_equity_or_return_they_are_offering` (object, required): What percentage, preferred return, or profit share are you willing to give?
- `owner_what_control_they_will_not_give_up` (array, required): What decisions must remain yours — hiring, pricing, strategic direction, when to sell?
- `owner_concerns_about_this_investor` (array, required): What worries you about this specific person — interference, expectations, what happens if things go wrong?
- `owner_what_happens_if_business_struggles` (string, required): If the business has a bad year or needs to pivot, what do you expect from the investor?

### Investor Submits Privately
- `investor_return_expectations` (object, required): What return are you expecting — IRR, multiple, preferred return, timeline?
- `investor_what_rights_they_expect` (object, required): What governance rights, information rights, or approval rights do you expect with this investment?
- `investor_concerns_about_the_business` (array, required): What worries you about this investment — owner capability, market, competition, financials?
- `investor_what_they_want_beyond_return` (string, required): Strategic involvement, advice-giving, board seat, customer introductions — what else are you bringing and expecting?
- `investor_exit_expectations` (object, required): When do you expect to get your money back and how — buyback, business sale, dividend stream?

## Outputs
- `term_alignment_assessment` (object): Where owner and investor agree, where they diverge, and what that means for the deal.
- `investment_structure_recommendation` (object): The specific structure — equity, convertible note, SAFE, profit-sharing, loan — that fits both parties' needs.
- `governance_and_control_framework` (object): What rights the investor gets, what decisions remain with the owner, and how disputes are resolved.
- `exit_mechanics` (object): How and when the investor gets out — buyback option, right of first refusal, drag-along — with specific terms.
- `relationship_risk_assessment` (object): Where this deal is most likely to cause conflict — and how to address it in the agreement.
- `legal_documentation_checklist` (array): What legal documents are needed, what each covers, and what to have an attorney prepare before money moves.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm owner's terms and investor's expectations present.
**Output:** Readiness confirmation.
**Quality Gate:** Owner's equity offer and investor's return expectations both present.

---

### Phase 1: Assess Term Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare owner's equity offer against investor's return expectations — is this a deal on economics? 2. Identify control conflicts — what the investor expects to have a say in vs. what the owner will not cede. 3. Assess exit alignment — when the investor expects to exit vs. how the owner envisions the business timeline. 4. Surface relationship risks — where this specific combination of owner and investor is likely to produce conflict.
**Output:** Economics alignment, control conflict map, exit alignment, relationship risk assessment.
**Quality Gate:** Every misalignment is specific — "investor expects board seat and veto on major hires; owner will not accept either" not "control issues exist."

---

### Phase 2: Design the Structure
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Design the investment structure that fits the economics — equity percentage, preferred return, convertible note terms. 2. Define governance rights that give the investor appropriate visibility without control — information rights, advisory role, reporting cadence. 3. Design exit mechanics — buyback formula, timeline, right of first refusal on a future sale. 4. Define dispute resolution — what happens if the investor wants out before the owner is ready or vice versa.
**Output:** Investment structure, governance framework, exit mechanics, dispute resolution.
**Quality Gate:** Structure is specific enough to hand to an attorney. Exit formula is a specific calculation, not "fair market value."

---

### Phase 3: Build the Documentation Checklist
**Entry Criteria:** Structure designed.
**Actions:** 1. List every legal document needed — investment agreement, shareholder agreement, promissory note if applicable, operating agreement amendment. 2. For each document, describe what it covers and what to have the attorney include. 3. Flag relationship conversations that must happen before money moves — expectations about involvement, communication frequency, what "bad year" looks like. 4. Define the closing process — when money moves, what gets signed, in what order.
**Output:** Documentation checklist with descriptions, relationship conversation list, closing process.
**Quality Gate:** Checklist is specific enough that owner and investor can brief an attorney without a full synthesis call.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Documentation built.
**Actions:** 1. Present term alignment assessment. 2. Deliver investment structure recommendation. 3. Deliver governance and control framework. 4. Deliver exit mechanics. 5. Present relationship risk assessment and documentation checklist.
**Output:** Full synthesis — alignment, structure, governance, exit, risks, documentation.
**Quality Gate:** Both parties understand exactly what they are agreeing to. No one discovers a surprise in the legal documents.

---

## Exit Criteria
Done when: (1) economics alignment is specific, (2) control conflicts are resolved or named as deal conditions, (3) investment structure is specific, (4) exit mechanics have specific terms, (5) documentation checklist is complete.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
