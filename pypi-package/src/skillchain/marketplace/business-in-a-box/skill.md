# Business in a Box

Takes a business idea from concept to launch plan in five structured phases: validates the idea against real demand signals, sizes the market with TAM/SAM/SOM analysis and competitive landscape mapping, defines an MVP with scope, tech stack, and timeline, builds a revenue model with unit economics and 12-month financial projection, and creates a go-to-market plan targeting the first 100 paying customers.

## Execution Pattern: Phase Pipeline

## Inputs
- business_idea: string -- What the business does, who it serves, what problem it solves
- target_audience: object -- Who the customers are: demographics, psychographics, pain points, current solutions, willingness to pay
- budget: object -- Available capital for launch (development, marketing, operations), funding source (bootstrapped, funded, side project)
- timeline: object -- Target launch date, milestones, time commitment (full-time, part-time, nights-and-weekends)
- founder_skills: array -- What the founder(s) can build themselves vs. what needs to be hired/contracted (technical, sales, marketing, design, domain expertise)

## Outputs
- idea_validation: object -- Problem-solution fit assessment with evidence, risk factors, and go/no-go recommendation
- market_research: object -- TAM/SAM/SOM sizing, competitor matrix, positioning strategy, unfair advantages
- mvp_definition: object -- Feature list (must-have / nice-to-have / post-launch), tech stack recommendation, timeline, budget estimate
- financial_model: object -- Revenue model, pricing strategy, unit economics (LTV, CAC, margins), 12-month projection
- launch_plan: object -- Go-to-market channels, messaging framework, first 100 customers strategy, launch timeline

## Execution

### Phase 1: IDEA -- Validate Problem-Solution Fit
**Entry criteria:** Business idea and target audience described.
**Actions:**
1. Deconstruct the idea into three testable components:
   - **Problem:** Is this a real problem that enough people have? How do they solve it today? How painful is the current solution?
   - **Solution:** Does the proposed solution actually solve the problem better than alternatives? What's the core value proposition?
   - **Willingness to pay:** Would the target audience pay for this? How much? What signals indicate demand? (Existing spending on alternatives, complaints about current solutions, search volume, community discussions.)
2. Apply the "Mom Test" framework -- questions that reveal truth, not validation:
   - "Tell me about the last time you dealt with [problem]." (Not "Would you buy my thing?")
   - "What do you currently use to solve [problem]?" (Reveals actual behavior, not hypothetical.)
   - "How much time/money do you spend on [current solution]?" (Quantifies willingness to pay.)
   - "What's the most frustrating part of [current solution]?" (Reveals specific pain points to address.)
3. Evaluate risk factors:
   - **Market risk:** Is the market big enough? Is it growing or shrinking?
   - **Execution risk:** Can this be built with available skills and budget?
   - **Timing risk:** Is this too early (market not ready) or too late (saturated)?
   - **Regulatory risk:** Are there legal/compliance hurdles?
4. Produce a go/no-go recommendation:
   - **GO:** Clear problem, target audience identifiable and reachable, willingness to pay evidenced, risks manageable.
   - **PIVOT:** Problem is real but solution needs adjustment (different approach, different audience, different pricing).
   - **NO-GO:** Problem is not real, market too small, competition unbeatable, or risks unmanageable.

**Output:** Problem-solution fit assessment with evidence for each component, risk matrix, go/pivot/no-go recommendation with rationale.
**Quality gate:** All three components (problem, solution, willingness to pay) are evaluated with specific evidence (not just opinions). Risk factors are rated. Recommendation is justified by evidence.

### Phase 2: RESEARCH -- Market Sizing and Competitive Landscape
**Entry criteria:** Idea validated (GO or PIVOT with adjustments).
**Actions:**
1. Calculate market size using both top-down and bottom-up methods:
   - **TAM (Total Addressable Market):** If every possible customer bought the product. Usually from industry reports or census data. "There are 60 million freelancers in the US."
   - **SAM (Serviceable Addressable Market):** The segment you can realistically serve with your solution. Filtered by geography, language, platform, niche. "5 million US freelancers who invoice clients regularly and use digital tools."
   - **SOM (Serviceable Obtainable Market):** What you can realistically capture in 1-3 years. Based on competition, distribution, and conversion rates. "50,000 freelancers we can reach through content marketing and Product Hunt = 1% of SAM."
   - Express each in both users and revenue ($).
