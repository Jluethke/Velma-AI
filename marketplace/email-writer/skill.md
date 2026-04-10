# Email Writer

Drafts professional, personal, or difficult emails based on the situation, relationship, and desired outcome. Handles everything from "how do I ask my boss for a raise" to "I need to complain about a billing error" to "what do I say when someone dies." Adjusts tone, formality, and length to match the context. No jargon. No fluff.

## Execution Pattern: ORPA Loop

## Inputs
- situation: string -- What's happening and why you need to send this email (plain language)
- recipient: object -- Who it's going to: relationship (boss, client, neighbor, customer service, family), name if known, formality level
- goal: string -- What you want to happen after they read it (get a refund, schedule a meeting, express condolences, resolve a conflict)
- tone: string -- (Optional) Desired tone: professional, friendly, firm, sympathetic, apologetic, assertive. Auto-detected from situation if not provided.
- constraints: object -- (Optional) Length preference (short/medium/detailed), things to include or avoid, previous context

## Outputs
- email_draft: object -- Subject line + body, ready to copy-paste
- tone_check: string -- Confirmation of detected tone and why it fits
- alternatives: array -- 2 alternative versions if the situation is sensitive (e.g., a softer version and a firmer version)
- follow_up_suggestion: string -- When and how to follow up if no response

## Execution

### OBSERVE: Understand the Situation
**Entry criteria:** Situation description and recipient info provided.
**Actions:**
1. Classify the email type: request, complaint, apology, congratulations, condolences, follow-up, introduction, resignation, negotiation, thank-you, decline/rejection, informational.
2. Assess relationship dynamics: power dynamic (writing up, down, or laterally), familiarity level, cultural context.
3. Identify the core ask: what does the sender need the recipient to DO after reading this?
4. Detect emotional stakes: is this high-emotion (complaint, resignation, condolence) or routine (meeting request, status update)?
5. Check for landmines: legal implications (termination, harassment), relationship-ending potential, financial stakes.

**Output:** Email classification, relationship assessment, core ask, emotional stakes, and risk flags.
**Quality gate:** Core ask is identified. Tone is matched to situation. High-risk situations are flagged.

### REASON: Draft Strategy
**Entry criteria:** Situation fully understood.
**Actions:**
1. Select structure based on email type:
   - **Request:** Context -> Ask -> Why it matters -> Easy next step
   - **Complaint:** Specific issue -> Impact on you -> What you want done -> Deadline
   - **Apology:** Acknowledge what happened -> Take responsibility -> How you'll fix it -> No excuses
   - **Condolence:** Acknowledge the loss -> Share a memory or kind word -> Offer specific help -> Brief
   - **Negotiation:** Appreciate current position -> State your case with evidence -> Propose solution -> Leave room for dialogue
   - **Decline:** Thank them -> Clear no -> Brief reason (optional) -> Positive close
2. Set length target: most emails should be under 200 words. Complaints and negotiations may need 300.
3. Choose opening line: never "I hope this email finds you well" for complaints. Never "Per my last email" ever.
4. Choose closing: match formality (Best regards / Thanks / Cheers / Warmly / Respectfully).

**Output:** Draft strategy with structure, length target, opening/closing, and key points to include.
**Quality gate:** Structure matches email type. Tone is consistent throughout. No passive-aggressive language.

### PLAN: Write the Draft
**Entry criteria:** Strategy defined.
**Actions:**
1. Write subject line: specific and action-oriented. "Quick question about Thursday's meeting" not "Hello."
2. Write opening: get to the point in the first sentence. State who you are if they might not know.
3. Write body: follow the selected structure. One idea per paragraph. Short paragraphs (2-3 sentences max).
4. Write closing: clear next step or call to action. "Could you reply by Friday?" not "Let me know your thoughts whenever."
5. For sensitive emails: generate 2 alternative versions:
   - Version A: the recommended draft (balanced)
   - Version B: softer/more diplomatic
   - Version C: more direct/assertive
