# Competitor Teardown

Systematically identify and analyze competitors by categorizing them (direct, indirect, emerging), profiling each on product, pricing, positioning, strengths, and weaknesses, building feature and pricing comparison matrices, identifying competitive gaps and vulnerabilities, and producing strategic recommendations for product priorities, messaging angles, and sales battlecards.

## Execution Pattern: Phase Pipeline

```
PHASE 1: IDENTIFY   --> List competitors (direct, indirect, emerging)
PHASE 2: ANALYZE    --> Per competitor: product, pricing, positioning, strengths, weaknesses
PHASE 3: COMPARE    --> Feature matrix, pricing comparison, positioning map
PHASE 4: GAPS       --> Where competitors are weak, where you can differentiate
PHASE 5: ACTIONS    --> Strategic recommendations, messaging angles, feature priorities
```

## Inputs

- `company_profile`: object -- Your company: product, features, pricing, positioning, target customer, current market share, unique capabilities
- `known_competitors`: array -- (Optional) Competitors you're already aware of, with any available data
- `product_features`: array -- Your product's feature list with capability level (strong/moderate/weak/missing) for comparison
- `market_context`: object -- Industry, market size, growth rate, buyer personas, key trends

## Outputs

- `competitor_profiles`: array -- Detailed profile per competitor: company overview, product, pricing, positioning, strengths, weaknesses, customer sentiment
- `feature_matrix`: object -- Weighted feature comparison across all competitors with scores
- `positioning_map`: object -- 2x2 positioning maps showing competitive landscape visually
- `gap_analysis`: object -- Competitive gaps (your opportunities) and vulnerabilities (your weaknesses) with strategic recommendations
- `strategic_recommendations`: object -- Product priorities, messaging angles, sales battlecards, and competitive monitoring plan

---

## Execution

### Phase 1: IDENTIFY -- Find All Competitors

**Entry criteria:** Company profile and market context are provided.

**Actions:**

1. **List direct competitors:**
   ```
   Same category, same buyer, same problem.
   Sources:
   - G2/Capterra category pages
   - Search "[your category] alternatives" and "[competitor] alternatives"
   - Ask sales: "Who do we lose deals to?"
   - Ask customers: "What else did you evaluate?"
   - Analyst reports (Gartner MQ, Forrester Wave)
   - Crunchbase: companies with similar descriptions + recent funding
   ```

2. **List indirect competitors:**
   ```
   Different product, same problem solved.
   - Adjacent categories expanding toward your space
   - Platform features from larger companies (Salesforce adding X, Microsoft adding Y)
   - DIY solutions (spreadsheets, scripts, manual processes)
   - Consulting firms offering the same outcome as a service
   ```

3. **List emerging competitors:**
   ```
   New entrants that could become threats in 12-24 months.
   Sources:
   - Y Combinator/TechStars recent batches in your space
   - Product Hunt launches in your category
   - Open source projects gaining traction (GitHub stars trend)
   - Well-funded startups in adjacent markets signaling expansion
   - Acqui-hires or acquisitions by major players
   ```

4. **Prioritize for deep analysis:**
   ```
   Tier 1 (deep analysis): Direct competitors you encounter in deals (3-5)
   Tier 2 (monitor): Indirect competitors with growing overlap (3-5)
   Tier 3 (watch): Emerging threats to revisit quarterly (3-5)
   
   Prioritize by: frequency in competitive deals, market share, growth rate, strategic threat
   ```

**Output:** Categorized competitor list with tier assignment and prioritization rationale.

**Quality gate:** At least 3 direct competitors identified. At least 2 indirect competitors identified. At least 1 emerging threat identified. Sources are cited for each.

---

### Phase 2: ANALYZE -- Deep Competitor Profiles

**Entry criteria:** Prioritized competitor list is complete.

**Actions:**

For each Tier 1 competitor, build a comprehensive profile:

1. **Company overview:**
   ```
   - Founding year, headquarters, employee count
   - Funding history and total raised (or public market cap)
   - Estimated revenue and growth rate
   - Key leadership (CEO, CPO, CTO -- their backgrounds signal strategy)
   - Recent news: launches, partnerships, acquisitions, layoffs
   ```

2. **Product analysis:**
   ```
   - Core features and capabilities
   - Unique features (things only they have)
   - Known limitations and gaps
   - Technology stack (if relevant)
   - Platform maturity (v1 vs mature product)
   - API/integration ecosystem
   - Mobile/offline capabilities
   - Security and compliance certifications
   ```

3. **Pricing analysis:**
   ```
   - Pricing model (per-seat, usage, tiered, custom)
   - Published price points
   - Estimated average deal size
   - Discount patterns (end-of-quarter, annual, volume)
   - Free trial or freemium availability
   - Contract terms (monthly, annual, multi-year)
   - Hidden costs (implementation, training, support tiers)
   ```

