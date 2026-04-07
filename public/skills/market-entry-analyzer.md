# Market Entry Analyzer

Analyze market entry opportunities by sizing the market (TAM/SAM/SOM), mapping the competitive landscape and barriers to entry, identifying differentiation and positioning angles, building a go-to-market plan with channel and pricing strategy, and assessing risks with explicit kill criteria.

## Execution Pattern: Phase Pipeline

```
PHASE 1: MARKET     --> Define market (size TAM/SAM/SOM, growth rate, dynamics)
PHASE 2: LANDSCAPE  --> Map competitors, substitutes, barriers to entry
PHASE 3: POSITION   --> Identify differentiation angles, unfilled niches
PHASE 4: STRATEGY   --> Go-to-market plan (channel, pricing, messaging, partnerships)
PHASE 5: RISKS      --> Risk assessment with mitigation strategies, kill criteria
```

## Inputs

- `product_description`: string -- What the product/service does, key features, current traction (if any), and unique capabilities
- `target_market`: object -- Industry, geography, company size, buyer persona, and any known market data
- `company_capabilities`: object -- Team expertise, existing technology, brand presence, distribution channels, capital available
- `competitive_landscape`: array -- (Optional) Known competitors with positioning, pricing, strengths, weaknesses
- `resource_constraints`: object -- Budget allocated, timeline, team available, risk tolerance (conservative/moderate/aggressive)

## Outputs

- `market_sizing`: object -- TAM, SAM, SOM with methodology (top-down and bottom-up), growth rates, and market dynamics
- `competitive_map`: object -- Competitor matrix with positioning, pricing, strengths/weaknesses, and market share
- `positioning_strategy`: object -- Differentiation angles, positioning statement, value proposition per segment
- `gtm_plan`: object -- Channel strategy, messaging, pricing, partnership plan, and launch timeline
- `risk_assessment`: object -- Risk matrix with probability/impact scoring, mitigation strategies, and kill/pivot/double-down criteria

---

## Execution

### Phase 1: MARKET -- Size and Dynamics

**Entry criteria:** Product description and target market definition are provided.

**Actions:**

1. **Top-down market sizing:**
   ```
   TAM = Total market for this product category globally
   Source: industry reports, analyst estimates, public company revenue data
   
   SAM = TAM * geographic filter * segment filter * use-case filter
   Example: TAM * US_share * mid_market_share * relevant_use_case_%
   
   SOM = SAM * realistic_capture_rate (typically 0.5-2% in Year 3)
   Conservative: SAM * 0.5%
   Moderate: SAM * 1%
   Aggressive: SAM * 2%
   ```

2. **Bottom-up market sizing (validation):**
   ```
   Number of potential customers in target segment
   * Percentage likely to buy this type of product
   * Average contract value (ACV)
   = Bottom-up market size
   
   Cross-check: bottom-up should be within 2x of top-down SAM
   If wildly different: investigate assumptions
   ```

3. **Market dynamics analysis:**
   ```
   Growth drivers: what's making this market grow?
   Headwinds: what could slow or shrink this market?
   Secular trends: long-term shifts that create opportunity
   Cyclical factors: economic sensitivity, seasonal patterns
   Regulatory environment: current and anticipated changes
   Technology shifts: AI, automation, platform changes
   ```

4. **Market maturity assessment:**
   ```
   Emerging (growing >30%/yr): Early movers win, market education needed
   Growing (15-30%/yr): Best time to enter, category is established
   Mature (5-15%/yr): Must differentiate or disrupt, incumbents strong
   Declining (<5%/yr or negative): Avoid unless you have a disruption thesis
   ```

**Output:** Market size (TAM/SAM/SOM) with methodology, growth rate, dynamics, and maturity assessment.

**Quality gate:** Both top-down and bottom-up estimates are computed. Growth rate is sourced. Market dynamics include at least 2 drivers and 2 headwinds.

---

### Phase 2: LANDSCAPE -- Competitive Map

**Entry criteria:** Market is sized and defined.

**Actions:**

1. **Identify competitors by category:**
   ```
   Direct: Same product, same buyer, same problem
   Indirect: Different product, same buyer, same problem (substitutes)
   Emerging: New entrants, adjacent products expanding into this space
   Internal: DIY solutions (spreadsheets, manual processes, do-nothing)
   ```

