# Solopreneur Engine

Tell me your idea. Get a running business back. Full launch pipeline: validate the idea, analyze the market, pick a strategy, build the business plan, generate outreach content, and design your operating system — everything a solo founder needs from zero to launch.

## Execution Pattern: ORPA Loop

## Inputs
- idea: string -- Your business idea in plain language. Don't filter it — just say what it is. "AI-powered invoicing for freelancers", "custom dog treat bakery", "tutoring for kids who hate math."
- target_audience: string -- Who has the problem your idea solves. Be specific: not "small businesses" but "freelance designers doing $50K-$200K/year with 10+ active clients."
- founder_skills: array -- What you're good at — professionally, technically, personally. Include job skills, hobbies, software, domain knowledge. Everything counts.
- budget: string -- How much you can invest upfront without stress, and your monthly burn limit while the business ramps up. Be honest.
- business_type: string -- (Optional) What kind of business: saas, service, ecommerce, marketplace, content, agency, or consulting. If unknown, will be recommended based on your idea and skills.
- risk_tolerance: string -- (Optional) Conservative (need near-guaranteed income, minimal upfront spend), moderate (can invest a few hundred and wait 2-3 months), or aggressive (willing to invest $1K+ and wait 6+ months).
- constraints: array -- (Optional) Dealbreakers and hard limits: no client-facing work, non-compete at current job, can't use real name online, specific industries to avoid, time constraints.

## Outputs
- validation_score: object -- Go/no-go recommendation with scores on problem clarity, audience definition, willingness to pay, competition level, and founder fit. STRONG GO, GO WITH CAVEATS, PIVOT, or NO GO.
- market_analysis: object -- TAM/SAM/SOM estimates, competitor map with strengths and weaknesses, market gaps, 3 positioning angles, pricing benchmarks, and distribution channels.
- strategy_recommendation: object -- Three strategy candidates (LEAN, PREMIUM, GROWTH) scored and ranked. Winner selected with reasoning and trade-offs.
- business_plan: object -- One-liner pitch, value proposition, MVP scope, pricing tiers, revenue model, 90-day week-by-week timeline, budget breakdown, top 5 risks with mitigations, first-10-customers playbook.
- outreach_content: object -- 5 cold email variants, 5 LinkedIn outreach sequences (3 messages each), 10 social posts, complete landing page copy, 30-second elevator pitch.
- operating_system: object -- Time-blocked daily schedule, weekly rhythm, KPI dashboard, automation opportunities with tool recommendations, full tool stack (free/cheap tier), 13-week sprint plan.

## Execution

### OBSERVE: Intake and Validate
**Entry criteria:** Idea, target audience, founder skills, and budget provided.
**Actions:**
1. Score the idea on 5 dimensions (0-10 each) using the Mom Test framework:
   - Problem clarity: Is the problem specific and painful enough that people would pay to solve it?
   - Audience definition: Can you name the exact person who has this problem and find 100 of them?
   - Willingness to pay: Evidence — real or inferred — that this audience pays for solutions like this.
   - Competition level: Market crowding (low competition = opportunity; high = need differentiation).
   - Founder fit: Do the founder's skills, network, and experience give them an unfair advantage here?
2. Produce a go/no-go recommendation: STRONG GO (40-50pts), GO WITH CAVEATS (30-39), PIVOT (20-29), or NO GO (<20).
3. For PIVOT recommendations, generate 2-3 adjacent ideas that score higher given the founder's profile.
4. Analyze the market: estimate TAM/SAM/SOM bottom-up, map 3-5 competitors with strengths/weaknesses/gaps, identify underserved niches, benchmark pricing by business type.
5. Determine or confirm the business type based on the idea and founder skills if not provided.

**Output:** Validation scorecard with recommendation, market sizing, competitor map, positioning opportunities.
**Quality gate:** All 5 validation dimensions scored. Business type confirmed. At least 1 clear market gap identified.

### REASON: Build Strategy and Plan
**Entry criteria:** Validation complete, go/pivot direction confirmed.
**Actions:**
1. Generate 3 strategy candidates and score each on: time to first revenue (30%), capital required (20%), risk level (20%), scalability potential (15%), founder fit (15%).
   - LEAN: Smallest possible MVP, manual processes first, fastest path to paying customers.
   - PREMIUM: Quality-first positioning, higher prices, fewer customers, slower but more defensible.
   - GROWTH: Aggressive acquisition, optimize for speed and scale, higher risk and capital needs.
2. Select the winning strategy based on scoring, then build the full business plan around it:
   - One-liner pitch (max 15 words, must say who it helps and what it does).
   - Value proposition: what it does, for whom, and why it's better.
   - MVP scope: must-have features vs cut-for-later list.
   - Pricing tiers: 2-3 options with anchoring logic.
   - Revenue model: subscription, one-time, retainer, usage-based, etc.
   - 90-day timeline: week-by-week milestones from day 1 to first revenue.
   - Budget breakdown: upfront costs, monthly recurring, where to cut if budget is tight.
   - Top 5 risks with specific mitigations (not generic "market risk").
   - First-10-customers playbook: exactly where to find them and how to reach them.

**Output:** Scored strategy comparison, winning strategy rationale, complete business plan.
**Quality gate:** Strategy scoring is transparent and defensible. Business plan has week-by-week milestones. First-10-customers plan is specific (names, platforms, outreach method), not generic.

