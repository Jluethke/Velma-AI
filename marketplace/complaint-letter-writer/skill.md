# Complaint Letter Writer

Writes effective complaint letters and dispute communications that actually get results. Covers billing errors, defective products, poor service, insurance denials, landlord issues, and HOA disputes. Structures arguments with evidence, cites consumer rights where applicable, and escalates through proper channels.

## Execution Pattern: ORPA Loop

## Inputs
- issue: string -- What happened, in your own words. The more specific the better.
- company_or_entity: string -- Who you're complaining to (company name, landlord, insurance company, government agency)
- desired_outcome: string -- What you want: refund, replacement, apology, policy change, contract cancellation, repair
- evidence: array -- (Optional) What you have: receipts, photos, emails, dates, names of people you spoke with, reference numbers
- previous_attempts: array -- (Optional) What you've already tried ("called 3 times", "spoke to manager on March 5th")
- urgency: string -- (Optional) Any deadlines: statute of limitations, warranty expiration, lease renewal date

## Outputs
- complaint_letter: object -- Formal letter ready to send (email or print) with all sections
- escalation_path: array -- Who to contact if the first letter doesn't work (supervisor, regulatory body, small claims court)
- evidence_checklist: array -- What evidence to gather or attach
- follow_up_plan: object -- When to follow up and what to say

## Execution

### OBSERVE: Assess the Situation
**Entry criteria:** Issue description provided.
**Actions:**
1. Classify complaint type: billing/financial, product defect, service failure, contract dispute, safety issue, discrimination, privacy violation.
2. Identify the entity's dispute resolution structure: customer service -> supervisor -> executive team -> regulatory body -> legal.
3. Note any applicable consumer protections: warranty laws, cooling-off periods, chargeback rights, tenant rights, insurance regulations.
4. Assess evidence strength: documented (dates, names, reference numbers) vs. undocumented (verbal promises, "they said").
5. Calculate what you're owed: specific dollar amount, specific remedy, or both.
6. Check for time-sensitive deadlines: chargeback windows (typically 60-120 days), warranty periods, statute of limitations.

**Output:** Complaint classification, evidence assessment, applicable protections, specific remedy sought, and any deadlines.
**Quality gate:** Specific remedy is defined (dollar amount or action). Deadlines identified. Evidence gaps noted.

### REASON: Build the Argument
**Entry criteria:** Situation assessed.
**Actions:**
1. Structure the argument chronologically: what was promised/expected -> what actually happened -> impact on you -> what you want done.
2. Identify the strongest leverage points:
   - Documented evidence (receipts, screenshots, recordings where legal)
   - Regulatory obligations the company must follow
   - Reputational risk (BBB complaint, social media, review sites)
   - Legal exposure (consumer protection violations, breach of contract)
3. Draft in assertive-not-aggressive tone: state facts, cite evidence, make a clear ask, set a deadline.
4. Avoid emotional language, threats, ALL CAPS, or insults. These reduce effectiveness.
5. Include a reasonable deadline for response (10-14 business days for written complaints).

**Output:** Argument structure with evidence citations, leverage points, and tone guidance.
**Quality gate:** Every claim has supporting evidence or a clear statement that evidence is being gathered. Tone is firm and professional.

### PLAN: Draft the Letter
**Entry criteria:** Argument structured.
**Actions:**
1. Write the letter with this structure:
   - **Header:** Your contact info, date, recipient's name/title/address
   - **Subject line / Re:** Account number, order number, or reference ID
   - **Opening paragraph:** State the problem in 1-2 sentences. Include date of purchase/service and what went wrong.
   - **Details paragraph:** Chronological account with specific dates, names, and reference numbers.
   - **Impact paragraph:** How this affected you (financial loss, time wasted, safety risk).
   - **Resolution paragraph:** Exactly what you want and by when. "I am requesting a full refund of $X by [date]."
   - **Escalation note:** "If this matter is not resolved by [date], I will [file with BBB / contact state AG / pursue chargeback / consult an attorney]."
   - **Closing:** Professional sign-off with your full name and contact info.
2. Attach or reference all evidence.
3. Note "cc:" if copying a regulatory body or attorney (even the appearance of escalation increases response rate).

