# Side Hustle Launcher

Takes your skills, available hours per week, startup budget, and risk tolerance, then evaluates side hustle ideas and builds a launch plan for the best fit. Covers freelancing, e-commerce, content creation, tutoring, consulting, and local services. Not "quit your job" advice -- realistic plans for making extra income while keeping your day job. Estimates time-to-first-dollar, startup costs, and income potential. Designed for people who keep saying "I should start something" but never do.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INVENTORY    --> Catalog your skills, constraints, and what you actually want from a side hustle
PHASE 2: MATCH        --> Score side hustle categories against your profile and filter to the top 3
PHASE 3: REALITY-TEST --> Stress-test each finalist with real numbers: startup cost, time-to-revenue, income ceiling
PHASE 4: LAUNCH MAP   --> Build a week-by-week action plan for the winner, from zero to first dollar
PHASE 5: GUARDRAILS   --> Set boundaries so the side hustle doesn't eat your life or your savings
```

## Inputs
- skills: array -- What you're good at, professionally and personally. Include job skills, hobbies, certifications, software you know, languages spoken, physical skills, creative skills. Don't filter -- list everything, even stuff that seems irrelevant.
- availability: object -- Hours per week you can realistically commit (not aspirationally), which hours (mornings, evenings, weekends), whether you have a flexible or rigid day job schedule, upcoming time crunches (holidays, busy season at work, kids' summer)
- budget: object -- How much you can invest upfront without stress, monthly amount you can sustain while it ramps up, what you absolutely cannot afford to lose. Include equipment and tools you already own (laptop, car, camera, tools, kitchen, etc.)
- risk_tolerance: string -- Conservative (cannot lose any money, need near-guaranteed income), moderate (can invest a few hundred and wait 2-3 months), aggressive (willing to invest $1K+ and wait 6+ months for payoff)
- goals: object -- (Optional) What you want: extra spending money ($200-500/mo), serious income supplement ($1K-3K/mo), build toward replacing your job, pay off a specific debt, fund a specific purchase
- constraints: array -- (Optional) Dealbreakers: no client-facing work, can't use real name online, no physical labor, can't drive for it, non-compete clause at current job, specific industries to avoid

## Outputs
- skills_map: object -- Your skills organized by monetizability: high-value (people pay premium for this), solid (steady demand), niche (small market but less competition), commodity (lots of competition, race to the bottom)
- hustle_scorecard: array -- Top 3 side hustle ideas scored on fit, income potential, startup cost, time-to-first-dollar, scalability, and burnout risk
- winner_analysis: object -- Deep dive on the recommended hustle: realistic income trajectory (month 1, 3, 6, 12), startup checklist, competitive landscape, pricing strategy
- launch_plan: object -- Week-by-week plan for the first 8 weeks, from setup to first paying customer
- protection_plan: object -- Boundaries, financial guardrails, and "kill switch" criteria for when to pivot or quit

## Execution

### Phase 1: INVENTORY
**Entry criteria:** At least skills list and weekly hours provided.
**Actions:**
1. Categorize skills by market demand. Separate what you're good at from what people will pay for -- they're not always the same. Writing ability is monetizable. Being good at trivia is not (usually). Being handy with tools is extremely monetizable. Being organized is monetizable if you can package it.
2. Assess real availability honestly. "10 hours a week" from someone with two kids and a commute is actually 4-6 usable hours after accounting for setup, admin, and the days when life happens. Apply a 60% realism multiplier to stated hours.
3. Map existing assets: equipment you own (computer, car, tools, camera, spare room), accounts you already have (social media following, professional network, existing website), credentials (degrees, certifications, licenses), and domain knowledge from your day job (without violating non-competes).
4. Identify the real motivation. "Extra money" is vague. Get specific: $500/month to cover car payment by March, or $2K/month to start saving for a house. The number and timeline change everything about which hustle fits.
5. Flag hard constraints: non-compete clauses (check the actual language -- most are narrower than people think), professional licensing restrictions, physical limitations, geographic limitations, and social constraints (can't put face online, can't work weekends for religious reasons, etc.).

**Output:** Skills inventory ranked by monetizability, realistic hours assessment, asset map, specific financial target with timeline, constraint list.
**Quality gate:** Skills are rated by market demand, not personal preference. Hours include the 60% realism adjustment. Financial target is specific and time-bound.

### Phase 2: MATCH
**Entry criteria:** Skills inventory and constraints established.
**Actions:**
1. Score each side hustle category against the user's profile on 6 dimensions (1-10 each):
   - **Skill fit:** How well do your existing skills match? (8+ means you can start immediately, 4-6 means you need to learn, below 4 means wrong hustle)
   - **Time fit:** Can you do this in your available hours and schedule? (Evening-only kills anything requiring business-hours client calls)
   - **Budget fit:** Can you start within your stated budget? Include hidden costs (software, insurance, inventory, marketing)
   - **Income potential:** Realistic range at 3 months and 12 months for the hours you have
   - **Speed to revenue:** How fast can you earn your first dollar? (Freelancing: days. E-commerce: weeks. Content creation: months)
   - **Burnout risk:** Will this feel like a second job you hate? (Doing your day job again on nights/weekends = high burnout)
2. Apply constraint filters: eliminate anything that violates hard constraints before scoring. No point optimizing a hustle you can't legally do.
3. Cross-reference with market timing: some hustles are seasonal (tax prep, holiday crafts), some are saturated (generic dropshipping), some are growing (AI-assisted services, sustainability consulting). Factor current market conditions.
4. Select top 3 candidates. Present the scores transparently so the user understands why each was chosen and what the tradeoffs are.
5. For each finalist, write a one-paragraph "day in the life" description: what a typical week actually looks like doing this hustle at the stated hours.

**Output:** Scored matrix of all evaluated hustles, top 3 with detailed scores and "day in the life" descriptions, eliminated options with reasons.
**Quality gate:** At least 6 hustle categories evaluated. Top 3 all score above 5.0 weighted average. No finalist violates any stated constraint.

### Phase 3: REALITY-TEST
**Entry criteria:** Top 3 finalists selected.
**Actions:**
1. Build a financial model for each finalist:
   - **Startup costs:** Everything needed before earning dollar one. Equipment, software, legal (LLC, permits), initial inventory or supplies, website/platform fees, insurance if needed. Include the free/cheap alternatives.
   - **Monthly operating costs:** Platform fees, software subscriptions, marketing spend, supplies, gas/mileage, and the cost of your time (even if you're not paying yourself yet, track the hours).
   - **Revenue projections:** Be honest. Month 1: most people earn $0-200 from a new hustle. Month 3: $200-800 if you're consistent. Month 6: $500-2K if it's working. Month 12: $1K-5K if you've found product-market fit. These are ranges, not guarantees.
   - **Break-even timeline:** When does cumulative revenue exceed cumulative costs? If the answer is "never at these hours," say so.
2. Identify the "first dollar" path for each: the single simplest way to get paid, even if it's $20. Freelancing: one gig on Upwork. E-commerce: one sale on Etsy. Tutoring: one student from Craigslist. The first dollar matters more than the thousandth.
3. Map the competitive landscape: who else is doing this, what they charge, what differentiates the user, and whether there's room for another player. Don't sugarcoat it -- if the market is flooded, say so.
4. Identify the "valley of death" for each: the period between starting and earning consistently. Content creation's valley is 3-6 months of posting to no audience. Freelancing's valley is the first 10 pitches getting rejected. Name it so the user isn't surprised.
5. Recommend the winner with a clear rationale. If two are close, explain the deciding factor (usually time-to-first-dollar for people who need motivation, or income ceiling for people who are patient).

**Output:** Financial model per finalist, first-dollar path, competitive analysis, valley-of-death warning, final recommendation with rationale.
**Quality gate:** Financial projections use conservative estimates. Break-even timeline is calculated. Valley of death is named and quantified. Winner recommendation includes "why not the others."

### Phase 4: LAUNCH MAP
**Entry criteria:** Winner selected and reality-tested.
**Actions:**
1. Build an 8-week launch plan with specific weekly milestones:
   - **Week 1:** Legal and admin setup -- business name, separate bank account (not LLC yet unless required), platform accounts, basic tools/software. Estimated time: 3-4 hours.
   - **Week 2:** Build your minimum viable offering -- the simplest version of what you're selling. One service package, one product listing, one content format. Not perfect, just functional.
   - **Week 3:** Set your pricing. Start at the lower end of market rate (you need reviews/testimonials more than profit right now). Plan to raise prices after 5 completed jobs or sales.
   - **Week 4:** Get your first customer through warm outreach -- friends, family network, social media announcement, local community groups. Not cold pitching yet. One customer, not ten.
   - **Weeks 5-6:** Deliver exceptionally well for your first customers. Get testimonials. Fix what didn't work. Refine your process. This is your R&D phase -- you're paying for market research with discounted labor.
   - **Weeks 7-8:** Scale outreach -- cold pitching, paid listing upgrades, content marketing, referral requests. By now you should have 1-3 completed jobs/sales and at least one testimonial.
2. For each week, specify: tasks (with estimated time), tools needed, expected output, and the "if this doesn't work" backup plan.
3. Include templates where applicable: service proposal template, pricing sheet, client onboarding checklist, invoice template, feedback request email.
4. Set up a simple tracking system: hours spent, money invested, money earned, leads generated, conversion rate. A spreadsheet is fine. Don't over-engineer this.

**Output:** 8-week launch plan with weekly milestones, task lists, time estimates, templates, and tracking system.
**Quality gate:** Total hours per week don't exceed the user's stated availability. Each week has a clear deliverable. Templates are ready to use, not "create a template."

### Phase 5: GUARDRAILS
**Entry criteria:** Launch plan built.
**Actions:**
1. Set financial boundaries:
   - **Investment cap:** Maximum total you'll spend before requiring revenue to continue. If you hit this number with zero income, something is wrong -- don't throw good money after bad.
   - **Monthly burn limit:** Maximum monthly operating cost. If costs creep above this, audit and cut before continuing.
   - **Emergency brake:** If you lose money 3 months in a row (expenses > revenue), stop spending and reassess the model, not just "try harder."
2. Set time boundaries:
   - **Hard stop hours:** Define when you're working on the hustle and when you're not. "Whenever I have time" means "all the time" which means burnout. Pick specific blocks and protect them.
   - **Day job protection:** If the hustle is making you worse at your day job (tired, distracted, using work resources), pull back immediately. The day job is the safety net.
   - **Relationship check-in:** Monthly gut check -- is this causing friction with your partner, family, or friends? A side hustle that costs you your relationships is not worth any amount of money.
3. Define the "pivot or quit" criteria:
   - **Pivot triggers:** Zero revenue after 8 weeks of consistent effort, can't find customers in your target market, the work is miserable (not hard -- miserable), costs are rising faster than revenue.
   - **Quit triggers:** Investment cap reached with no clear path to revenue, health impact (sleep, stress, physical), day job is at risk, it's been 6 months and you dread working on it.
   - **Success triggers:** Conversely, when to double down -- consistent revenue for 3+ months, waiting list of customers, you enjoy it enough to keep going, income is approaching your target.
4. Plan the "what's next" decision points: at 3 months (is this working?), 6 months (should I invest more or coast?), 12 months (is this a real business or an expensive hobby?).
5. Remind the user: most side hustles fail, and that's okay. The skills, network, and confidence you build transfer to the next attempt. Failure is tuition, not a verdict.

**Output:** Financial guardrails with specific numbers, time boundaries, pivot/quit/double-down criteria, 3/6/12-month decision framework.
**Quality gate:** Investment cap is defined and doesn't exceed stated budget. Time boundaries don't exceed stated hours. Pivot criteria are specific and measurable, not "if it's not going well."

## Exit Criteria
Done when: (1) skills inventory identifies at least 3 monetizable skills, (2) top 3 side hustle ideas are scored and reality-tested with financial projections, (3) winner is selected with a clear first-dollar path, (4) 8-week launch plan has specific weekly tasks within the user's time and budget constraints, (5) financial and time guardrails are set with concrete pivot/quit criteria.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| INVENTORY | User says "I have no skills" | Adjust -- reframe: everyone has monetizable skills. Ask about their day job tasks, hobbies, what friends ask them for help with, what they do better than most people |
| INVENTORY | Non-compete clause is broad and restrictive | Adjust -- focus on hustles completely outside the user's industry. Flag that a lawyer should review the clause if the hustle grows |
| MATCH | No hustle scores above 5.0 | Adjust -- relax one constraint (usually budget or time), or consider a "skill-building" phase where the user spends 4 weeks learning a monetizable skill before launching |
| MATCH | User's available hours are under 5 per week | Adjust -- limit to passive or near-passive hustles: digital products, print-on-demand, affiliate content, or micro-consulting (one 1-hour call per week) |
| REALITY-TEST | Break-even timeline exceeds 12 months | Escalate -- be direct: this is a business, not a side hustle, and needs full-time commitment or significant capital to work at these margins |
| REALITY-TEST | Market is saturated for all 3 finalists | Adjust -- look for a niche angle within the saturated market (specialize by audience, geography, or format) or evaluate less obvious hustle categories |
| LAUNCH MAP | User has zero existing network for warm outreach | Adjust -- start with platform-based hustles (Fiverr, Upwork, Etsy, TaskRabbit) where the platform provides the audience, then build a network from paying customers |
| GUARDRAILS | User wants to skip boundaries and "just go for it" | Advise -- explain that guardrails aren't pessimism, they're what lets you take risks without ruining your financial life. Set them anyway as reference points |

## State Persistence
- Skills inventory with monetizability ratings (reusable if first hustle doesn't work and user tries another)
- Financial projections and actuals (track predicted vs. real revenue to improve future estimates)
- Customer acquisition data (which channels produced paying customers, conversion rates, average deal size)
- Time tracking (actual hours spent vs. planned, which tasks take longer than expected)
- Pivot history (if the user tried and abandoned a hustle, what went wrong and what was learned)
- Network contacts (clients, collaborators, mentors encountered during the hustle)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
