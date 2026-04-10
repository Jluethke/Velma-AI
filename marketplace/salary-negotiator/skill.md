# Salary Negotiator

Takes your offer details, market data, experience level, and competing offers, then builds a negotiation strategy with exact scripts for each scenario. Covers initial offers, counter-offers, benefits negotiation, and "what if they say no." Explains common employer tactics and how to respond. Designed for people who've never negotiated (or always accepted the first offer).

## Execution Pattern: ORPA Loop

## Inputs
- offer: object -- The offer you received: base salary, bonus structure, equity/stock options, benefits, PTO, start date, job title, and any other terms mentioned
- role_details: object -- Job title, company name, company size (startup/mid/enterprise), location (for cost-of-living context), and whether remote/hybrid/onsite
- your_profile: object -- Years of experience, current salary (if comfortable sharing), relevant skills or certifications, education level, and any unique value you bring (rare expertise, book of business, security clearance, etc.)
- competing_offers: array -- (Optional) Other offers or active interview processes you have, with whatever details you're willing to share
- constraints: object -- (Optional) Non-negotiables ("I need remote work", "I need to start after June 1"), dealbreakers ("I won't relocate"), and flexibility areas ("salary is most important" vs. "I'd trade salary for more PTO")
- comfort_level: string -- (Optional) How comfortable you are negotiating: "never done it", "done it but hated it", "somewhat comfortable", "experienced negotiator"

## Outputs
- market_analysis: object -- Salary range for this role, location, and experience level, with sources and confidence level
- negotiation_strategy: object -- Overall approach (what to ask for, what order, what to concede) with rationale
- scripts: array -- Word-for-word scripts for each negotiation scenario: initial counter, responding to pushback, negotiating benefits, and accepting/declining
- tactics_guide: object -- Common employer negotiation tactics explained with counter-strategies
- decision_framework: object -- Side-by-side comparison of current offer vs. target, with total compensation calculation including benefits value

## Execution

### OBSERVE: Analyze the Offer and Your Position
**Entry criteria:** An offer (even verbal or partial) and basic role details provided.
**Actions:**
1. Break down the total compensation package, not just base salary:
   - Base salary (annual, before tax).
   - Bonus: guaranteed vs. discretionary, percentage vs. fixed, when paid.
   - Equity: stock options (strike price, vesting schedule, cliff), RSUs (vesting, current stock price), or profit sharing.
   - Benefits: health insurance (what the company pays vs. your premium), dental, vision, life, disability.
   - Retirement: 401(k) match percentage and vesting schedule.
   - PTO: vacation days, sick days, personal days, holidays. Paid or unpaid parental leave.
   - Perks: signing bonus, relocation assistance, professional development budget, WFH stipend, tuition reimbursement.
2. Calculate the total annual compensation value (base + average bonus + annual equity value + employer benefit contributions).
3. Assess your negotiating leverage:
   - **Strong leverage:** competing offers, rare skills, employer urgency to fill the role, you're currently employed (no desperation).
   - **Moderate leverage:** strong interview performance, relevant experience exceeding requirements, industry connections.
   - **Weak leverage:** no competing offers, career change with limited relevant experience, long unemployment, entry-level with many candidates.
4. Identify what the employer values most about you (why they chose you over other candidates) -- this is your leverage anchor.
5. Note any red flags in the offer: below-market base, unusually high "on-target earnings" that depend on unrealistic targets, vesting cliffs that require 4 years to see equity, benefits that don't start for 90 days.

**Output:** Total compensation breakdown, leverage assessment, employer value anchor, and red flag list.
**Quality gate:** Total comp is calculated (not just base salary). Leverage honestly assessed. Red flags identified.

### REASON: Build the Negotiation Strategy
**Entry criteria:** Offer analysis and leverage assessment complete.
**Actions:**
1. Determine the target: what should you ask for? Use market data to set three numbers:
   - **Walk-away number:** The minimum you'll accept. Below this, the job isn't worth taking. Factor in cost-of-living, commute costs, and opportunity cost of leaving current role.
   - **Target number:** What you'd be genuinely happy with. Typically 10-20% above the offer for strong leverage, 5-10% for moderate leverage.
   - **Aspirational number:** Your opening counter. Should be ambitious but defensible (not so high it seems delusional). Typically 15-25% above the offer.
2. Plan the negotiation sequence (order matters):
   - Lead with base salary (it compounds year over year -- a higher base raises future increases, bonuses, and 401k matches).
   - If base salary is truly fixed ("government pay band", "company policy"), pivot to signing bonus (one-time cost to employer, easier to approve).
   - Then negotiate equity or bonus structure.
   - Then PTO, start date, title, remote flexibility, professional development budget.
   - Save easy concessions for last -- things you don't care about that you can "give up" to make the employer feel they got something.