2. **Profile each competitor:**
   ```
   Per competitor:
   - Company size, funding, revenue (estimated)
   - Market share (estimated)
   - Product: key features, unique capabilities, known limitations
   - Pricing: model, price points, contract terms
   - Positioning: who they sell to, what they emphasize
   - Strengths: what they do well, moats, advantages
   - Weaknesses: what they do poorly, complaints, gaps
   - Trajectory: growing, stable, declining, pivoting
   ```

3. **Map barriers to entry:**
   ```
   Technology barriers: proprietary tech, patents, data moats
   Network effects: value increases with users (marketplace, social)
   Switching costs: integration depth, data lock-in, workflow dependency
   Brand/trust: established relationships, reputation, references
   Distribution: channel partnerships, marketplace presence, sales teams
   Regulatory: compliance requirements, certifications, licenses
   Capital: infrastructure investment, R&D spend to reach parity
   Scale economies: unit costs decrease with volume
   
   Per barrier: severity (Low/Medium/High) and your position relative to it
   ```

4. **Assess market concentration:**
   ```
   HHI (Herfindahl-Hirschman Index) = sum of squared market shares
   HHI < 1500: competitive market (easier to enter)
   HHI 1500-2500: moderately concentrated
   HHI > 2500: highly concentrated (harder to enter)
   ```

**Output:** Competitor profiles, barrier assessment, market concentration analysis.

**Quality gate:** At least 3 direct competitors are profiled. Barriers are assessed with specific severity ratings. Market concentration is estimated.

---

### Phase 3: POSITION -- Differentiation Strategy

**Entry criteria:** Competitive landscape is mapped.

**Actions:**

1. **Identify competitive gaps:**
   ```
   For each competitor weakness, ask:
   - Is this weakness important to buyers? (not all weaknesses matter)
   - Can we credibly fill this gap? (do we have the capability?)
   - Is this gap sustainable? (or will competitors close it quickly?)
   
   Gap types:
   - Feature gaps: something no one does well
   - Segment gaps: a buyer group that's underserved
   - Price gaps: a price point no one occupies
   - Experience gaps: UX, implementation, support quality
   - Integration gaps: ecosystem connections missing
   ```

2. **Define differentiation angles (pick 1-2, not 5):**
   ```
   Differentiation options:
   - Product: better features, better UX, unique capability
   - Price: significantly cheaper (but sustainable)
   - Speed: faster to deploy, faster to value
   - Vertical: deep expertise in one industry
   - Integration: works with tools buyers already use
   - Service: white-glove onboarding, dedicated support
   - Data: unique dataset or benchmarks competitors lack
   ```

3. **Craft positioning statement:**
   ```
   Template:
   "For [target buyer] who [pain point/need], [Product] is a
    [category] that [key differentiator], unlike [competitors]
    who [competitor weakness]."
   
   Test: Does this statement make a competitor's customer say
   "Wait, tell me more"? If not, it's not differentiated enough.
   ```

4. **Build value proposition per segment:**
   ```
   Per target segment:
   - Primary pain point (what keeps them up at night)
   - How your product solves it (specific, not generic)
   - Proof point (data, case study, demo)
   - Alternative they use today (what you're replacing)
   - Why switch now (urgency trigger)
   ```

**Output:** Competitive gap analysis, differentiation strategy, positioning statement, per-segment value propositions.

**Quality gate:** Differentiation is specific (not "better product"). Positioning statement is testable (could be false -- if it can't be false, it's not saying anything). Value proposition addresses a specific pain per segment.

---

### Phase 4: STRATEGY -- Go-to-Market Plan

**Entry criteria:** Positioning and differentiation are defined.

**Actions:**

1. **Channel strategy:**
   ```
   Select primary and secondary channels based on ACV and buyer behavior:
   
   ACV < $5K:    Product-led growth (self-serve, freemium, content)
   ACV $5K-$25K: Inside sales + content marketing + partnerships
   ACV $25K+:    Field sales + events + analyst relations + partners
   
   Channel evaluation:
   - Cost per acquisition (CPA) relative to ACV
   - Time to first customer through this channel
   - Scalability (can it grow 10x?)
   - Your existing capability in this channel
   ```

2. **Messaging framework:**
   ```
   Headline: 10 words or fewer that capture the differentiator
   Subheadline: How it works / what makes it different
   3 proof points: specific, measurable claims
   
   Buyer-specific messaging:
   - Economic buyer (VP/C-suite): ROI, cost savings, risk reduction
   - End user: ease of use, time savings, daily workflow improvement
   - Technical evaluator: integration, security, scalability
   - Champion (internal advocate): how to sell this internally
   ```

