# Wealth Management Engagement

**One-line description:** The financial advisor and the client each submit their real financial picture, goals, risk tolerance, and concerns — AI produces an investment and financial plan that reflects what the client actually needs, not a generic allocation based on a questionnaire score.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both advisor and client must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_advisor_and_client` (string, required): Advisor/firm and client names.
- `shared_assets_under_discussion` (string, required): Approximate investable assets or portfolio size being discussed.

### Financial Advisor Submits Privately
- `advisor_assessment_of_client_situation` (object, required): Current portfolio, tax situation, estate considerations, insurance gaps — what you see that the client may not have fully articulated.
- `advisor_recommended_strategy` (object, required): Investment approach, allocation, products — what you believe is right for this client.
- `advisor_fee_structure` (object, required): AUM fee, financial planning fee, transaction fees — full cost disclosure.
- `advisor_concerns_about_the_client` (array, required): Behavioral concerns, unrealistic expectations, relationship dynamics that affect advice-giving.
- `advisor_what_the_client_needs_to_do` (array, required): Account consolidations, insurance changes, estate documents, tax moves — actions outside the investment portfolio.

### Client Submits Privately
- `client_full_financial_picture` (object, required): Assets, liabilities, income, expenses — the real picture including everything the advisor may not know.
- `client_goals_and_timeline` (object, required): What you are saving for, when you need it, what success looks like in 10, 20, 30 years.
- `client_real_risk_tolerance` (string, required): Not the questionnaire answer — how did you actually feel during the last market drop? What would cause you to sell at the worst time?
- `client_concerns_about_the_relationship` (array, required): What worries you — fees, conflicts of interest, whether the advisor understands your values, what happens if the market tanks?
- `client_what_they_have_not_said` (string, required): Financial topics you have not brought up — inheritance expectations, business interests, family obligations, spending you feel guilty about.

## Outputs
- `financial_picture_synthesis` (object): Complete financial picture — assets, liabilities, income, gaps.
- `goal_and_strategy_alignment` (object): Whether the recommended strategy aligns with the client's stated goals and true risk tolerance.
- `investment_plan` (object): Asset allocation, product selection, implementation timeline — specific to this client.
- `financial_planning_action_list` (array): Non-investment actions — insurance, estate, tax, debt — with priority and timeline.
- `fee_transparency_summary` (object): Total estimated cost of the relationship — what the client is actually paying.
- `relationship_expectations_alignment` (object): How the relationship works — communication frequency, what the client can expect, how performance is measured.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm client's financial picture and advisor's strategy present.
**Output:** Readiness confirmation.
**Quality Gate:** Client's full financial picture and advisor's recommended strategy both present.

---

### Phase 1: Build the Complete Financial Picture
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Synthesize the full financial picture — reconcile what the advisor sees with what the client disclosed. 2. Identify gaps — insurance, estate documents, concentrated positions, tax-inefficient structures. 3. Assess whether the client's goals are achievable given their current trajectory. 4. Evaluate whether the client's stated risk tolerance matches their actual behavior.
**Output:** Complete financial picture, gap list, goal feasibility, behavioral risk assessment.
**Quality Gate:** Goal feasibility is specific — "at current savings rate and with proposed allocation, client reaches retirement target at age X with $Y in real terms."

---

### Phase 2: Assess Strategy and Fee Alignment
**Entry Criteria:** Picture built.
**Actions:** 1. Evaluate whether the advisor's recommended strategy matches the client's goals and real risk tolerance. 2. Assess whether the fee structure is appropriate for the relationship and services provided. 3. Identify any conflicts of interest in the recommended products. 4. Address the client's unstated concerns — the things they did not bring up but are clearly worrying about.
**Output:** Strategy alignment, fee appropriateness, conflict assessment, unstated concern response.
**Quality Gate:** Strategy assessment is specific — each major allocation decision has a rationale tied to the client's specific situation.

---

### Phase 3: Build the Plan
**Entry Criteria:** Strategy aligned.
**Actions:** 1. Write the investment plan — allocation, products, implementation sequence. 2. Build the financial planning action list — non-investment actions with priority and owner. 3. Define the relationship expectations — communication cadence, reporting, what the client can call about. 4. Define how performance will be measured and discussed.
**Output:** Investment plan, action list, relationship expectations, performance framework.
**Quality Gate:** Investment plan is specific enough to implement. Action list has deadlines. Relationship expectations have specific commitments.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present financial picture synthesis. 2. Deliver goal and strategy alignment. 3. Deliver investment plan. 4. Deliver financial planning action list. 5. Present fee transparency and relationship expectations.
**Output:** Full synthesis — financial picture, goal alignment, investment plan, actions, fees, relationship.
**Quality Gate:** Client understands their complete financial picture, the strategy, and what it costs. Advisor has a clear mandate.

---

## Exit Criteria
Done when: (1) financial picture is complete, (2) goal feasibility is specific, (3) investment plan has specific allocation, (4) action list has priorities and deadlines, (5) fee disclosure is complete.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