3. Anticipate employer responses and prepare counters for each:
   - "This is our best offer" -- rarely true. Ask: "I understand there may be constraints. Is there flexibility in other areas like signing bonus, PTO, or equity?"
   - "We don't negotiate" -- some companies genuinely don't (some government, some startups with standardized bands). If true, negotiate start date, title, or review timeline instead.
   - "We need an answer by Friday" -- pressure tactic. "I want to give this the consideration it deserves. Can I have until next Wednesday?" Most deadlines are soft.
   - "What are you currently making?" -- deflect: "I'd rather focus on the value I'd bring to this role and what's fair for the market."
4. If competing offers exist, plan how and when to mention them. Never bluff a competing offer you don't have. If you do have one, use it factually: "I have another offer at $X, and I'd prefer to work here. Can you match or come closer?"
5. Decide on communication channel: email gives you time to think and creates a paper trail. Phone or in-person lets you read tone and build rapport. Recommend email for the counter-offer, phone for the discussion.

**Output:** Three-number range (walk-away, target, aspirational), negotiation sequence, anticipated pushback with counters, communication plan.
**Quality gate:** All three numbers are market-justified. Pushback responses cover the 5 most common employer tactics. Strategy matches the user's comfort level.

### PLAN: Write the Scripts
**Entry criteria:** Strategy finalized.
**Actions:**
1. Write the initial counter-offer script (email format):
   - Open with enthusiasm: "Thank you for the offer. I'm genuinely excited about the opportunity to [specific thing about the role]."
   - State your case: "Based on my [experience/skills/unique value] and the market rate for this role in [location], I was hoping we could discuss the compensation."
   - Make the ask: "Would a base salary of $[aspirational number] be possible? I believe this reflects [justification: market data, your unique value, competing offer]."
   - Close warm: "I'm very enthusiastic about joining the team and want to make sure we find a package that works for both of us."
2. Write the phone follow-up script for when they respond to the email:
   - If they meet your ask: acceptance script with confirmed terms in writing.
   - If they counter in the middle: "I appreciate you working with me on this. [Target number] would make this work for me. Can we land there?"
   - If they hold firm: pivot script to non-salary items.
   - If they rescind (rare but scary): "I understand. I want to make sure -- is the original offer still on the table? I'd like to take 24 hours to consider."
3. Write the benefits negotiation script:
   - Signing bonus: "If the base salary is firm, would a signing bonus of $[amount] be possible to bridge the gap?"
   - PTO: "Could we start me at [X] weeks instead of [Y]? This is important to me for work-life balance."
   - Start date: "Would [date] work as a start date? I want to wrap up my current commitments professionally."
   - Remote/hybrid: "Is there flexibility to work remotely [X days] per week?"
   - Title: "Could we adjust the title to [Senior/Lead/etc.]? It better reflects the scope of the role."
4. Write the acceptance script (once terms are agreed):
   - Confirm all negotiated terms in writing.
   - Express genuine enthusiasm.
   - Ask about next steps (background check, paperwork, onboarding).
5. Write the decline script (if you choose not to accept):
   - Brief, gracious, and professional.
   - Leave the door open: "I hope our paths cross again in the future."
   - Don't over-explain or apologize.
6. Adjust all scripts to the user's comfort level:
   - "Never done it" users: more detailed, with notes on tone and pacing. Include what to do if you get nervous (it's okay to pause, ask for a moment, or say you'll follow up via email).
   - "Experienced" users: concise frameworks they can personalize.

**Output:** Complete script library covering every negotiation scenario, tailored to user's comfort level.
**Quality gate:** Every script sounds like a real human (not a template). Tone is confident but not aggressive. All scripts include graceful fallback positions.

### ACT: Deliver the Strategy Package
**Entry criteria:** Scripts and strategy complete.
**Actions:**
1. Present the market analysis first: "Here's what this role pays in your market, and here's where your offer falls." This gives the user confidence that their ask is reasonable.
2. Walk through the negotiation strategy: what to ask for, in what order, and why.
3. Deliver scripts for each scenario with coaching notes: "Send this email first. They'll likely respond with X. Here's what to say."
4. Explain common employer tactics so the user recognizes them in the moment:
   - Exploding offers (artificial deadlines to prevent comparison shopping).
   - "The budget is set" (often true for base but not for signing bonus or equity).
   - Appealing to fairness ("this is what everyone at your level makes") -- ask for the band and where you fall in it.
   - The guilt trip ("we already stretched for you") -- stay appreciative but firm.