2. Map the competitive landscape:
   - **Direct competitors:** Products solving the same problem for the same audience.
   - **Indirect competitors:** Different solutions to the same problem (including manual/DIY approaches).
   - **Potential competitors:** Companies that could enter this space (adjacent products, big tech).
   - For each competitor: pricing, features, market share estimate, strengths, weaknesses, user sentiment.
3. Identify positioning strategy:
   - **Where's the gap?** What do competitors fail at that users care about?
   - **What's the wedge?** The one thing you do significantly better that gets users to switch.
   - **Positioning statement:** "For [target audience] who [pain point], [product name] is a [category] that [key benefit]. Unlike [competitor], we [differentiator]."
4. Identify unfair advantages:
   - Proprietary technology, network effects, domain expertise, existing audience, partnerships, cost structure advantages, regulatory advantages.
   - Be honest: most startups have 0-1 real unfair advantages. That's okay. But know what they are (or aren't).

**Output:** Market sizing (TAM/SAM/SOM with methodology), competitor matrix, positioning statement, unfair advantages assessment.
**Quality gate:** TAM/SAM/SOM are calculated with stated methodology (top-down, bottom-up, or both). At least 3 competitors analyzed. Positioning identifies a specific gap or differentiator. Market size is expressed in both users and revenue.

### Phase 3: MVP -- Define Minimum Viable Product
**Entry criteria:** Market research complete, positioning defined.
**Actions:**
1. Define the core user journey -- the one workflow that delivers the primary value:
   - Map: User has [problem] -> User discovers product -> User does [core action] -> User gets [value] -> User is willing to pay/return.
   - The MVP must enable this entire journey. Nothing more.
2. Categorize features:
   - **Must-have (MVP):** Features required for the core user journey. Without these, the product doesn't work. Ruthlessly minimal.
   - **Should-have (v1.1):** Features that significantly improve the experience but aren't blocking launch. Ship within 2-4 weeks post-launch.
   - **Nice-to-have (v2.0):** Features users will want eventually but that don't affect initial value delivery. Backlog.
   - **Won't-do:** Features that don't serve the positioning strategy. Explicitly excluded to prevent scope creep.
3. Recommend tech stack based on founder skills, budget, and timeline:
   - **Solo founder, non-technical:** No-code/low-code (Bubble, Webflow, Airtable, Zapier). Ship in 2-4 weeks.
   - **Solo founder, technical:** Lean stack with hosted services. Next.js + Supabase + Stripe. Ship in 4-8 weeks.
   - **Small team, funded:** Standard stack optimized for iteration speed. React + Node/Python + PostgreSQL + AWS/Vercel. Ship in 6-12 weeks.
   - Always: hosted database, managed auth, third-party payments (never build payment processing).
4. Estimate timeline and budget:
   - Break MVP into 1-2 week milestones
   - Estimate development effort per feature (days, not hours -- hours create false precision)
   - Add 40% buffer (software projects always take longer)
   - Budget: development cost + hosting ($50-200/mo to start) + tools/services + initial marketing ($500-2000 for launch)
5. Define the "launch line" -- the exact set of features and quality level that constitutes "ready to launch." Draw it explicitly so scope doesn't creep.