3. **Pricing strategy for market entry:**
   ```
   Penetration: price below market to gain share fast (then increase)
   Parity: match market, compete on product
   Premium: price above market, compete on value/brand
   Freemium: free entry, monetize at scale
   
   For new entrants: typically penetration or freemium
   Exception: if product is demonstrably 10x better, premium can work
   ```

4. **Partnership and ecosystem strategy:**
   ```
   Integration partners: platforms your buyers already use
   Channel partners: resellers, consultants, agencies
   Technology partners: complementary products
   Industry partners: associations, analyst firms
   
   For each: what's in it for them? (referral fees, better product, happy customers)
   ```

5. **Launch timeline:**
   ```
   Phase 0 (Month -2 to 0): Build + Beta
   - Recruit 5-10 design partners (free, feedback exchange)
   - Build core integrations
   - Create initial content (blog, case study framework)
   
   Phase 1 (Month 1-3): Soft Launch
   - First paying customers from beta conversions
   - Content marketing begins (SEO, social, community)
   - Refine ICP based on early wins/losses
   
   Phase 2 (Month 4-6): Scale
   - Hire sales (if ACV warrants it)
   - Conference/event presence
   - Partnership integrations live
   - Target: 20-50 customers
   
   Phase 3 (Month 7-12): Optimize
   - Double down on winning channels
   - Cut losing channels
   - Expand feature set based on customer feedback
   - Target: 50-100 customers
   ```

**Output:** Channel strategy, messaging framework, pricing approach, partnership plan, and phased launch timeline.

**Quality gate:** Channel selection is justified by ACV and buyer behavior (not just preference). Messaging addresses at least 2 buyer personas. Launch timeline has specific customer targets per phase.

---

### Phase 5: RISKS -- Assessment and Kill Criteria

**Entry criteria:** GTM plan is defined with resource commitments.

**Actions:**

1. **Build risk matrix:**
   ```
   Per risk:
   - Description: what could go wrong
   - Probability: Low (<20%), Medium (20-50%), High (>50%)
   - Impact: Low (delay), Medium (pivot needed), High (kill the initiative)
   - Mitigation: specific action to reduce probability or impact
   ```

2. **Standard risk categories for market entry:**
   ```
   Market risks: market smaller than estimated, growth slowing
   Competitive risks: incumbents respond aggressively, price war
   Product risks: can't achieve product-market fit, wrong features
   Execution risks: can't hire, can't sell, can't build fast enough
   Financial risks: CAC too high, unit economics don't work
   Timing risks: too early (market not ready) or too late (saturated)
   ```

3. **Define kill criteria (MUST have before committing resources):**
   ```
   Kill the initiative if by [review date]:
   - Customer acquisition: < [N] paying customers
   - Revenue: < $[X] ARR
   - Unit economics: CAC > $[Y] or LTV:CAC < [Z]:1
   - Win rate: < [W]% in competitive deals
   - Product: NPS < [S] from early customers
   - Total investment exceeds $[I] without reaching milestones
   
   Review cadence: monthly for first 6 months, quarterly thereafter
   Decision maker: [specific person/committee]
   ```

4. **Define pivot criteria:**
   ```
   Pivot (don't kill) if:
   - Different segment is buying than expected -> follow the demand
   - Use case is different than planned -> pivot product positioning
   - Channel isn't working but customers love product -> change channel
   - Price is wrong but demand exists -> adjust pricing model
   ```

5. **Define double-down criteria:**
   ```
   Increase investment if:
   - Exceeding customer targets by >50%
   - Win rate > [threshold] in competitive deals
   - NPS > 50 from early customers
   - Expansion revenue appearing organically
   - Competitors have not responded to your entry
   ```

**Output:** Risk matrix, kill criteria with specific thresholds and dates, pivot triggers, and double-down triggers.

**Quality gate:** At least 5 risks are assessed. Kill criteria have specific numerical thresholds (not "if things aren't working"). Review date is set. Decision maker is identified.

## Exit Criteria

