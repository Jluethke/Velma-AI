# Product Listing Optimizer

Audits and optimizes e-commerce product listings for search visibility and conversion rate across Amazon, Shopify, and other platforms, covering title, bullets, description, keywords, and images with ongoing monitoring recommendations.

## Execution Pattern: Phase Pipeline

```
PHASE 1: AUDIT      --> Analyze current listing: title, description, bullets, images, keywords, reviews
PHASE 2: RESEARCH   --> Competitor analysis, keyword research, category benchmarks
PHASE 3: OPTIMIZE   --> Rewrite title, bullets, description for SEO + conversion
PHASE 4: VALIDATE   --> Check keyword density, readability, platform compliance
PHASE 5: MONITOR    --> Track ranking changes, suggest ongoing optimizations
```

## Inputs

- **current_listing**: object -- The existing product listing:
  - `title`: string
  - `bullets`: string[] -- Bullet points / feature highlights
  - `description`: string -- Product description or A+ Content text
  - `backend_keywords`: string (optional) -- Hidden search terms
  - `images`: array of {url: string, type: string} -- Image inventory
  - `price`: number
  - `reviews`: object -- {count: number, avg_rating: number, common_themes: string[]}
- **product_details**: object -- The actual product specs:
  - `category`: string
  - `brand`: string
  - `key_features`: string[] -- Factual features and specs
  - `materials`: string[]
  - `dimensions`: object
  - `unique_selling_points`: string[]
- **competitor_listings**: array of objects (optional) -- Top competitor listings for comparison
- **platform**: string -- "amazon" | "shopify" | "walmart" | "etsy" | "ebay"

## Outputs

- **optimized_listing**: object -- Rewritten listing elements:
  - `title`: string (platform-optimized)
  - `bullets`: string[] (benefit-first with specs)
  - `description`: string (SEO-optimized, formatted)
  - `backend_keywords`: string (deduplicated, platform-compliant)
- **keyword_report**: object -- Keyword research results:
  - `primary_keywords`: array of {keyword: string, search_volume: string, difficulty: string}
  - `secondary_keywords`: array of same
  - `long_tail`: array of same
  - `keywords_added`: string[] -- New keywords now covered
  - `keyword_coverage_before`: number (0-100)
  - `keyword_coverage_after`: number (0-100)
- **compliance_check**: array of {rule: string, status: string, detail: string}
- **monitoring_plan**: object -- Ongoing optimization schedule

## Execution

### Phase 1: AUDIT -- Listing Analysis

**Entry criteria:** current_listing provided with at minimum: title, at least one bullet or description.

**Actions:**
1. Score each listing element on a 0-10 scale:
   - **Title:** Length utilization (chars used / chars allowed), keyword inclusion, readability, brand presence, key feature inclusion.
   - **Bullets:** Count (all slots used?), benefit-vs-feature ratio, specificity, keyword inclusion, formatting, scannability.
   - **Description:** Word count, keyword inclusion, structure (headers, paragraphs), mobile readability, CTA presence.
   - **Backend Keywords:** Populated (yes/no), byte count utilization, duplicate terms with title/bullets (wasted), irrelevant terms.
   - **Images:** Slot utilization (used/available), type diversity (main, lifestyle, infographic, dimensions, packaging), quality indicators.
   - **Reviews:** Count relative to category leaders, rating vs. category average, sentiment themes.
2. Calculate overall listing score (weighted average across elements).
3. Identify the 3 most impactful improvement areas (elements with lowest scores that have the highest impact on search/conversion).
4. Flag any critical issues: empty required fields, policy violations, broken images.

**Output:** Listing scorecard with per-element scores, overall score, top 3 improvement areas, and critical issues.

**Quality gate:** Every element is scored with specific reasoning. Overall score is calculated. At least one improvement area identified. If listing score > 85, the listing may already be well-optimized -- proceed with minor refinements rather than full rewrite.

### Phase 2: RESEARCH -- Competitive and Keyword Analysis

**Entry criteria:** Listing audit completed. Product category and key features known.

**Actions:**
1. Conduct keyword research for the product category:
   - Identify primary keywords (highest volume, directly relevant)
   - Identify secondary keywords (moderate volume, related terms)
   - Identify long-tail keywords (lower volume, high intent, less competition)
   - Identify question keywords (how, what, best, vs. -- used in descriptions and A+ content)
2. If competitor listings provided, analyze:
   - Title patterns: what keywords do top competitors include?
   - Bullet patterns: what features and benefits do they emphasize?
   - Keyword gaps: what are competitors ranking for that this listing is not?
   - Differentiators: what does this product offer that competitors do not mention?
3. Establish category benchmarks:
   - Average title length for top 10 in category
   - Average bullet count and length
   - Average image count
   - Average review count for page 1 positioning
   - Price range for the top 10
4. Map each keyword to the listing element where it should appear (title, bullet, description, backend).

**Output:** Keyword matrix with volumes and assignments, competitor gap analysis, category benchmarks.

**Quality gate:** At least 15 keywords identified across primary/secondary/long-tail categories. Each keyword assigned to a specific listing element. Competitor analysis covers at least 3 competitors (or competitor_listings provided).