### PLAN: Generate Outreach and Operations
**Entry criteria:** Business plan approved.
**Actions:**
1. Write outreach content ready to personalize and send:
   - 5 cold email variants using different frameworks: AIDA (Attention-Interest-Desire-Action), PAS (Problem-Agitate-Solution), BAB (Before-After-Bridge), DIRECT (one-ask, no fluff), STORY (personal narrative lead).
   - 5 LinkedIn outreach sequences — 3 messages each: connection request, follow-up with value, close with ask.
   - 10 social media posts: 70% value/education, 20% founder story, 10% promotional. Ready for LinkedIn, Twitter/X, or Instagram (platform-agnostic copy).
   - Landing page copy: hero section (headline + subheadline + CTA), 3 feature/benefit blocks, pricing section, FAQ (5 questions), footer CTA. Ready to paste into Carrd, Framer, or Webflow.
   - 30-second elevator pitch: for networking events, intro calls, DMs. Memorizable.
2. Design the operating system for running the business day-to-day:
   - Time-blocked daily schedule based on available hours from the intake.
   - Weekly rhythm: Monday-Sunday structure with recurring tasks.
   - KPI dashboard: 5-7 metrics specific to the business type with targets and review cadence.
   - Automation opportunities: which manual tasks to automate first, with tool recommendations.
   - Full tool stack at free/cheap tier: CRM, email, payments, project management, comms, website.
   - 13-week sprint plan: quarterly goals broken into weekly sprints with success metrics.

**Output:** Complete outreach content suite, landing page copy, operating system, tool stack.
**Quality gate:** Cold emails are ready to send with only name/company personalization needed. Landing page copy is complete. Tool stack has no tool over $50/month (unless explicitly requested).

### ACT: Deliver and Prioritize
**Entry criteria:** All materials generated.
**Actions:**
1. Present the full package section by section with context: "Here's why I chose the LEAN strategy for your situation..." — not just outputs, but reasoning.
2. Give a prioritized action list for the first 7 days: exactly what to do, in order, to get the first paying customer as fast as possible.
3. Flag the highest-risk assumption in the plan: "The biggest bet here is [X]. Here's a cheap, fast way to test it before investing further."
4. Provide the "if nothing else" minimum: if the founder only does 3 things from this entire plan, these are the 3 that matter most.
5. Offer to go deeper on any section: generate more email variants, rework the pitch, stress-test the pricing, or run a specific section again with different parameters.

**Output:** Full launch package with prioritized action list, key risk flag, and minimum viable action set.
**Quality gate:** First 7-day action list is specific (not "start marketing" but "post in r/freelance with this exact message"). Risk flag is honest. Minimum viable actions are genuinely the highest-leverage moves.

## Exit Criteria
Done when: (1) idea has a go/no-go recommendation with scores, (2) winning strategy is selected with rationale, (3) business plan covers all sections, (4) outreach content is ready to use, (5) operating system covers daily/weekly rhythm and KPIs, (6) 7-day action list is delivered.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Idea is too vague ("I want to make money online") | Escalate — ask 3 clarifying questions: What specific problem? Who specifically has it? What would they pay for it? |
| OBSERVE | Idea scores NO GO | Pivot — don't just say no. Identify what's salvageable and generate 2-3 adjacent ideas that score better with the founder's skills. |
| REASON | Budget is too low for the business type | Adjust — downscope to a business type that fits. Service businesses can start for under $100. Recommend the lowest-cost path to validation. |
| PLAN | Founder has no audience or network | Adjust — focus outreach on platforms where their target audience already congregates. Include community infiltration tactics before cold outreach. |
| ACT | Founder is paralyzed by the volume of output | Simplify — cut to the minimum viable action set. "Do these 3 things this week, nothing else." |
| ACT | User rejects final output | **Targeted revision** -- ask which section fell short (validation scores, market analysis, strategy selection, business plan section, outreach content, or operating system) and rerun only that section. Do not re-run the full pipeline. |

## State Persistence
- Idea iterations (each version scored, with why it changed)
- Competitor intelligence (updates as market evolves)
- Outreach performance (which emails/posts got responses, open rates if tracked)
- Sprint outcomes (week-by-week actual vs planned, what worked)
- Customer discovery notes (what early customers said, what surprised you)

---

## Reference

### Validation Scoring (Mom Test Framework)

| Dimension | 8-10 | 4-7 | 1-3 |
|---|---|---|---|
| Problem clarity | Specific, painful, verifiable | Real but vague | Unclear or assumed |
| Audience definition | Can name 100 specific people | General segment | "Everyone" |
| Willingness to pay | Evidence of actual payment | Logical inference | Hope-based |
| Competition level | Clear gap in market | Some differentiation needed | Saturated |
| Founder fit | Unfair advantage | Learnable | Mismatched |

Total scores: 40-50 = STRONG GO, 30-39 = GO WITH CAVEATS, 20-29 = PIVOT, <20 = NO GO

### Strategy Scoring Weights

| Factor | Weight |
|---|---|
| Time to first revenue | 30% |
| Capital required | 20% |
| Risk level | 20% |
| Scalability potential | 15% |
| Founder fit | 15% |

### Business Type Capital Requirements (Rough)

| Type | Minimum to Start |
|---|---|
| Service / consulting | Under $100 |
| Content / info products | Under $500 |
| SaaS (no-code MVP) | $500-2,000 |
| E-commerce (dropship) | $500-1,500 |
| E-commerce (own inventory) | $2,000-10,000 |
| Marketplace | $5,000+ |

### Outreach Framework Bank

| Framework | Structure |
|---|---|
| AIDA | Attention → Interest → Desire → Action |
| PAS | Problem → Agitate → Solution |
| BAB | Before → After → Bridge |
| DIRECT | One ask, no fluff, clear CTA |
| STORY | Personal narrative → relevance → ask |

### The 3-Message LinkedIn Sequence

1. Connection request (no pitch): shared interest or genuine compliment
2. Follow-up with value: something useful, no ask
3. Close with ask: specific, low-commitment request

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
