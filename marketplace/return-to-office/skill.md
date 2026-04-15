# Return-to-Office Policy

**One-line description:** HR and leadership each submit their real employee data and business needs before designing RTO policy — AI models retention risk and produces a plan that does not lose the people the company cannot afford to lose.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both HR and executive leadership must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_current_policy` (string, required): Current remote/hybrid policy.

### HR Lead Submits Privately
- `hr_employee_sentiment_data` (object, required): Survey results, exit interview themes, Glassdoor patterns — what employees actually say about flexible work.
- `hr_retention_risks` (object, required): Which roles, teams, or individuals are most at risk if the policy tightens? What have people said?
- `hr_what_employees_want` (string, required): What does the employee population actually prefer? Is it uniform or split?
- `hr_benchmark_data` (object, required): What are comparable companies doing? What is market standard for this type of role?
- `hr_concerns_about_leadership_direction` (array, required): What about where leadership seems to be heading worries you from a people perspective?

### Executive / Business Lead Submits Privately
- `exec_what_business_needs` (string, required): What business problem is the RTO policy solving? Collaboration, culture, productivity, or something else?
- `exec_culture_concerns` (array, required): What specific cultural or collaboration breakdowns are you observing that you believe require in-person work?
- `exec_non_negotiables` (array, required): What aspects of the policy are non-negotiable regardless of employee preference?
- `exec_what_they_will_compromise_on` (array, required): Where are you willing to flex to preserve talent?
- `exec_concerns_about_hr_read` (array, required): Where do you think HR is overweighting employee preference at the expense of business outcomes?

## Outputs
- `retention_risk_assessment` (object): Who is at risk of leaving under different policy scenarios and what it would cost.
- `business_need_analysis` (object): Whether the stated business need actually requires in-person work or whether it can be addressed differently.
- `policy_options` (array): 2-3 policy options with retention risk, business impact, and implementation complexity for each.
- `exception_framework` (object): How to handle roles, individuals, or circumstances that do not fit the standard policy.
- `implementation_plan` (object): How to roll out the policy — timing, communication, transition.
- `communication_strategy` (object): How to communicate the policy in a way that is honest about the business rationale.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm employee sentiment data and business needs present.
**Output:** Readiness confirmation.
**Quality Gate:** Employee retention risk data and business rationale both present.

---

### Phase 1: Assess Retention Risk Under Different Scenarios
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Model retention risk at three policy levels: current policy, moderate tightening (e.g., 2-3 days in office), and full return (4-5 days). 2. Identify which specific roles, teams, and individuals are highest risk at each level. 3. Calculate replacement cost for the highest-risk departures. 4. Cross-reference with HR's benchmark data — how aggressive is the proposed direction relative to market?
**Output:** Retention risk by policy scenario, high-risk individual/role list, replacement cost model, market comparison.
**Quality Gate:** Retention risk is specific to roles and individuals, not general sentiment.

---

### Phase 2: Validate the Business Need
**Entry Criteria:** Retention risk assessed.
**Actions:** 1. Assess each of leadership's stated reasons for RTO — is the collaboration or culture problem they are observing actually caused by remote work, or does it have a different root cause? 2. Identify which problems genuinely require in-person presence vs. which can be addressed with better async practices or structured in-person events. 3. Check whether leadership's non-negotiables conflict with highest retention-risk roles. 4. Identify where HR's concerns about leadership direction are data-backed vs. anticipatory.
**Output:** Business need validity assessment, problems requiring vs. not requiring in-person presence, non-negotiable conflict check.
**Quality Gate:** Business needs are validated against evidence. "Culture feels weaker" is not a business need without evidence of what has actually degraded.

---

### Phase 3: Design the Policy Options
**Entry Criteria:** Business need validated.
**Actions:** 1. Design 2-3 policy options that range from leadership's preferred direction to a more flexible approach. 2. For each option: model retention risk, business need coverage, implementation complexity, and market competitiveness. 3. Build the exception framework — role-based exceptions, individual accommodations, team-level flexibility. 4. Draft the implementation plan with timeline and change management approach.
**Output:** Policy options with retention and business tradeoffs, exception framework, implementation plan.
**Quality Gate:** Every option is a real choice — not a strawman. Retention risk is modeled at each level, not estimated.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Options designed.
**Actions:** 1. Present retention risk assessment by scenario. 2. Present business need validation. 3. Deliver policy options with tradeoffs. 4. Deliver exception framework. 5. Deliver implementation and communication plan.
**Output:** Full synthesis — retention risk, business validation, policy options, exception framework, implementation plan.
**Quality Gate:** Leadership can make a policy decision with full understanding of the retention consequences. HR has a policy they can implement and defend.

---

## Exit Criteria
Done when: (1) retention risk modeled at three policy scenarios with replacement costs, (2) business needs validated against evidence, (3) three policy options with retention and business tradeoffs, (4) exception framework covers key cases, (5) implementation plan with communication approach.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
