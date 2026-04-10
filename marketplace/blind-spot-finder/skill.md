# Blind Spot Finder

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

You don't know what you don't know. This skill takes any plan, idea, or situation and systematically surfaces the things you haven't considered — the questions you should be asking but aren't. Not advice. Not answers. The questions themselves.

Most people make decisions based on what's visible. This skill forces you to look in the corners.

## Execution Pattern: ORPA Loop

## Inputs
- situation: string -- What you're planning, deciding, or dealing with. Plain language.
- what_you_know: string -- What you've already considered. What feels certain.
- what_worries_you: string -- What you're already nervous about (so we don't repeat it).
- domain: string -- (Optional) Area of life: career, money, health, relationships, business, home, family

## Outputs
- blind_spots: array -- Questions you haven't asked, organized by category. Each has: the question, why it matters, what could go wrong if you don't ask it, and who might know the answer.
- assumptions: array -- Things you're treating as facts that might not be. Each has: the assumption, why it might be wrong, and how to test it.
- second_order: array -- Consequences of consequences. "If X happens, then Y happens, which means Z." The dominoes you haven't lined up.
- who_else: array -- People, roles, or perspectives you haven't consulted. Each has: who they are, what they'd see that you don't, and what question to ask them.
- the_one_question: string -- The single most important question you should answer before proceeding.

## Execution

### OBSERVE: Map What You See
**Entry criteria:** Situation described.
**Actions:**
1. Identify what the person has explicitly considered. Note the mental model they're using.
2. Identify what domain they're operating in and what domains they're NOT thinking about (financial implications of a health decision, relationship implications of a career move, etc.).
3. Note the timeframe they're thinking in. Most people think too short. What happens in 6 months? 2 years? 10 years?
4. Identify stakeholders they've mentioned and stakeholders they haven't. Who else is affected?
5. Map their emotional state from what worries them — fear-driven blind spots differ from excitement-driven ones.

**Output:** Mental model map: what they see, what frame they're using, time horizon, stakeholder list (mentioned and missing).
**Quality gate:** At least 2 unconsidered domains identified. At least 1 missing stakeholder found.

### REASON: Find What's Missing
**Entry criteria:** Mental model mapped.
**Actions:**
1. **Assumption audit:** List every implicit assumption in their plan. "I assume I'll still have this job." "I assume prices won't change." "I assume my partner agrees." Challenge each one: what if it's wrong?
2. **Inversion:** What would make this plan fail completely? Work backwards from failure. What has to go right for this to work, and which of those things are outside your control?
3. **Adjacent domains:** For each unconsidered domain, generate the key question:
   - Money decision but no health question? "How will the stress of this affect your health?"
   - Career decision but no relationship question? "Have you talked to your partner about what this means for them?"
   - Business plan but no legal question? "What happens if a customer gets hurt/scammed/disappointed?"
4. **Temporal blind spots:** What's true now that won't be true in a year? What changes are already in motion that this plan doesn't account for?
5. **Second-order effects:** For every expected outcome, ask "and then what?" at least twice. First-order: you get promoted. Second-order: you manage people. Third-order: you have less time to code, which is what you love.
6. **The question they're avoiding:** Based on what they told you, what question are they deliberately not asking themselves? The hard one. The uncomfortable one. That's usually the most important one.

**Output:** Categorized blind spots, challenged assumptions, second-order chains, the avoided question.
**Quality gate:** At least 5 blind spots surfaced. At least 3 assumptions challenged. The avoided question is genuinely uncomfortable (not a softball).

### PLAN: Prioritize What to Investigate
**Entry criteria:** Blind spots identified.
**Actions:**
1. Rank blind spots by: (a) likelihood of mattering, (b) cost of being wrong, (c) ease of investigating.
2. For each: suggest who to talk to, what to research, or what to test.
3. Identify which assumptions can be tested cheaply and quickly (ask someone, google it, run a small experiment) vs. which require real commitment to investigate.
4. Flag any "point of no return" assumptions — things that, if wrong, can't be fixed after you commit.