4. **Positioning analysis:**
   ```
   - Tagline and key messaging
   - Target buyer persona (who they sell to)
   - Primary value proposition
   - How they describe themselves (website, pitch deck, analyst briefings)
   - Category they claim to own or create
   - Analyst positioning (Gartner MQ quadrant, Forrester placement)
   ```

5. **Strengths assessment:**
   ```
   Evidence-based strengths (not just claims):
   - High G2/Capterra ratings in specific areas
   - Customer testimonials highlighting specific capabilities
   - Known large customer logos
   - Technical advantages (speed, scale, architecture)
   - Business advantages (distribution, brand, partnerships)
   ```

6. **Weakness assessment:**
   ```
   Evidence-based weaknesses:
   - Low G2 ratings in specific areas
   - Common complaints in reviews (look for patterns across 20+ reviews)
   - Known churn reasons (from win/loss analysis, customer interviews)
   - Public incidents (outages, security breaches, data issues)
   - Organizational issues (layoffs, exec departures, strategy pivots)
   - Product debt (legacy architecture, slow feature velocity)
   ```

7. **Customer sentiment analysis:**
   ```
   Sources: G2, Capterra, TrustRadius, Reddit, Hacker News, Twitter/X
   
   Aggregate:
   - Top 3 praised attributes (with evidence count)
   - Top 3 criticized attributes (with evidence count)
   - Trend: improving, stable, or declining sentiment
   - Common reasons for switching away
   ```

**Output:** Detailed profiles for each Tier 1 competitor. Summary profiles for Tier 2 and 3.

**Quality gate:** Each Tier 1 profile has all 7 sections completed. Strengths and weaknesses are evidence-based (linked to specific data points). Customer sentiment includes at least 10 data points per competitor.

---

### Phase 3: COMPARE -- Feature and Positioning Matrices

**Entry criteria:** Competitor profiles are complete.

**Actions:**

1. **Build weighted feature matrix:**
   ```
   Steps:
   1. List all features that matter to buyers (15-25 features)
   2. Assign importance weight to each (must sum to 100%)
      Weight source: buyer surveys, win/loss analysis, feature usage data
   3. Score each competitor 1-10 per feature
      Score source: product testing, reviews, customer feedback
   4. Compute weighted score per competitor
   
   Feature weights should reflect BUYER priorities, not your priorities.
   Common mistake: weighting features you're good at higher.
   ```

2. **Build pricing comparison:**
   ```
   Define 3 standard buyer profiles:
   - Small (10 users, basic needs)
   - Medium (50 users, standard needs)
   - Large (200 users, advanced needs)
   
   Calculate monthly cost per competitor per profile.
   Note: include hidden costs (support, implementation, add-ons)
   
   Compute cost-per-feature scores to identify value leaders.
   ```

3. **Create positioning map (2x2):**
   ```
   Choose axes that reveal strategic space:
   
   Common axis pairs:
   - Price vs Capability (value map)
   - Simple vs Complex (ease of use)
   - SMB vs Enterprise (target market)
   - Point solution vs Platform (scope)
   - Established vs Innovative (maturity)
   
   Plot each competitor. Identify empty quadrants (opportunity zones).
   ```

4. **Competitive dynamics assessment:**
   ```
   - Who is gaining share? (fastest growth)
   - Who is losing share? (declining or stagnant)
   - Who is expanding scope? (adding features in your direction)
   - Who is raising prices? (capturing margin vs growing share)
   - Who just raised funding? (preparing to invest)
   ```

**Output:** Weighted feature matrix with scores, pricing comparison across buyer profiles, positioning map(s), and competitive dynamics summary.

**Quality gate:** Feature weights reflect buyer priorities (justified). At least 3 competitors are scored across at least 10 features. Positioning map reveals at least one empty quadrant or opportunity zone.

---

### Phase 4: GAPS -- Competitive Opportunities and Vulnerabilities

**Entry criteria:** Comparison matrices are complete.

**Actions:**

1. **Identify competitive gaps (your opportunities):**
   ```
   For each competitor weakness:
   - Is it important to buyers? (weight > 5% in feature matrix)
   - Can you credibly fill it? (current or planned capability)
   - Is the gap durable? (will they close it in <12 months?)
   
   Types of exploitable gaps:
   - Feature gaps: capabilities nobody does well
   - Experience gaps: onboarding, support, UX that frustrate users
   - Pricing gaps: price points nobody occupies
   - Segment gaps: buyer types nobody serves well
   - Integration gaps: ecosystem connections nobody has made
   - Speed gaps: deployment or time-to-value nobody delivers
   ```

