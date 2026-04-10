# Review Sentiment Analyzer

Analyzes product reviews for sentiment patterns across aspects, clusters issues by theme, prioritizes by frequency-severity-recency scoring, and generates actionable product improvement and messaging recommendations with trend tracking over time.

## Execution Pattern: Phase Pipeline

```
PHASE 1: COLLECT    --> Gather and normalize review data (text, rating, date, platform, verified)
PHASE 2: ANALYZE    --> Classify sentiment per aspect (quality, shipping, support, value, features)
PHASE 3: CLUSTER    --> Group negative reviews by theme, identify root causes
PHASE 4: PRIORITIZE --> Rank issue clusters by frequency x severity x recency
PHASE 5: RECOMMEND  --> Generate actionable fixes per cluster with expected impact
```

## Inputs

- **review_data**: array of objects -- Reviews to analyze:
  - `text`: string -- Review body
  - `rating`: number (1-5) -- Star rating
  - `date`: string (ISO date) -- Review date
  - `platform`: string -- Source platform (Amazon, Shopify, G2, Trustpilot, etc.)
  - `verified_purchase`: boolean (optional)
  - `helpful_votes`: number (optional) -- Social proof weight
- **product_context**: object -- What the product is:
  - `product_name`: string
  - `category`: string
  - `price_point`: number
  - `key_claims`: string[] -- What the product promises (used to check expectation alignment)
  - `recent_changes`: string[] (optional) -- Recent product updates that may affect reviews
- **analysis_period**: object (optional) -- Time window:
  - `start_date`: string (ISO date)
  - `end_date`: string (ISO date)
  - `compare_to`: string -- "previous_period" | "all_time" | specific date range
- **comparison_baseline**: object (optional) -- Competitor reviews or previous analysis for comparison

## Outputs

- **sentiment_report**: object -- Overall sentiment analysis:
  - `overall_sentiment`: number (-100 to +100, net sentiment score)
  - `rating_distribution`: object -- Count per star rating
  - `aspect_sentiments`: array of {aspect, positive_pct, neutral_pct, negative_pct, net_sentiment, trend}
  - `sentiment_trend`: array of {period, net_sentiment} -- Over time
  - `key_findings`: string[] -- Top 3-5 insights
- **issue_clusters**: array of objects -- Grouped negative feedback:
  - `cluster_name`: string
  - `theme`: string
  - `frequency`: number -- Count of reviews mentioning this issue
  - `frequency_pct`: number -- Percentage of total reviews
  - `severity`: string ("critical" | "high" | "medium" | "low")
  - `representative_quotes`: string[] -- 3-5 actual review excerpts
  - `root_cause`: string -- Likely underlying cause
  - `trend`: string ("emerging" | "stable" | "declining")
- **priority_matrix**: array of objects -- Ranked issues:
  - `cluster_name`: string
  - `priority_score`: number (0-10)
  - `frequency_score`: number
  - `severity_score`: number
  - `recency_score`: number
  - `rank`: number
- **action_recommendations**: array of objects -- What to do:
  - `cluster_name`: string
  - `action`: string
  - `expected_impact`: string
  - `effort`: string ("low" | "medium" | "high")
  - `timeline`: string
  - `validation_metric`: string

## Execution

### Phase 1: COLLECT -- Gather and Normalize

**Entry criteria:** review_data provided with at least 20 reviews containing text and rating fields.

**Actions:**
1. Normalize review data:
   - Standardize date formats to ISO 8601
   - Normalize ratings to 1-5 scale (convert 10-point scales, thumbs up/down to star equivalents)
   - Identify and flag potential fake reviews: identical text, review farms (multiple reviews same day from new accounts), incentivized reviews
   - Weight reviews by helpfulness votes (reviews with 10+ helpful votes carry 2x weight in analysis)
2. Compute baseline statistics:
   - Total review count, date range, rating distribution
   - Average rating overall and by time period (monthly/weekly)
   - Review velocity: are reviews increasing, stable, or decreasing?
   - Rating trend: is the average rating improving, stable, or declining?
3. Separate reviews by time period if analysis_period is specified:
   - Analysis period reviews (primary analysis set)
   - Comparison period reviews (for trend detection)
