# Mortgage Origination

**One-line description:** A mortgage loan officer and a borrower each submit their real financial picture, loan goals, and concerns before the application — Claude aligns on the right loan structure, surfaces the full cost of borrowing, and identifies what needs to be resolved before underwriting.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both loan officer and borrower must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_property_and_transaction` (string, required): Property address, purchase price or refinance amount, and transaction type.
- `shared_borrower_and_lender` (string, required): Borrower name(s) and lending institution.

### Loan Officer Submits Privately
- `lo_credit_and_risk_assessment` (object, required): Credit score, DTI, LTV, how this borrower looks to underwriting — where the risks are.
- `lo_loan_product_recommendation` (object, required): What loan products fit this borrower — conventional, FHA, VA, jumbo, ARM vs. fixed — and why.
- `lo_pricing_and_compensation` (object, required): Rate options, points, origination fee, yield spread — full cost disclosure.
- `lo_underwriting_concerns` (array, required): What will need to be explained or documented — employment gaps, recent large deposits, credit events.
- `lo_what_could_kill_this_deal` (array, required): Conditions that could cause denial — appraisal risk, title issues, income documentation gaps.

### Borrower Submits Privately
- `borrower_financial_reality` (object, required): Income, assets, debts, credit situation — the full picture including things you haven't mentioned to the loan officer.
- `borrower_loan_goals` (object, required): What matters most — lowest payment, lowest rate, lowest closing costs, fastest close, cash out.
- `borrower_concerns` (array, required): What you're worried about — rate lock, appraisal, closing timeline, job change, qualification.
- `borrower_what_they_have_not_disclosed` (array, required): Financial facts you haven't mentioned — recent job change, disputed accounts, planned purchase of additional property.
- `borrower_deal_breakers` (array, required): Terms you will not accept — prepayment penalty, escrow requirements, rate above X.

## Outputs
- `loan_structure_recommendation` (object): Recommended loan product, rate, term, and why it fits this borrower.
- `full_cost_of_borrowing` (object): Rate, APR, points, origination, closing costs, total interest over loan life.
- `underwriting_risk_assessment` (object): Issues that need to be resolved before underwriting approves — specific documentation requirements.
- `rate_lock_and_timeline_plan` (object): Lock period, closing timeline, what could delay it.
- `disclosure_and_compliance_checklist` (object): Required disclosures, regulatory requirements, what borrower must acknowledge.
- `alternative_scenarios` (object): If preferred loan doesn't work — alternative products, different down payment, co-borrower options.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm loan officer's risk assessment and borrower's financial reality both present.
**Output:** Readiness confirmation.
**Quality Gate:** Both parties' financial assessments and loan goals present.

---

### Phase 1: Assess Qualification and Fit
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare borrower's disclosed financial picture against loan officer's risk assessment — are there gaps? 2. Evaluate loan product fit against borrower's stated goals. 3. Identify undisclosed financial facts that affect qualification. 4. Assess underwriting risk areas.
**Output:** Qualification assessment, product fit analysis, undisclosed risk flags, underwriting risk map.
**Quality Gate:** Every underwriting concern is specific — named issue, required documentation, probability of resolution.

---

### Phase 2: Structure the Loan
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the recommended loan structure — product, rate, term, down payment. 2. Build the full cost disclosure — all fees, APR, total interest. 3. Identify alternative scenarios if primary structure is at risk. 4. Define the documentation required before underwriting.
**Output:** Loan structure, full cost disclosure, alternative scenarios, documentation list.
**Quality Gate:** All costs are specific dollar amounts or percentages. Documentation requirements are named documents with responsible parties.

---

### Phase 3: Plan the Close
**Entry Criteria:** Structure defined.
**Actions:** 1. Define the rate lock strategy — when to lock, lock period, extension cost. 2. Build the closing timeline — application, appraisal, underwriting, clear to close, closing date. 3. Define what could delay or kill the deal and how to mitigate. 4. Assemble the engagement framework.
**Output:** Rate lock strategy, closing timeline, risk mitigation plan, engagement framework.
**Quality Gate:** Closing timeline has specific dates. Risk mitigation steps are assigned to specific parties.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan complete.
**Output:** Full synthesis — loan structure, full cost, underwriting requirements, timeline, risk factors, alternatives.
**Quality Gate:** Borrower knows the true cost of the loan and what could prevent closing. Loan officer knows what documentation is needed.

---

## Exit Criteria
Done when: (1) loan structure is recommended with specific terms, (2) full cost of borrowing is disclosed, (3) underwriting requirements are named, (4) closing timeline is defined, (5) deal risks are identified with mitigation steps.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