**Output:** Complete complaint letter, formatted for email or print.
**Quality gate:** Letter has specific dates, amounts, and reference numbers. Resolution request is explicit. Deadline is set.

### ACT: Deliver with Escalation Plan
**Entry criteria:** Letter drafted.
**Actions:**
1. Recommend delivery method: email (fastest, creates record), certified mail (for legal matters, proves receipt), both for serious disputes.
2. Provide escalation path if no response:
   - Step 1: Send letter to customer service / general inbox
   - Step 2 (after deadline): Escalate to supervisor or executive team (provide email format patterns like firstname.lastname@company.com)
   - Step 3: File with relevant regulatory body (FTC, CFPB, state attorney general, BBB, state insurance commissioner)
   - Step 4: Credit card chargeback (if applicable, within window)
   - Step 5: Small claims court (for amounts typically under $5,000-$10,000 depending on state)
3. Create follow-up timeline: when to send a reminder, when to escalate, when to file regulatory complaint.
4. Generate evidence checklist: what to save, screenshot, or request in writing.

**Output:** Delivery recommendations, escalation ladder, follow-up timeline, evidence preservation checklist.
**Quality gate:** Escalation path has specific next steps with contact info where possible. Follow-up dates are set.

## Exit Criteria
Done when: (1) complaint letter is complete with specific facts, amounts, and deadlines, (2) escalation path is documented with at least 3 levels, (3) evidence checklist is provided, (4) follow-up plan has specific dates.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | No evidence at all | Adjust -- draft letter based on account of events, recommend gathering evidence before sending |
| OBSERVE | Legal situation beyond consumer complaint (fraud, discrimination, injury) | Flag -- recommend attorney consultation, note that this skill is not legal advice |
| REASON | Company is known to be unresponsive | Adjust -- skip initial letter, start at escalation level 2 (executive email) or regulatory filing |
| PLAN | Multiple issues with same company | Adjust -- consolidate into one comprehensive letter, list issues chronologically |
| ACT | User rejects the draft letter or says it doesn't match their situation | **Adjust** -- incorporate specific feedback (e.g., tone too aggressive or too soft, missing a key fact, wrong remedy amount), revise the affected sections of the letter, and regenerate the final version; do not restart from OBSERVE unless the core facts of the situation were misunderstood |

## Reference

### Complaint Type → Best Leverage Point

| Complaint Type | Strongest Leverage | Regulatory Body (US) |
|---|---|---|
| Credit card billing error | Chargeback right (Fair Credit Billing Act, 60-day window) | CFPB |
| Defective product | Implied warranty of merchantability | State AG / FTC |
| Insurance denial | State insurance regulations, bad faith laws | State Insurance Commissioner |
| Landlord issue | State tenant rights laws, habitability requirements | State Housing Authority |
| HOA dispute | CC&Rs, state HOA statutes | State Real Estate Commission |
| Service failure | Contract breach, consumer protection law | State AG / BBB |
| Privacy violation | CCPA (California), GDPR (EU), COPPA | FTC |

### Effective Complaint Letter Formula

```
PROBLEM (1-2 sentences) + EVIDENCE (specific dates, amounts, reference numbers)
+ IMPACT (what you lost: money, time, safety)
+ ASK (exact remedy with dollar amount or specific action)
+ DEADLINE (10-14 business days)
+ ESCALATION WARNING (state next step you will take if not resolved)
```

### Escalation Ladder

1. Customer service (email + phone, same day)
2. Supervisor / executive escalation (3-5 days after step 1)
3. Regulatory filing (BBB, CFPB, state AG) — creates official record
4. Credit card chargeback — must be within 60-120 days of charge
5. Small claims court — typically under $5,000–$10,000 (varies by state)
6. Demand letter with attorney (for larger amounts or serious violations)

### Chargeback Time Windows (US)

| Card Network | Window |
|---|---|
| Visa | 120 days from transaction |
| Mastercard | 120 days from transaction |
| American Express | 120 days from transaction |
| Discover | 120 days from transaction |

If outside the window, skip chargeback and go directly to regulatory filing.

## State Persistence
- Complaint tracker (issue, company, status, response history)
- Evidence archive (what evidence exists for each complaint)
- Escalation progress (which steps have been taken)
- Company response patterns (which companies respond to what approaches)
- Resolution outcomes (what worked, to inform future complaints)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