4. Extract review metadata:
   - Platform distribution (if multi-platform)
   - Verified vs. unverified purchase ratio
   - Review length distribution (longer reviews tend to be more informative)

**Output:** Normalized review dataset with computed statistics, flagged anomalies, and time-period segmentation.

**Quality gate:** At least 20 valid reviews after normalization. Rating distribution computed. If fewer than 20 reviews, warn that analysis will have low statistical confidence. Date range spans at least 30 days (if less, trend analysis will be unreliable).

### Phase 2: ANALYZE -- Sentiment Classification

**Entry criteria:** Normalized review dataset ready. Baseline statistics computed.

**Actions:**
1. Define aspect categories based on product category:
   - **Universal aspects:** Quality, Value/Price, Shipping/Delivery, Customer Support, Ease of Use
   - **Category-specific aspects:**
     - Electronics: Battery Life, Build Quality, Connectivity, Sound/Display Quality
     - Clothing: Fit, Material, Durability, Color Accuracy
     - Food/Beverage: Taste, Freshness, Packaging, Nutritional Value
     - Software/SaaS: Performance, Reliability, Features, Learning Curve, Integration
     - Home/Kitchen: Durability, Assembly, Size/Dimensions, Cleaning
2. For each review, classify sentiment per mentioned aspect:
   - **Positive:** Explicit praise, satisfaction, recommendation ("love the battery life", "perfect fit")
   - **Negative:** Explicit complaint, disappointment, warning ("broke after a week", "runs small")
   - **Neutral:** Mention without strong sentiment ("battery is standard", "normal shipping time")
   - **Mixed:** Same review contains both positive and negative for the same aspect
3. Calculate aspect-level metrics:
   - Positive/Neutral/Negative percentage per aspect
   - Net sentiment per aspect: `(positive_pct - negative_pct)`
   - Aspect mention frequency: which aspects do customers care about most?
4. Compute sentiment trends:
   - Net sentiment per aspect over time (monthly or weekly depending on review volume)
   - Detect significant changes: >15% net sentiment shift in any aspect = "emerging trend"
   - Cross-reference sentiment changes with product_context.recent_changes (did a product update cause a shift?)
5. Compare against baseline (if comparison_baseline provided):
   - Which aspects are stronger/weaker vs. competitor?
   - Where is the sentiment gap largest?

**Output:** Aspect-level sentiment matrix with percentages, trends, and comparison data.

**Quality gate:** At least 5 aspects analyzed with sentiment percentages. Trend data available for at least the last 3 periods. If an aspect has fewer than 10 mentions, flag as "low confidence" and deprioritize in recommendations.

### Phase 3: CLUSTER -- Theme Grouping

**Entry criteria:** Aspect sentiment analysis complete. Negative reviews identified per aspect.

**Actions:**
1. Take all negative reviews (1-3 stars, or reviews with negative aspect sentiment) and group by semantic theme:
   - Read each negative review and extract the specific complaint
   - Group complaints that describe the same underlying issue (even if worded differently)
   - Name each cluster with a clear, descriptive label (not "Issue 1" but "Battery Dies Within 3 Hours")