2. **Identify your vulnerabilities (defend or concede):**
   ```
   For each area where competitors score higher:
   - Is it important enough to defend? (buyer weight)
   - Can you close the gap in 6 months? (feasibility)
   - Does it cause deal losses? (win/loss evidence)
   
   For each vulnerability, decide:
   DEFEND: invest to close the gap (it's causing deal losses)
   CONCEDE: acknowledge, don't compete here (it's not decisive)
   REFRAME: change the conversation ("you don't need X, you need Y")
   ```

3. **Detect competitive movement:**
   ```
   Compare current profiles to 6 months ago:
   - Did any competitor add features that close a gap you exploited?
   - Did any competitor change pricing in a way that affects you?
   - Did any emerging competitor hit a traction milestone?
   - Are any competitors showing signs of decline? (opportunity to capture share)
   ```

**Output:** Gap analysis with opportunities and vulnerabilities, each with a strategic decision (exploit/defend/concede/reframe), and competitive movement alerts.

**Quality gate:** Every gap is assessed for buyer importance and feasibility. Every vulnerability has a strategic decision. At least 2 exploitable gaps are identified with specific action plans.

---

### Phase 5: ACTIONS -- Strategic Recommendations

**Entry criteria:** Gap analysis is complete.

**Actions:**

1. **Product priorities:**
   ```
   Based on gaps and vulnerabilities, recommend feature priorities:
   - Build: features that exploit gaps competitors can't close quickly
   - Improve: features where you're close to parity but not quite there
   - Skip: features where competitors have insurmountable leads
   - Acquire: capabilities faster obtained through acquisition or partnership
   
   Each priority with: rationale, competitive impact, estimated effort, timeline
   ```

2. **Messaging angles:**
   ```
   Per competitor, define primary attack angle:
   "When competing against [Competitor], lead with [our strength]
    and attack [their weakness]. Avoid discussing [their strength]."
   
   Create messaging that's:
   - Positive (lead with what you do well, not what they do poorly)
   - Specific (concrete claims, not vague superiority)
   - Provable (can you demo it? cite data? show a customer quote?)
   ```

3. **Sales battlecards:**
   ```
   Per Tier 1 competitor, one-page battlecard:
   
   THEM IN 30 SECONDS:
   [What they do, who they sell to, what they charge]
   
   WHY WE WIN:
   1. [Differentiator 1 with proof point]
   2. [Differentiator 2 with proof point]
   3. [Differentiator 3 with proof point]
   
   WHERE THEY'RE STRONG:
   [Acknowledge honestly -- sales reps need to know this]
   
   LANDMINES TO SET:
   [Questions to ask prospects that expose competitor weaknesses]
   "Ask them about [topic] -- their answer will reveal [gap]."
   
   OBJECTION HANDLING:
   "They have more features" -> [response]
   "They're the market leader" -> [response]
   "They're cheaper" -> [response]
   
   CUSTOMER QUOTE:
   "[Quote from customer who switched from them to us]"
   ```

4. **Competitive monitoring plan:**
   ```
   Weekly: scan competitor social media, product updates, blog posts
   Monthly: review competitor pricing pages and feature lists
   Quarterly: full competitor profile refresh, update battlecards
   Ongoing: log every competitive deal (win/loss) with reason
   
   Alerts to set:
   - Google Alerts: competitor names, "[our company] vs [competitor]"
   - Product Hunt: new launches in our category
   - Crunchbase: funding rounds for tier 2-3 competitors
   - G2: competitor review volume and rating changes
   ```

**Output:** Product priority recommendations, messaging angles per competitor, sales battlecards, and competitive monitoring plan.

**Quality gate:** Product priorities are linked to specific competitive gaps. Messaging angles are specific and provable. Each Tier 1 competitor has a battlecard. Monitoring plan has specific cadence and assignments.

## Exit Criteria

The skill is DONE when:
- At least 3 direct, 2 indirect, and 1 emerging competitor are identified
- Tier 1 competitors have complete profiles (product, pricing, positioning, strengths, weaknesses)
- Feature matrix is built with buyer-weighted scoring
- Gap analysis identifies at least 2 exploitable opportunities and addresses key vulnerabilities
- Strategic recommendations include product priorities, messaging, and battlecards

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| IDENTIFY | Market is too new, few competitors exist | **Adjust** -- focus on adjacent market competitors and substitutes |
| IDENTIFY | Too many competitors (>15 direct) | **Adjust** -- tier aggressively, deep-analyze top 5 only |
| ANALYZE | Competitor pricing is hidden (enterprise-only) | **Adjust** -- estimate from customer reports, job postings, public filings |
| ANALYZE | No customer reviews available | **Adjust** -- use social media sentiment, community forums, conference talks |
| COMPARE | Feature data is inconsistent across competitors | **Adjust** -- normalize to capability levels (strong/moderate/weak/none) instead of 1-10 |
| GAPS | No clear gaps found (competitors cover everything) | **Adjust** -- focus on experience, speed, price, or segment gaps instead of feature gaps |
| ACTIONS | Team lacks resources for recommended priorities | **Adjust** -- rank by impact/effort, recommend smallest viable competitive response |
| ACT | User rejects the competitive analysis or requests significant changes to the findings | **Adjust** -- incorporate specific feedback (e.g., a competitor was miscategorized, a feature score is wrong, a gap was missed), update the affected profiles and matrices, and regenerate the recommendations; do not restart from Phase 1 unless the company profile or market context was fundamentally incorrect |
| ACT | User rejects final output | **Targeted revision** -- ask which competitor profile, feature comparison, or gap finding fell short and rerun only that section. Do not re-analyze all competitors. |