### Phase 3: OPTIMIZE -- Rewrite Listing Elements

**Entry criteria:** Keyword research and competitor analysis completed. Keyword-to-element mapping defined.

**Actions:**
1. **Rewrite Title** following platform-specific rules:
   - Amazon: `[Brand] + [Primary Keyword] + [Key Feature 1] + [Key Feature 2] + [Size/Variant] + [Secondary Keyword]`, max 200 chars
   - Shopify: Focus on readability and primary keyword in first 60 chars (Google snippet length)
   - Include top 3-5 keywords naturally (no keyword stuffing)
   - Front-load the most important information (mobile truncation at ~80 chars)

2. **Rewrite Bullets** following the BENEFIT-SPEC-PROOF pattern:
   - Lead with capitalized benefit header in brackets: [40 HOURS BATTERY LIFE]
   - Follow with the specific spec that supports the benefit
   - Close with proof or context (comparison, use case, certification)
   - Include 2-3 keywords per bullet naturally
   - Use all available bullet slots (5 for Amazon, varies by platform)
   - Each bullet 150-250 characters (long enough for substance, short enough for scanning)

3. **Rewrite Description:**
   - Open with the primary value proposition
   - Structure with scannable headers if platform supports HTML
   - Include remaining keywords not covered in title/bullets
   - Address top customer questions and objections (from review analysis)
   - Include a CTA (e.g., "Add to cart" for Amazon, specific purchase prompt for Shopify)
   - Mobile-first formatting: short paragraphs, no walls of text

4. **Optimize Backend Keywords:**
   - Include keywords NOT already in title or bullets (duplicates waste space)
   - Include common misspellings, synonyms, and Spanish translations (for US Amazon)
   - No punctuation needed (Amazon ignores commas, uses spaces as separators)
   - Stay within platform byte limits (Amazon: 250 bytes)
   - Include competitor-adjacent terms where policy allows (category terms, not brand names)

**Output:** Complete optimized listing with all elements rewritten.

**Quality gate:** Optimized title includes top 3 primary keywords. All bullet slots utilized. Backend keywords contain zero duplicates with title/bullets. Total keyword coverage improved by at least 30% over original listing. All copy reads naturally (not keyword-stuffed).

### Phase 4: VALIDATE -- Compliance and Quality Check

**Entry criteria:** Optimized listing elements complete.

**Actions:**
1. Run platform-specific compliance checks:
   - **Amazon:** No health/medical claims without FDA approval. No "best seller" or "top rated" claims. No competitor brand names. No promotional language ("sale," "free shipping," "limited time"). No HTML in bullets. Title under 200 chars. Backend under 250 bytes.
   - **Shopify:** No duplicate meta descriptions. Title tag under 60 chars for Google. Meta description under 155 chars. Alt text on all images.
   - **All platforms:** No unsubstantiated superlative claims. All specs accurate and verifiable. No ALL CAPS except for bullet headers (Amazon-style).

2. Check keyword density:
   - Primary keyword appears 2-4 times across title + bullets + description (not forced)
   - No single keyword appears more than 5 times total (keyword stuffing signal)
   - Keyword-to-content ratio stays under 3% (natural density)

3. Readability check:
   - Bullets scannable in under 3 seconds each
   - Description readable at 8th-grade level (Flesch-Kincaid)
   - No jargon unless the product category expects it (B2B/technical products excepted)

4. Cross-reference with review themes:
   - Top positive review themes reinforced in listing copy
   - Top negative review themes addressed or preempted (e.g., if reviews mention "smaller than expected," add dimensions prominently)

**Output:** Compliance report with pass/fail per rule, keyword density analysis, readability scores.

**Quality gate:** Zero compliance violations that would risk listing suppression. Keyword density within acceptable ranges. Readability appropriate for target audience. If any violation found, return to Phase 3 to fix before proceeding.

### Phase 5: MONITOR -- Ongoing Optimization Plan

**Entry criteria:** Optimized listing validated and compliant.

**Actions:**
1. Create a 30-day monitoring checklist:
   - Week 1: Verify keyword indexing daily (check if listing appears for target keywords)
   - Week 2: Track BSR/ranking movement vs. pre-optimization baseline
   - Week 3: Compare conversion rate (sessions-to-orders) vs. pre-optimization
   - Week 4: Full performance review, identify any keywords still not ranking
2. Define ongoing optimization cadence:
   - Monthly: Refresh keyword research (search trends change seasonally)
   - Quarterly: Competitor re-analysis (new competitors, price changes)
   - After every 50 new reviews: Update listing to address new review themes
   - After major algorithm updates: Full re-audit
3. Identify next-level optimization opportunities:
   - A+ Content / Enhanced Brand Content (if eligible)
   - Video content for listing
   - Sponsored product campaigns targeting gap keywords
   - Review generation strategy (Vine, follow-up emails)
4. Store optimization baseline in state for future comparison.

**Output:** 30-day monitoring plan, ongoing optimization cadence, next-level opportunities.

**Quality gate:** Monitoring plan includes specific metrics to track with pre-optimization baselines. At least 2 next-level opportunities identified.

