# Small Business Loan Prep

**One-line description:** The business owner and their lender each submit their real financial picture and lending criteria — Claude surfaces the gaps between what the owner thinks qualifies and what the bank actually needs, and produces a loan application package and Q&A that walks in ready.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both owner and lender must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_business_name` (string, required): Business name.
- `shared_loan_amount_requested` (string, required): Amount being requested and intended use.

### Business Owner Submits Privately
- `owner_business_financials` (object, required): Revenue, profit, cash flow, debt — current picture with as much specificity as possible.
- `owner_use_of_funds` (string, required): Exactly what the money is for and how it creates value or pays back the loan.
- `owner_collateral_available` (object, required): What assets are available to secure the loan — real estate, equipment, receivables, inventory.
- `owner_credit_and_history` (string, required): Personal and business credit situation, any prior defaults, liens, or judgments.
- `owner_concerns_about_qualification` (array, required): What are you worried the bank will push back on or use to deny the application?

### Lender / Banker Submits Privately
- `lender_qualification_criteria` (object, required): What does this type of loan require — DSCR, collateral coverage, time in business, credit score minimums, revenue thresholds?
- `lender_red_flags_in_application` (array, required): What in the owner's picture creates concern — thin margins, concentrated revenue, weak collateral, credit issues?
- `lender_what_would_strengthen_the_application` (array, required): What could the owner do, document, or structure differently to improve the approval likelihood?
- `lender_alternative_structures` (array, required): Are there loan products, SBA programs, or structures that fit this borrower better than what they asked for?
- `lender_timeline_and_process` (string, required): How long does approval take, what documents are needed, and what is the decision process?

## Outputs
- `qualification_gap_analysis` (object): Where the application currently meets criteria vs. where it falls short.
- `application_strengthening_plan` (array): Specific steps the owner should take before or alongside submitting — documentation, structure changes, collateral additions.
- `loan_package_outline` (object): What goes in the application, in what format, with what narrative.
- `lender_q_and_a_prep` (array): The questions the lender will ask and the answers the owner should prepare.
- `alternative_structures` (array): Other loan products or structures worth considering if the primary request hits obstacles.
- `timeline_and_next_steps` (object): What happens when, and what the owner needs to do at each stage.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm financials and qualification criteria present.
**Output:** Readiness confirmation.
**Quality Gate:** Owner's financial picture and lender's qualification criteria both present.

---

### Phase 1: Assess Qualification Against Criteria
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Map owner's financials against lender's qualification criteria — DSCR, collateral, credit, time in business. 2. Score each criterion — meets, borderline, does not meet. 3. Identify lender's red flags against what the owner disclosed — are the concerns flagged or hidden in the application? 4. Assess whether the loan amount and structure matches the business's repayment capacity.
**Output:** Qualification scorecard, red flag alignment, repayment capacity assessment.
**Quality Gate:** Every criterion has a status — meets, borderline, or does not meet with the specific gap.

---

### Phase 2: Build the Strengthening Plan
**Entry Criteria:** Qualification assessed.
**Actions:** 1. For each gap or red flag, determine what the owner can do — provide additional documentation, restructure the ask, add collateral, improve the narrative. 2. Assess alternative loan structures or SBA programs that better fit the risk profile. 3. Identify what cannot be fixed before submission vs. what must be addressed upfront. 4. Build the lender Q&A — every question the underwriter will ask and the strongest honest answer.
**Output:** Strengthening actions by gap, alternative structure assessment, lender Q&A.
**Quality Gate:** Every gap has an action or an honest disclosure strategy. No gaps are ignored or papered over.

---

### Phase 3: Build the Application Package
**Entry Criteria:** Strengthening plan built.
**Actions:** 1. Outline the full loan package — financial statements, tax returns, business plan, collateral documentation, owner bios. 2. Draft the use-of-funds narrative — specific, compelling, tied to repayment. 3. Build the timeline and next steps — what the owner submits, when, and what to expect. 4. Flag any items that need professional preparation (accountant, attorney).
**Output:** Application package outline, use-of-funds narrative, timeline, professional prep flags.
**Quality Gate:** Package is specific enough that the owner knows exactly what to gather. Narrative is tied to repayment, not just aspiration.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Package built.
**Actions:** 1. Present qualification gap analysis. 2. Deliver strengthening plan. 3. Deliver application package outline. 4. Deliver lender Q&A prep. 5. Present alternative structures and timeline.
**Output:** Full synthesis — qualification gaps, strengthening plan, application package, Q&A, alternatives, next steps.
**Quality Gate:** Owner walks into the lender conversation knowing exactly where they stand, what they've addressed, and what they'll be asked.

---

## Exit Criteria
Done when: (1) every qualification criterion has a status, (2) every gap has an action or disclosure strategy, (3) application package is complete with narrative, (4) lender Q&A covers the hard questions, (5) timeline and next steps are specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