## State Persistence

Between runs, this skill saves:
- **Competitor profiles**: complete profiles with version history (detect changes over time)
- **Feature matrix**: with score history (track when competitors improve)
- **Pricing history**: competitor pricing changes over time
- **Win/loss log**: competitive deal outcomes with reasons
- **Movement alerts**: competitive changes detected between runs
- **Battlecard versions**: current and historical battlecards per competitor

---

## Reference

### Competitor Research Sources

```
PUBLIC DATA:
  - Website, blog, changelog, press releases
  - Pricing page (archive.org for historical)
  - Job postings (signal strategy: hiring ML engineers = ML investment)
  - Patent filings (signal R&D direction)
  - Public filings (10-K, S-1 for public companies)
  - Conference talks and webinar recordings

CUSTOMER INTELLIGENCE:
  - G2, Capterra, TrustRadius reviews (sort by recent, filter by segment)
  - Reddit r/[industry] threads comparing products
  - Twitter/X: search "[competitor] sucks" and "[competitor] love"
  - Hacker News discussions
  - LinkedIn: customer posts about switching

SALES INTELLIGENCE:
  - Win/loss interviews with prospects
  - Competitive deals in CRM (track frequency, win rate per competitor)
  - Sales rep anecdotal feedback (what do they hear in calls?)
  - RFP responses (what competitors claim in formal bids)

ANALYST INTELLIGENCE:
  - Gartner Magic Quadrant placement and commentary
  - Forrester Wave scores
  - IDC MarketScape
  - Industry-specific analyst reports
```

### Feature Matrix Weighting Framework

```
Assign weights based on BUYER priority, not your strengths.

Methods to determine weights:
1. Win/loss analysis: which features are mentioned most in wins and losses?
2. Customer surveys: "rank these features by importance to your purchase decision"
3. Usage data: which features have highest engagement among retained customers?
4. Sales feedback: "what features do prospects ask about most?"

Weight validation:
- If your total weighted score is the highest, your weights might be biased
- Cross-check with an independent source (analyst report, buyer survey)
- Weights should be stable quarter-over-quarter (buyer priorities don't change fast)
```

### Competitive Intelligence Ethics

```
DO:
  - Use publicly available information
  - Attend competitor webinars and conferences
  - Read their documentation, blog, and marketing
  - Analyze customer reviews on public platforms
  - Ask your customers what they evaluated and why

DO NOT:
  - Misrepresent yourself to access competitor pricing
  - Poach employees specifically for competitive intelligence
  - Reverse-engineer protected intellectual property
  - Spread false information about competitors
  - Access non-public competitor data through any means

The goal is to be better, not to make them look worse.
```

### Battlecard Template

```
[COMPETITOR NAME] BATTLECARD
Last updated: [date]

WHO THEY ARE (30 seconds):
  [Company], [employees], [funding/revenue]. They sell [product]
  to [buyer] for [price]. Known for [2-3 things].

WHY CUSTOMERS CHOOSE US OVER THEM:
  1. [Advantage with proof]
  2. [Advantage with proof]
  3. [Advantage with proof]

WHY CUSTOMERS CHOOSE THEM OVER US:
  1. [Their advantage -- be honest]
  2. [Their advantage]

LANDMINE QUESTIONS:
  1. "How does [competitor] handle [gap area]?"
  2. "What does [competitor] charge for [hidden cost]?"
  3. "Can you show me [competitor] doing [our strength]?"

OBJECTION RESPONSES:
  "They're bigger/more established"
    -> "Bigger means slower. We ship [X] features/quarter. Ask them
       how many they shipped last quarter."
  
  "They're cheaper"
    -> "Compare total cost including [hidden cost]. Most customers
       find we're [X%] cheaper when you factor in [detail]."
  
  "They have [feature we lack]"
    -> "That's true today. We're shipping [feature] in [quarter].
       Meanwhile, we have [alternative approach] which [benefit]."

RECENT WIN:
  "[Customer] switched from [competitor] to us because [reason].
   They saw [specific improvement] in [timeframe]."
```

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