6. Review for common mistakes: too long, burying the ask, apologizing unnecessarily, passive voice, vague requests.

**Output:** Complete email draft with subject line, body, and closing. Plus alternatives for sensitive situations.
**Quality gate:** Subject line is specific. Ask is in the first 3 sentences. Total length appropriate. No jargon.

### ACT: Deliver and Advise
**Entry criteria:** Draft complete.
**Actions:**
1. Present the draft formatted for easy copy-paste.
2. Explain the tone choice: "I used a firm but polite tone because you're a customer with leverage."
3. Suggest timing: best day/time to send for maximum response rate (Tuesday-Thursday, 9-11 AM generally best).
4. Suggest follow-up plan: "If no response in 3 business days, forward the original with a one-line 'Following up on this' note."
5. Flag anything the sender should verify: names, dates, account numbers, amounts.

**Output:** Final draft, tone explanation, send timing suggestion, follow-up plan.
**Quality gate:** Draft is copy-paste ready. Follow-up plan is specific.

## Exit Criteria
Done when: (1) email draft has a subject line and body, (2) tone matches the situation, (3) the core ask is clear within the first 3 sentences, (4) alternatives provided for sensitive emails, (5) follow-up suggestion included.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Situation is vague ("I need to email someone") | Escalate -- ask clarifying questions: who, about what, what do you want to happen? |
| OBSERVE | Legal situation detected (termination, harassment, threat) | Flag -- recommend consulting HR or legal counsel, draft only with explicit consent |
| REASON | Conflicting goals ("I want to complain but not upset them") | Adjust -- draft the diplomatic version, explain tradeoffs between directness and relationship preservation |
| PLAN | Email is inherently impossible ("make them give me a refund they've already denied 3 times") | Adjust -- suggest escalation paths (supervisor, chargeback, consumer protection agency) instead |
| ACT | User rejects final output | Targeted revision -- ask which specific element fell short (subject line, opening, tone, length, or closing call to action) and rerun only that section. Do not regenerate the full email. |

## State Persistence
- Recipient profiles (formality level, past interactions)
- Email templates that worked well (user-confirmed sends)
- Follow-up tracking (which emails are awaiting responses)
- Tone calibration (user feedback on "too formal" / "too casual" adjustments)

## Reference

### Email Structure Templates by Type

| Email Type | Structure |
|---|---|
| Request | Context (1 sentence) → Specific ask → Why it matters → Clear next step |
| Complaint | Specific issue → Impact on you → What you want done → Deadline |
| Apology | Acknowledge exactly what happened → Take responsibility → How you'll fix it → No excuses |
| Negotiation | Appreciate current position → Evidence for your case → Proposed solution → Leave room for dialogue |
| Decline | Thank them → Clear no → Brief reason (optional) → Positive close |
| Condolence | Acknowledge the loss → Specific memory or kind observation → Offer of concrete help → Brief |

### Subject Line Rules

- Specific beats vague: "Follow-up on Tuesday's invoice #4521" beats "Following up"
- Action-oriented: "Request for 15-min call this week" beats "Question"
- Under 60 characters to avoid mobile truncation
- Never "Hello" or "Hi [name]" as a subject

### Tone vs. Relationship Matrix

| Relationship | Formality | Tone to Use |
|---|---|---|
| Senior executive / new contact | High | Professional, concise, no contractions |
| Direct manager | Medium | Professional but warmer, light contractions OK |
| Peer / colleague | Low-Medium | Friendly, direct |
| Customer service | Medium | Firm but polite, document-focused |
| Personal contact | Low | Conversational, warm |

### Common Mistakes to Avoid

- Burying the ask in paragraph 3 (put it in sentence 1 or 2)
- "I hope this email finds you well" (skip it)
- "Per my last email" (hostile)
- Passive voice ("Mistakes were made" → "I made a mistake")
- Unclear next step ("Let me know" → "Could you reply by Friday?")

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