## Exit Criteria

The skill is DONE when:
1. Every listing element has been audited and scored.
2. Keyword research covers at least 15 keywords with volume and difficulty data.
3. All listing elements (title, bullets, description, backend keywords) are rewritten and optimized.
4. Compliance check passes with zero suppression-risk violations.
5. 30-day monitoring plan is delivered with specific metrics and baselines.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| AUDIT | Current listing is empty (new product, no existing copy) | **Adjust** -- skip audit scoring, proceed directly to Research with product_details as the foundation |
| RESEARCH | No competitor listings provided and category unknown | **Adjust** -- use product_details to infer category, research top 10 products in that category |
| OPTIMIZE | Platform-specific rules unknown (uncommon platform) | **Adjust** -- apply Amazon rules as the most restrictive baseline, flag that platform-specific validation may be incomplete |
| VALIDATE | Compliance violation found in optimized copy | **Retry** -- return to Phase 3, rewrite the violating element, re-validate (max 2 retries) |
| MONITOR | No baseline data available for comparison | **Adjust** -- use category averages as baseline, note that improvement tracking will be approximate |
| MONITOR | User rejects final output | **Targeted revision** -- ask which title, bullet point, or keyword optimization fell short and rerun only that section. Do not regenerate the full listing. |

## State Persistence

This skill maintains persistent state across executions:
- **keyword_rankings**: Historical keyword position data per ASIN/product -- enables ranking trend analysis
- **competitor_snapshots**: Point-in-time competitor listing captures for drift detection
- **listing_versions**: Every version of the optimized listing with timestamps -- enables A/B comparison
- **performance_baselines**: BSR, conversion rate, sessions at time of optimization -- measures impact

## Reference

### Amazon A9 Algorithm Key Factors

Amazon's search algorithm ranks listings based on:
1. **Relevance** (keyword matching): Title keywords weighted most heavily, then bullets, then description, then backend. Exact phrase matches weighted higher than individual word matches.
2. **Performance** (conversion rate): Listings with higher conversion rates rank higher. This creates a virtuous cycle -- better copy -> more conversions -> higher rank -> more visibility.
3. **Customer Satisfaction** (reviews + returns): Higher ratings and lower return rates improve ranking. Addressing common complaints in listing copy reduces returns.

### Title Formula by Platform

**Amazon:** `[Brand] [Primary Keyword] [Material/Key Attribute] [Size/Quantity] [Secondary Keyword] [Color/Variant]`
- Max: 200 characters (150 recommended for mobile)
- Front-load primary keyword in first 80 characters

**Shopify (Google SEO):** `[Primary Keyword] - [Key Benefit] | [Brand]`
- Max: 60 characters for full Google display
- Include primary keyword in first 3 words

**Walmart:** `[Brand] [Product Type] [Key Features], [Size/Count]`
- Max: 75 characters
- Stricter than Amazon on title formatting

### Bullet Point BENEFIT-SPEC-PROOF Framework

```
[CAPITALIZED BENEFIT HEADER] Supporting detail with specific spec.
Context or proof that makes the benefit concrete and credible.
```

**Bad bullet:** "Good battery life"
**Good bullet:** "[40 HOURS TOTAL PLAYTIME] 8 hours per charge plus 32 hours from the compact charging case. That's a full work week without reaching for a charger."

The difference: specific number, comparison to real-world context (work week), and a vivid image (reaching for a charger).

### Backend Keyword Rules (Amazon)

- 250 bytes maximum (not characters -- accented characters use 2+ bytes)
- Space-separated (commas waste bytes)
- No duplicate words already in title or bullets
- No ASINs, brand names, or "by [brand]"
- Include: synonyms, abbreviations, alternate spellings, Spanish translations
- Exclude: subjective claims ("best"), temporary terms ("new"), competitor names

### Conversion Rate Benchmarks by Category

| Category | Average CVR | Good CVR | Excellent CVR |
|---|---|---|---|
| Electronics | 8-12% | 13-16% | 17%+ |
| Home & Kitchen | 10-14% | 15-18% | 19%+ |
| Beauty | 7-10% | 11-14% | 15%+ |
| Clothing | 5-8% | 9-12% | 13%+ |
| Sports/Outdoors | 8-11% | 12-15% | 16%+ |
| Pet Supplies | 12-16% | 17-20% | 21%+ |

If your CVR is below category average, the listing copy is likely the bottleneck (assuming price is competitive and reviews are adequate).

### Image Slot Strategy (Amazon 7-Slot)

| Slot | Type | Purpose |
|---|---|---|
| 1 | Main (white background) | Required. Clean product shot, fills 85%+ of frame |
| 2 | Infographic | Key features with callouts and icons |
| 3 | Lifestyle | Product in use, target customer context |
| 4 | Dimensions/Scale | Size reference with common object for scale |
| 5 | Multi-angle | Back, side, detail shots |
| 6 | Packaging/What's included | Everything in the box |
| 7 | Comparison chart or Social proof | vs. competitors (your own products) or review quotes |

Copyright 2024-present The Wayfinder Trust. All rights reserved.