**Output:** Prioritized investigation plan with specific next steps per blind spot.
**Quality gate:** Top 3 blind spots have specific, actionable investigation steps. Point-of-no-return assumptions are flagged.

### ACT: Deliver the Wake-Up Call
**Entry criteria:** Blind spots prioritized.
**Actions:**
1. Present blind spots as questions, not warnings. "Have you considered...?" not "You failed to consider..."
2. Lead with the most important overlooked question.
3. End with "the one question" — the single thing they should answer before doing anything else.
4. Frame the output as empowering, not paralyzing. The point isn't to scare them out of acting. It's to help them act with eyes open.

**Output:** Structured blind spot report: questions to ask, assumptions to test, people to consult, and the one question.
**Quality gate:** Tone is curious, not judgmental. Questions are specific enough to answer. The one question is genuinely the most important.

## Exit Criteria
Done when: (1) at least 5 blind spots are surfaced as questions, (2) at least 3 assumptions are challenged with tests, (3) second-order effects are traced at least 2 levels deep, (4) missing perspectives are identified with specific people to consult, (5) the one question is identified.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Situation is vague | Ask for specifics: what are you actually deciding? What's the timeline? |
| OBSERVE | Person says "I've thought of everything" | That's the biggest blind spot. Dig into what "everything" means. |
| REASON | All blind spots are obvious | Go deeper. Look at relationships, identity, precedent, and opportunity cost. |
| PLAN | Investigation feels overwhelming | Prioritize ruthlessly. "If you can only check one thing, check THIS." |
| ACT | Person gets defensive | Reframe: these aren't criticisms, they're free intelligence. |
| ACT | Person rejects the blind spots or says they've already considered them | **Adjust** -- acknowledge what they've already addressed, dig one level deeper into each dismissed blind spot, and surface second- or third-order consequences they may not have traced; do not restart from OBSERVE unless the original situation description was fundamentally incomplete |
| ACT | User rejects final output | **Targeted revision** -- ask which blind spot category or assumption fell short and rerun only that analysis. Do not re-examine all dimensions. |

## Reference

### Blind Spot Categories Framework

| Category | What to Look For | Example Prompt |
|---|---|---|
| Financial | Hidden costs, opportunity costs, funding gaps | "What does this cost in time, money, and attention that you haven't accounted for?" |
| Relational | Impact on people not mentioned, relationship debt | "Who else is affected by this decision who hasn't been consulted?" |
| Temporal | Short-term vs long-term tradeoffs, irreversibility | "What is true now that won't be true in 12 months?" |
| Second-order | Downstream consequences of expected outcomes | "If X happens as planned, then what? And then what?" |
| Regulatory / Legal | Compliance requirements, liability exposure | "What permission, approval, or compliance does this require?" |
| Psychological | Confirmation bias, sunk cost, loss aversion | "What evidence would change your mind, and are you actually looking for it?" |

### Inversion Method (Work Backward from Failure)

1. State the goal: "I want [outcome]."
2. Invert: "How would I guarantee this fails?"
3. List failure conditions: everything that must go right that is outside your control
4. For each: Is this assumption validated? What is the consequence if it's wrong? Is it reversible?

### Assumption Testing Matrix

| Assumption | How to Test | Cost | Time | Point of No Return? |
|---|---|---|---|---|
| (fill per situation) | Ask / research / small experiment | Low/Med/High | Days/Weeks/Months | Yes/No |

**Point-of-no-return assumptions** are those that, if wrong, cannot be corrected after you commit. These must be tested first.

### Second-Order Consequence Chain

```
First-order:  [Expected outcome]
              ↓
Second-order: [What happens next as a result]
              ↓
Third-order:  [What happens after that — the part nobody thinks about]
```

Example: Get promoted → Manage people → Less time coding → Lose the skill you most enjoy

## State Persistence
- Previous blind spot analyses (to spot patterns: "you always forget to consider the relationship impact")
- Assumption accuracy tracking (were challenged assumptions actually wrong?)
- Investigation follow-up (did they actually check?)

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