2. For each cluster:
   - Count the number of reviews (frequency)
   - Calculate percentage of total reviews
   - Select 3-5 representative quotes that best illustrate the issue
   - Identify the likely root cause:
     - Manufacturing defect (consistent hardware failures)
     - Design limitation (inherent product trade-off)
     - Expectation mismatch (listing promises don't match reality)
     - Software/firmware issue (bug or regression)
     - Supply chain issue (shipping damage, delays)
     - Support failure (unresolved complaints)
   - Classify severity:
     - **Critical:** Safety issue, product doesn't work, legal/compliance risk
     - **High:** Core functionality impaired, significant customer disappointment
     - **Medium:** Non-core issue, moderate inconvenience
     - **Low:** Minor annoyance, cosmetic, edge case
3. Detect emerging clusters:
   - Clusters where >60% of mentions are from the most recent 30 days = "emerging"
   - Clusters with consistent mentions over time = "stable"
   - Clusters with decreasing mentions = "declining" (possibly already addressed)

**Output:** Themed issue clusters with frequency, severity, representative quotes, root causes, and trend classification.

**Quality gate:** Clusters account for at least 80% of negative reviews (no more than 20% uncategorized). Each cluster has at least 3 reviews (otherwise merge with related cluster or classify as "other"). Root cause identified for every cluster.

### Phase 4: PRIORITIZE -- Impact Ranking

**Entry criteria:** Issue clusters defined with frequency, severity, and trend data.

**Actions:**
1. Score each cluster on three dimensions (each 0-10):

   **Frequency Score (40% weight):**
   - >30% of reviews mention this issue = 10
   - 20-30% = 8
   - 10-20% = 6
   - 5-10% = 4
   - <5% = 2

   **Severity Score (35% weight):**
   - Critical = 10
   - High = 8
   - Medium = 5
   - Low = 2

   **Recency Score (25% weight):**
   - Emerging (accelerating in last 30 days) = 10
   - Stable (consistent over time) = 5
   - Declining (decreasing over time) = 2

2. Calculate priority score: `(frequency × 0.4) + (severity × 0.35) + (recency × 0.25)`
3. Rank clusters by priority score (descending).
4. Identify "quick wins": clusters with high priority but low fix effort.
5. Identify "strategic fixes": clusters that require significant investment but would transform the product perception.
6. Identify "noise": clusters that are low priority and low effort -- fix if convenient but don't prioritize.

**Output:** Priority-ranked issue matrix with scores, rankings, and quick-win/strategic classifications.

**Quality gate:** All clusters scored on all three dimensions. Priority ranking is unambiguous (no ties -- break ties by severity first, then recency). At least one cluster identified as a quick win.

### Phase 5: RECOMMEND -- Actionable Fixes

**Entry criteria:** Priority matrix complete with ranked clusters.

**Actions:**
1. For each cluster (top 5 by priority), generate a specific, actionable recommendation:
   - **What to fix:** Concrete action, not vague ("patch firmware BLE stack" not "improve connectivity")
   - **Expected impact:** Estimated reduction in negative reviews, rating improvement projection
   - **Effort level:** Low (content/messaging change), Medium (software update), High (hardware/product redesign)
   - **Timeline:** Immediate (this week), Short-term (this month), Long-term (next quarter)
   - **Validation metric:** How to know the fix worked ("monitor reviews mentioning [topic] -- target <5% negative within 30 days of fix")

2. For issues that can't be fixed (design limitations, inherent trade-offs):
   - Recommend messaging changes: update product listing to set accurate expectations
   - Recommend FAQ additions: preempt the complaint
   - Recommend response templates: acknowledge the trade-off, explain the reasoning

3. Generate positive sentiment amplification recommendations:
   - Identify top 3 things customers love (highest positive sentiment aspects)
   - Recommend incorporating these into marketing copy, product listings, and social proof
   - Extract the best quotes for testimonials (5-star reviews with specific outcomes)

4. Create a review response strategy:
   - Template for responding to negative reviews per cluster (acknowledge, explain, resolve)
   - Template for responding to positive reviews (thank, reinforce, encourage sharing)
   - Escalation criteria: which reviews require personal response from leadership?

5. Update state persistence with current analysis for future trend tracking.

**Output:** Action plan with fixes, messaging changes, amplification recommendations, and review response strategy.

**Quality gate:** Top 5 clusters each have a specific action with effort, timeline, and validation metric. At least 2 positive sentiment themes identified for amplification. Review response templates provided for the top 3 negative clusters.

## Exit Criteria

The skill is DONE when:
1. Sentiment report covers all relevant aspects with percentages and trends.
2. Negative reviews are clustered into themes covering at least 80% of complaints.
3. Priority matrix ranks all clusters by frequency, severity, and recency.
4. Action recommendations exist for the top 5 priority clusters with specific fixes and timelines.
5. Positive sentiment amplification recommendations are included.
6. Review response templates are provided for the top 3 negative clusters.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| COLLECT | Fewer than 20 reviews provided | **Adjust** -- proceed with low-confidence warning. All recommendations marked as "directional" rather than "statistically significant" |
| COLLECT | Reviews lack text (ratings only) | **Adjust** -- analyze rating distribution and trends only. Skip aspect-level sentiment and clustering. Recommend collecting text reviews. |
| ANALYZE | Product category not recognized for aspect definitions | **Adjust** -- use universal aspects only (Quality, Value, Shipping, Support, Ease of Use) |
| ANALYZE | Review language is not English | **Adjust** -- note language limitation, attempt analysis with reduced confidence on nuanced sentiment |
| CLUSTER | Negative reviews are too diverse to cluster (<3 per theme) | **Adjust** -- report as "diffuse dissatisfaction" with no dominant issue. Recommend improving overall quality rather than targeting specific issues. |
| PRIORITIZE | All clusters score similarly | **Adjust** -- break ties by actionability (which can be fixed fastest/cheapest) |
| RECOMMEND | No clear fix for a high-priority cluster | **Escalate** -- flag for product team investigation, provide the data and quotes to support their analysis |
| RECOMMEND | User rejects final output | **Targeted revision** -- ask which sentiment cluster, aspect analysis, or recommendation fell short and rerun only that section. Do not re-analyze the full review set. |

## State Persistence

This skill maintains persistent state across executions:
- **sentiment_history**: Time-series of aspect sentiments per analysis run -- enables trend detection across weeks/months
- **cluster_history**: Past issue clusters with resolution status -- detects whether fixes actually worked
- **baseline_snapshots**: Point-in-time sentiment baselines for before/after comparison
- **emerging_issue_alerts**: Issues flagged as "emerging" in previous runs -- checks whether they've grown or stabilized

## Reference

### Net Sentiment Score Calculation

```
Net Sentiment = ((positive_count - negative_count) / total_count) * 100
```

Scale: -100 (all negative) to +100 (all positive). Benchmarks:
- +60 to +100: Excellent -- customers love this aspect
- +20 to +59: Good -- generally positive, minor issues
- -19 to +19: Mixed -- significant room for improvement
- -59 to -20: Poor -- this aspect is hurting the product
- -100 to -60: Critical -- urgent remediation needed

### Review Rating Distribution Benchmarks

Healthy product (4.0+ average):
```
5-star: 55-65%  |  4-star: 15-20%  |  3-star: 8-12%  |  2-star: 5-8%  |  1-star: 5-8%
```

Unhealthy product (below 3.5 average):
```
5-star: 25-35%  |  4-star: 10-15%  |  3-star: 10-15%  |  2-star: 15-20%  |  1-star: 20-30%
```

The "J-curve" is normal -- most products have a bimodal distribution (lots of 5-star and lots of 1-star). What matters is the ratio and trend, not the shape.

### Fake Review Detection Heuristics

- Identical or near-identical text across multiple reviews
- Multiple reviews posted on the same day with similar phrasing
- Reviews that only mention the product name and generic praise ("Great product! Love it!")
- Reviewer history: single review on the account, or all reviews for same brand
- Timing clusters: 20+ reviews in a single week after months of silence
- Verified purchase flag missing on platforms that track it

### Severity Classification Guide

| Severity | Definition | Examples | Response Urgency |
|---|---|---|---|
| Critical | Safety risk, product completely non-functional, legal exposure | "Caught fire," "Gave me a rash," "Charges credit card twice" | Immediate (same day) |
| High | Core value proposition broken, significant customer loss risk | "Stopped working after 1 month," "Doesn't fit as described" | This week |
| Medium | Inconvenience, non-core feature issue, moderate disappointment | "Louder than expected," "Packaging was damaged" | This month |
| Low | Cosmetic, edge case, personal preference | "Wish it came in blue," "Manual could be clearer" | When convenient |

### Customer Voice to Marketing Copy Framework

When positive sentiment themes are identified, convert customer language directly into marketing copy:

| Customer Says | Marketing Copy Angle |
|---|---|
| "So easy to set up" | "Set up in under 5 minutes -- no tools, no instructions needed" |
| "Better than [competitor]" | "[X]% of customers switched from [competitor] (and stayed)" |
| "Use it every day" | "Built for daily use -- [X]K customers rely on it every morning" |
| "Worth every penny" | "Customers rate it [X]/5 for value -- here's why" |
| "Bought another for my [person]" | "So good, customers buy a second one as a gift" |

Use actual customer language (with permission) in testimonials. Authentic > polished.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