5. Deliver the decision framework: a side-by-side comparing current offer, your counter, and the total value of each (including benefits, equity, commute costs, quality of life factors).
6. Provide the post-negotiation checklist: get everything in writing, review the formal offer letter against verbal agreements, check benefits enrollment deadlines, plan your resignation from current job (if applicable).
7. Remind the user: "Negotiating is normal. Employers expect it. No one has ever had an offer rescinded for asking politely. The worst they can say is no, and then you're right back where you started."

**Output:** Complete negotiation package: market analysis, strategy, scripts, tactics guide, decision framework, and post-negotiation checklist.
**Quality gate:** User understands their market value. Scripts are ready to use. User knows what to do in every likely scenario. Decision framework makes the tradeoffs clear.

## Exit Criteria
Done when: (1) total compensation is broken down and valued, (2) market salary range is established with sources, (3) negotiation strategy with three target numbers is set, (4) scripts cover initial counter, pushback responses, benefits negotiation, acceptance, and decline, (5) common employer tactics are explained, (6) decision framework compares offer scenarios side by side.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | User doesn't have a formal offer yet (just a verbal mention) | Adjust -- prepare scripts to ask for the offer in writing first. No negotiation until you have something concrete |
| OBSERVE | Offer is already above market rate | Adjust -- shift strategy from salary negotiation to benefits, title, or equity optimization. Don't negotiate just to negotiate |
| REASON | User has no leverage (no competing offers, entry-level, long unemployment) | Adjust -- focus on non-salary items, negotiate a 6-month salary review clause, and set realistic expectations. Even low-leverage candidates can negotiate PTO and start date |
| REASON | User's walk-away number is above market rate | Escalate -- explain the gap honestly: "The market for this role in your area is $X-$Y. Asking for $Z may not be realistic. Here's how to build toward that number over 1-2 years" |
| PLAN | User is too anxious to negotiate at all | Adjust -- provide an email-only strategy (no phone negotiation required). Frame it as a single email with a single ask. "You don't have to be a negotiator. You just have to send one email" |
| ACT | Employer rescinds the offer during negotiation | Emergency protocol -- this is extremely rare and usually means the company has serious culture problems. Provide script to ask if original offer stands. If truly rescinded, reframe as a bullet dodged |
| ACT | User rejects final output | **Targeted revision** -- ask which section fell short (market analysis, three-number range, a specific script, or the employer tactics guide) and rerun only that section. Do not rebuild the full strategy. |

## State Persistence
- Salary history and progression (track offers, negotiations, and outcomes over time)
- Market rate benchmarks by role and location (update with each new negotiation)
- Successful scripts and tactics (which approaches actually worked for this user)
- Benefits valuation models (health insurance costs, 401k match value, equity calculations)
- Negotiation comfort level trajectory (track improvement from "never done it" to "comfortable")
- Company-specific negotiation intelligence (which companies negotiate, which don't, typical flexibility areas)

---

## Reference

### Three-Number Framework

| Number | Definition | Typical Range vs. Offer |
|---|---|---|
| Walk-away | Minimum acceptable; below this, don't take the job | Market minimum or current salary |
| Target | What you'd be genuinely happy with | 10-20% above offer (strong leverage) / 5-10% (moderate) |
| Aspirational | Opening counter; ambitious but defensible | 15-25% above offer |

### Leverage Assessment

| Level | Signals |
|---|---|
| Strong | Competing offer in hand, rare skills, currently employed, employer urgency |
| Moderate | Strong interview, relevant experience exceeding requirements, industry connections |
| Weak | No competing offers, career change, long unemployment, entry-level with many candidates |

### Negotiation Sequence (Order Matters)

1. Base salary — compounds into future raises, bonuses, 401(k) matches
2. Signing bonus — one-time cost; easier to approve when base is "firm"
3. Equity / bonus structure
4. PTO, start date, title, remote flexibility
5. Professional development budget, WFH stipend (easy concessions — save for last)

### Common Employer Tactics + Counter-Strategies

| Tactic | Counter |
|---|---|
| "This is our best offer" | "I understand. Is there flexibility in signing bonus, PTO, or equity?" |
| "We don't negotiate" | Negotiate start date, title, review timeline instead |
| "We need an answer by Friday" | "Can I have until Wednesday? I want to give this the consideration it deserves." |
| "What are you making now?" | "I'd rather focus on the value I'd bring and what's fair for the market." |
| "We already stretched for you" | Stay appreciative but firm: "I really appreciate that, and I want to make this work." |

### Benefits Valuation Quick Reference

| Benefit | Rough Annual Value |
|---|---|
| Health insurance (employer share) | $5,000-$15,000 |
| 401(k) match (5% on $80K salary) | $4,000 |
| Each week of PTO | ~2% of base salary |
| Remote work (no commute) | $3,000-$7,000 in time + costs |
| Signing bonus (one-time) | Face value ÷ years before you can leave |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.