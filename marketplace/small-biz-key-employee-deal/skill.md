# Small Business Key Employee Deal

**One-line description:** The owner and their most important employee each submit what they actually want from the employment relationship — AI finds the retention package that keeps the person, fits the business's finances, and does not create equity or legal problems down the road.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both owner and key employee must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_business_name` (string, required): Business name.
- `shared_employee_role` (string, required): Role and tenure of the key employee.

### Business Owner Submits Privately
- `owner_what_this_person_is_worth_to_the_business` (object, required): What revenue, relationships, or capabilities would the owner lose if this person left?
- `owner_what_they_can_afford_to_pay` (object, required): Total comp ceiling — base, bonus, benefits, equity if any — and what the business can sustain.
- `owner_equity_position` (string, required): Are you open to equity, profit-sharing, or phantom equity? What are your limits and concerns?
- `owner_concerns_about_retaining_this_person` (array, required): What do you think they want that you cannot or will not give? What are you worried about?
- `owner_concerns_about_giving_too_much` (array, required): What keeps you from just offering more — cash flow, precedent, fairness to other staff, control?

### Key Employee Submits Privately
- `employee_what_they_want` (object, required): What does it take to stay — compensation, title, flexibility, growth, ownership, recognition?
- `employee_what_they_are_considering` (string, required): Are you actively looking? Do you have an offer? What is the alternative to staying?
- `employee_what_matters_most_vs_nice_to_have` (object, required): Rank your priorities — what is a deal-breaker vs. what you would give up if something else were right?
- `employee_concerns_about_the_business` (array, required): What worries you about the business's future, the owner's plans, or your trajectory here?
- `employee_what_would_make_them_feel_valued` (string, required): Beyond comp — what recognition, authority, involvement, or respect do you need to want to stay?

## Outputs
- `retention_risk_assessment` (object): How close is this person to leaving and what is most likely to keep them.
- `compensation_package_design` (object): The specific package — base, bonus structure, benefits, equity or equity alternative — that fits both parties.
- `equity_and_ownership_recommendation` (object): Whether equity, phantom equity, or profit-sharing makes sense, and how to structure it if so.
- `non_monetary_retention_plan` (object): Title, authority, involvement, flexibility, and recognition changes that address what the employee said they need.
- `retention_conversation_guide` (object): How to have the retention conversation — what to say, what to offer when, what to avoid.
- `risk_if_no_deal` (object): What the business loses if this person leaves — revenue, customers, knowledge — and what it costs to replace them.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm owner's budget and employee's requirements present.
**Output:** Readiness confirmation.
**Quality Gate:** Owner's compensation ceiling and employee's stated needs both present.

---

### Phase 1: Assess Retention Risk and Gap
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Assess how urgent the retention risk is — is the employee actively looking, passively open, or committed but undervalued? 2. Compare what the employee wants against what the owner can offer — where is there alignment and where is the gap? 3. Identify the employee's true priorities — what they said they want most vs. most likely to leave for. 4. Assess the owner's real constraints — what is financial vs. what is reluctance or precedent concern?
**Output:** Retention urgency assessment, gap map, employee priority ranking, owner constraint analysis.
**Quality Gate:** Gap is specific — "employee wants equity, owner's ceiling is phantom equity, base gap is $X, title change is available."

---

### Phase 2: Design the Package
**Entry Criteria:** Gap assessed.
**Actions:** 1. Design the total comp package — base, bonus structure, benefits — within the owner's ceiling and above the employee's floor. 2. If equity is in play: design phantom equity or profit-sharing if real equity is not on the table — what triggers payment, what is the pool, what are the vesting terms. 3. Identify non-monetary elements — title, reporting structure, authority, flexibility — that address the employee's stated emotional needs. 4. Assess the cost of retention vs. cost of replacement — make the business case explicit.
**Output:** Total comp package, equity/phantom equity design, non-monetary plan, retention ROI.
**Quality Gate:** Package is specific enough to offer. Equity alternative has specific terms — pool size, vesting schedule, trigger events.

---

### Phase 3: Build the Retention Conversation
**Entry Criteria:** Package designed.
**Actions:** 1. Write the retention conversation guide — how to open, what to offer, how to frame it. 2. Define what to offer first vs. hold in reserve. 3. Anticipate the employee's likely response and prepare the follow-up. 4. Define what the owner will not do and how to say so while keeping the relationship intact.
**Output:** Conversation guide, offer sequence, response preparation, limits framing.
**Quality Gate:** Conversation guide is specific — opening line, offer framing, response to pushback. Not generic talking points.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Conversation built.
**Actions:** 1. Present retention risk assessment. 2. Deliver compensation package design. 3. Deliver equity/ownership recommendation. 4. Deliver non-monetary retention plan. 5. Present conversation guide and risk-if-no-deal.
**Output:** Full synthesis — retention risk, package, equity, non-monetary plan, conversation guide.
**Quality Gate:** Owner goes into the conversation with a specific offer and a plan for what comes next.

---

## Exit Criteria
Done when: (1) retention urgency assessed, (2) compensation package is specific with all components, (3) equity position is resolved, (4) non-monetary plan addresses employee's stated needs, (5) conversation guide is specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