The skill is DONE when:
- Market is sized (TAM/SAM/SOM) with both top-down and bottom-up validation
- At least 3 competitors are profiled with strengths, weaknesses, and pricing
- Positioning statement and differentiation strategy are defined
- GTM plan includes channel, messaging, pricing, partnerships, and timeline
- Risk assessment includes kill criteria with specific thresholds and review dates

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| MARKET | No reliable market size data available | **Adjust** -- use bottom-up sizing only (count customers * ACV), flag as estimate |
| MARKET | Market is too new for historical data | **Adjust** -- size by analogy to adjacent markets, note uncertainty |
| LANDSCAPE | Cannot identify competitors | **Adjust** -- analyze substitutes and DIY solutions as the "competition" |
| LANDSCAPE | Competitor pricing is not public | **Adjust** -- estimate from job postings (revenue/headcount), customer reviews, or sales intel |
| POSITION | No clear differentiation found | **Escalate** -- if you can't differentiate, reconsider entering this market |
| POSITION | Too many potential angles | **Adjust** -- pick the 1 angle with strongest proof point, test others later |
| STRATEGY | Budget insufficient for recommended channels | **Adjust** -- prioritize lowest-CAC channel, extend timeline, reduce scope |
| RISKS | Team unwilling to set kill criteria | **Escalate** -- without kill criteria, the analysis is incomplete; this is non-negotiable |

## State Persistence

Between runs, this skill saves:
- **Market research**: sizing data, sources, growth rates, dynamics
- **Competitor profiles**: and changes detected over time (pricing changes, feature launches, pivots)
- **Win/loss data**: why deals were won or lost, competitive displacement patterns
- **Channel performance**: CAC and conversion by channel over time
- **Milestone tracking**: progress against launch timeline and kill criteria thresholds

---

## Reference

### Market Sizing Methods

```
TOP-DOWN:
  Start with total market (analyst reports, public company data)
  Apply filters: geography, segment, use case
  Result: SAM
  
  Pros: fast, uses established data
  Cons: can overestimate, relies on category definitions

BOTTOM-UP:
  Count addressable companies/buyers
  * Adoption rate (% who would buy)
  * Average deal size
  = Market size
  
  Pros: grounded in reality, testable assumptions
  Cons: can undercount, misses adjacent buyers

VALUE-BASED:
  Total value created by solving this problem
  * Capture rate (typically 10-20% of value)
  = Market opportunity
  
  Pros: ties to customer value, good for new categories
  Cons: hard to estimate value, subjective
```

### Porter's Five Forces for Entry Assessment

```
1. RIVALRY (existing competitors):
   High rivalry = harder entry
   Assess: number of competitors, growth rate, differentiation, exit barriers
   
2. SUPPLIER POWER:
   High supplier power = higher costs, lower margins
   Assess: cloud provider lock-in, data source dependencies, talent market

3. BUYER POWER:
   High buyer power = pricing pressure, longer sales cycles
   Assess: buyer concentration, switching costs, price sensitivity

4. THREAT OF SUBSTITUTES:
   High substitute threat = must differentiate clearly
   Assess: DIY solutions, adjacent products, do-nothing option

5. BARRIERS TO ENTRY:
   High barriers = harder to enter but also protects once inside
   Assess: capital requirements, technology moats, regulatory, network effects
```

### Go-to-Market Motions by ACV

```
ACV          Motion            Team             Metrics
-------------------------------------------------------------------
<$1K         Self-serve PLG    Product + growth  Signups, activation,
                                                 conversion, expansion
$1K-$10K     Inside sales      SDRs + AEs        Pipeline, win rate,
             + content                            sales cycle, CAC
$10K-$50K    Inside + field    AEs + SEs +        ACV, deal velocity,
             sales             CSMs               pipeline coverage
$50K-$250K   Enterprise        Named AEs +        Deals, pipeline,
             sales             SEs + CSMs          multi-thread depth
>$250K       Strategic         VP-level +          Relationship depth,
             accounts          solutions team      executive alignment
```

### Positioning Canvas

```
        LOW PRICE                      HIGH PRICE
       +-------------------+-------------------+
  HIGH |                   |                   |
  VALUE| DISRUPTOR         | PREMIUM           |
       | (your opportunity | (market leaders,  |
       |  if you can       |  strong brands)   |
       |  deliver value    |                   |
       |  cheaply)         |                   |
       +-------------------+-------------------+
  LOW  |                   |                   |
  VALUE| COMMODITY         | OVERPRICED        |
       | (race to bottom,  | (vulnerable to    |
       |  avoid)           |  disruption)      |
       |                   |                   |
       +-------------------+-------------------+

Best entry positions:
1. Disruptor quadrant (high value, low price) -- if sustainable
2. Premium with clear differentiation -- if you have proof
3. Niche specialist -- own a small segment completely
```

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