**Output:** Feature categorization (must/should/nice/won't), tech stack recommendation, milestone-based timeline, budget estimate, launch line definition.
**Quality gate:** Must-have features are genuinely minimal (challenge every item: "Would a user still get value without this?"). Timeline includes 40% buffer. Budget covers all categories (dev, hosting, tools, marketing). Tech stack matches founder skills.

### Phase 4: BUSINESS -- Revenue Model and Financial Projection
**Entry criteria:** MVP defined with pricing context from market research.
**Actions:**
1. Select revenue model:
   - **Subscription (SaaS):** Monthly/annual recurring revenue. Best for ongoing-value products. Churn is the key metric.
   - **Transaction fee:** Take a cut of each transaction. Best for marketplaces. GMV and take rate are key metrics.
   - **One-time purchase:** Single payment. Best for tools, courses, downloads. Repeat purchases and referrals are key.
   - **Freemium:** Free tier + paid premium. Best for products with viral potential. Conversion rate is the key metric.
   - **Usage-based:** Pay per unit (API call, message, storage). Best for infrastructure/developer tools. Usage growth is key.
2. Set pricing strategy:
   - **Value-based pricing:** Price based on value delivered, not cost to produce. "If this saves you 10 hours/month at $50/hour, $29/month is a no-brainer."
   - **Competitive pricing:** Based on competitor pricing with a twist (cheaper, same price but more features, premium positioning).
   - **Cost-plus:** Only for physical products. Cost + desired margin.
   - **Psychological:** $9/mo, $29/mo, $99/mo tiers. Use anchoring (the expensive tier makes the middle tier look reasonable).
   - Design 2-3 pricing tiers if subscription.
3. Calculate unit economics:
   - **COGS (Cost of Goods Sold):** Per-customer cost to deliver the product (hosting, support, payment processing fees).
   - **Gross margin:** (Revenue - COGS) / Revenue. Target: >70% for SaaS, >40% for physical products.
   - **CAC (Customer Acquisition Cost):** Total marketing + sales spend / new customers acquired. Must be < LTV.
   - **LTV (Lifetime Value):** Average revenue per customer x average customer lifespan. LTV = ARPU / monthly churn rate.
   - **LTV:CAC ratio:** Must be >3x for a sustainable business. >5x means you're under-investing in growth.
   - **Payback period:** CAC / monthly gross profit per customer. How many months to recoup acquisition cost. Target: <12 months.
4. Build 12-month financial projection:
   - Month 1-3: Pre-launch + soft launch. Minimal revenue, high relative costs.
   - Month 4-6: Early traction. Growing MRR, refining channels.
   - Month 7-12: Growth phase. Scaling what works, cutting what doesn't.
   - Include: revenue, COGS, gross profit, marketing spend, operational costs, net profit/loss, cash balance.
   - Model three scenarios: conservative, baseline, optimistic.
   - Identify the "default alive" date: when does the business generate enough revenue to cover all costs? (Paul Graham)

**Output:** Revenue model selection with rationale, pricing tiers, unit economics (COGS, margin, CAC, LTV, LTV:CAC, payback), 12-month projection (3 scenarios), default alive date.
**Quality gate:** Unit economics are internally consistent (LTV > CAC, margins are positive, payback period is reasonable). 12-month projection covers all major cost and revenue categories. Three scenarios are meaningfully different (not just "multiply by 0.8/1.0/1.2"). Default alive date is calculated.

### Phase 5: LAUNCH -- Go-to-Market Plan
**Entry criteria:** Financial model and pricing set.
**Actions:**
1. Identify go-to-market channels ranked by fit:
   - **Content marketing:** Blog, SEO, social media content. Best for long-term organic growth. Slow to start (3-6 months for SEO).
   - **Community-driven:** Product Hunt launch, Reddit, niche forums, Slack/Discord communities. Best for developer tools, creator tools. Fast, free, short-lived spike.
   - **Paid acquisition:** Google Ads, Facebook/Instagram ads, LinkedIn ads. Best when unit economics support it (CAC payback < 6 months). Immediate traffic.
   - **Partnerships:** Integrate with complementary products, co-marketing, affiliate programs. Best when partner's audience matches your target.
   - **Direct sales:** Outbound email, calls, demos. Best for B2B with >$1000 ACV. Slow but high conversion.
   - **Referral/viral:** Built-in virality (sharing features, referral rewards). Best for consumer and collaboration tools.
2. Define the messaging framework:
   - **Headline:** One sentence that captures the value prop. ("Track time and get paid faster. Built for freelancers.")
   - **Pain point:** What the audience struggles with. ("Juggling spreadsheets, chasing invoices, and losing track of billable hours.")
   - **Solution:** How the product solves it. ("One tool that tracks your time, generates invoices, and sends payment reminders automatically.")
   - **Social proof:** Early testimonials, beta user results, founder credibility. ("Used by 50 freelancers in beta who saved an average of 5 hours/week.")
   - **CTA:** Clear next step. ("Start your free 14-day trial. No credit card required.")
3. Plan the first 100 customers strategy:
   - Customers 1-10: Personal network, co-founders' contacts, warm intros. Hand-sell. Do things that don't scale.
   - Customers 11-50: Targeted outreach to communities where the audience gathers. Provide exceptional support. Ask every user for feedback and referrals.
   - Customers 51-100: First paid channels (small budget experiments). Leverage early testimonials. Product Hunt or similar launch event.
   - Key principle: the first 100 customers are hand-acquired. This is not scalable. It's not supposed to be. It's about learning.
4. Build the launch timeline:
   - T-4 weeks: Landing page + email waitlist live. Start content/community seeding.
   - T-2 weeks: Beta access to first 10-20 users. Collect feedback. Fix critical issues.
   - T-1 week: Product Hunt prep (if applicable), press outreach, social media scheduling.
   - T-0: Launch day. Multi-channel announcement. Monitor everything. Respond to every comment/question.
   - T+1 to T+4 weeks: First 100 customers sprint. Iterate rapidly based on feedback.

**Output:** Ranked channel strategy, messaging framework, first 100 customers playbook, launch timeline.
**Quality gate:** At least 3 channels are identified with fit rationale and budget requirements. Messaging has all 5 components (headline, pain, solution, proof, CTA). First 100 strategy has three phases (1-10, 11-50, 51-100) with specific tactics. Launch timeline has specific dates and actions.

## Exit Criteria
The pipeline is complete when all five outputs are delivered: idea validation, market research, MVP definition, financial model, and launch plan. Each output builds on the previous. The business owner has enough information to make a go/no-go decision and, if go, to begin execution immediately.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| IDEA | Problem doesn't exist or audience doesn't care | Abort with NO-GO recommendation. Present evidence. Suggest pivot directions if partial validation exists |
| IDEA | Market is too small (<$1M TAM) | Adjust -- is the audience too narrow? Can the solution serve adjacent markets? If not, NO-GO |
| RESEARCH | No competitors found | Adjust -- this is a warning sign, not good news. No competitors usually means no market (or you haven't looked hard enough). Re-examine demand |
| MVP | Scope keeps growing beyond budget/timeline | Escalate -- the founder is not being ruthless enough. Force a "pick 3 features" exercise. The MVP should be embarrassingly simple |
| BUSINESS | Unit economics are negative (LTV < CAC) | Adjust -- can price increase? Can CAC decrease with different channels? Can churn decrease? If none work, the business model needs restructuring before launch |
| LAUNCH | No budget for paid acquisition and no organic audience | Adjust -- focus entirely on community and content. Extend timeline. Build audience before product (audience-first approach) |

## Reference

### The Mom Test (Rob Fitzpatrick)
Three rules for customer conversations that don't lie:
1. Talk about their life, not your idea
2. Ask about the past (what they've done), not the future (what they would do)
3. Talk less, listen more

Bad question: "Would you use a tool that does X?" (They'll say yes to be nice.)
Good question: "How are you solving X today? What's the most annoying part?" (Reveals truth.)

### TAM/SAM/SOM Methodology
- **Top-down:** Start with industry reports, narrow by filters. Quick but often inflated.
- **Bottom-up:** Count actual potential customers x expected revenue per customer. Slower but more accurate.
- **Value theory:** How much value does the market currently spend on this problem? Your revenue is a fraction of that value.
- Best practice: use BOTH top-down and bottom-up. If they're wildly different, investigate why.

### Unit Economics Formulas
```
Gross Margin = (Revenue - COGS) / Revenue
CAC = Total Sales & Marketing Spend / New Customers Acquired
LTV = ARPU / Monthly Churn Rate (simple)
LTV = ARPU x Gross Margin x (1 / Churn Rate) (margin-adjusted)
LTV:CAC Ratio (target: >3x)
Payback Period = CAC / (ARPU x Gross Margin) (in months)
Monthly Burn Rate = Total Monthly Expenses - Total Monthly Revenue
Runway = Cash Balance / Monthly Burn Rate (in months)
```

### SaaS Metrics Benchmarks
| Metric | Bad | Okay | Good | Great |
|---|---|---|---|---|
| Monthly churn | >5% | 3-5% | 1-3% | <1% |
| LTV:CAC | <1x | 1-3x | 3-5x | >5x |
| Payback (months) | >18 | 12-18 | 6-12 | <6 |
| Gross margin | <50% | 50-70% | 70-85% | >85% |
| Net revenue retention | <90% | 90-100% | 100-120% | >120% |

### Pricing Psychology
- **Anchoring:** Show the expensive plan first. The middle plan looks reasonable by comparison.
- **Decoy effect:** Three tiers where the middle tier is clearly the best value (the expensive tier exists to make it look good).
- **Round numbers feel arbitrary.** $29 feels researched. $30 feels made up.
- **Annual discount:** 20% off annual billing. Improves cash flow and reduces churn.
- **Free trial > freemium** for most B2B products. Freemium works when the free tier drives viral growth.

### First 100 Customers Playbook (Paul Graham)
"Do things that don't scale."
- Customers 1-10: You personally onboard each one. You are customer support. You watch them use the product over their shoulder (or screen share).
- You should be able to describe each of your first 10 customers by name, what they do, and exactly how they use your product.
- Every customer interaction is a learning opportunity. The goal is not revenue -- it's learning.

### State Persistence
The skill persists:
- All research data (market sizing, competitor analysis) for ongoing reference
- Financial model assumptions for updating as actuals come in
- Customer acquisition data for comparing actual vs projected
- Pivot history (what changed and why)
- Competitor landscape updates
