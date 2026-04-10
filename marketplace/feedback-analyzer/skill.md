# Feedback Analyzer

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Foundation pattern for analyzing collections of human feedback (reviews, survey responses, support tickets, comments) into actionable insights. Categorizes sentiment, extracts themes, identifies the top things people love and hate, spots trends, and produces a prioritized action list. The difference between reading feedback and analyzing it: analysis reveals patterns no single piece of feedback shows. Fork this for: product review analysis, employee feedback, customer support trends, social media sentiment, course evaluations, app store reviews, etc.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Ingest feedback corpus, assess volume and structure
REASON  --> Categorize sentiment, extract themes, identify patterns
PLAN    --> Rank themes by frequency and impact, generate action items
ACT     --> Output insights report with themes, trends, and prioritized actions
     \                                                              /
      +--- New feedback batch or clarification needed --- loop OBSERVE +
```

## Inputs

- `feedback_items`: list[object] -- The feedback to analyze. Each: `{text, source (optional), date (optional), rating (optional), author (optional)}`
- `context`: string -- What the feedback is about (product name, event, service, team) and any known issues or recent changes
- `focus_areas`: list[string] -- Optional: specific topics to pay attention to ("pricing", "onboarding", "performance", "support")
- `comparison_period`: object -- Optional: previous analysis results to compare against for trend detection

## Outputs

- `sentiment_breakdown`: object -- `{positive_pct, negative_pct, neutral_pct, mixed_pct, average_rating}`
- `themes`: list[object] -- Extracted themes sorted by frequency. Each: `{theme, sentiment ("positive"|"negative"|"mixed"), count, percentage, representative_quotes, intensity (1-5)}`
- `top_loves`: list[object] -- Top 3-5 things people love, with evidence
- `top_pains`: list[object] -- Top 3-5 things people dislike or struggle with, with evidence
- `action_items`: list[object] -- Prioritized actions. Each: `{action, priority ("critical"|"high"|"medium"|"low"), theme, expected_impact, effort_estimate}`
- `trends`: list[object] -- Changes compared to previous period (if comparison data provided)
- `outliers`: list[object] -- Notable individual feedback items that do not fit patterns but contain important signals

---

## Execution

### OBSERVE: Ingest and Assess

**Entry criteria:** At least 5 feedback items are provided (fewer than 5 is not a pattern, it is anecdotes).

**Actions:**
1. Assess the corpus. Count total items, date range, source distribution, rating distribution (if ratings exist). Note any obvious skews: all from one source, all from one week, all 1-star or all 5-star.
2. Normalize the data. Standardize date formats. Handle missing fields (items without ratings get sentiment-inferred ratings later). Strip markup or formatting artifacts.
3. Detect language and tone norms. Is this formal feedback (surveys, reviews) or informal (social media, chat)? Informal feedback uses sarcasm, slang, and exaggeration differently. Adjust sentiment analysis accordingly -- "this app is FIRE" is positive, not a safety concern.
4. Flag data quality issues. Duplicate entries, bot-generated reviews (repeated phrasing across items), incentivized reviews ("I received this product for free"), or feedback that is clearly about the wrong product/service.

**Output:** Corpus assessment (volume, date range, source mix), data quality flags, language/tone calibration.

**Quality gate:** At least 5 valid feedback items after quality filtering. Data quality issues are documented.

---

### REASON: Analyze Sentiment and Extract Themes

**Entry criteria:** Corpus is assessed and cleaned.

**Actions:**
1. Classify sentiment per item. Assign each feedback item: positive, negative, neutral, or mixed. Mixed means the item contains both strong positive and strong negative elements (e.g., "Love the product, hate the customer service"). Use the full text, not just ratings -- a 3-star review can be very negative in text.
2. Extract themes. Group feedback by topic, not just sentiment. Identify recurring subjects: features, pricing, support quality, usability, performance, reliability, documentation, onboarding. A theme must appear in at least 10% of items or 3 items (whichever is smaller) to be significant.
3. Score theme intensity. For each theme, assess how strongly people feel (1-5): 1 = mild mention, 3 = clear opinion, 5 = passionate/emotional language. Intensity matters as much as frequency -- 5 people furious about billing is more actionable than 20 people mildly noting the color scheme.
4. Cross-reference themes with ratings. Do specific themes correlate with high or low ratings? A theme that appears mostly in 1-2 star reviews is a pain driver. A theme that appears mostly in 4-5 star reviews is a loyalty driver.
5. If focus_areas are specified, ensure those topics are explicitly analyzed even if they do not appear frequently. The absence of feedback on a focus area is itself a finding ("nobody mentioned onboarding -- either it is fine or nobody is getting that far").

**Output:** Per-item sentiment, theme list with frequency/intensity/sentiment, theme-rating correlations, focus area coverage.

**Quality gate:** Every item has a sentiment classification. Themes are supported by at least 3 items or 10% of corpus. Focus areas are addressed.

---

### PLAN: Prioritize and Generate Actions

**Entry criteria:** Themes are extracted with sentiment and intensity.

**Actions:**
1. Rank top_loves. The 3-5 most frequently mentioned positive themes, ordered by frequency * intensity. Include 1-2 representative quotes per theme (brief, anonymized). These are strengths to protect and amplify.
2. Rank top_pains. The 3-5 most frequently mentioned negative themes, ordered by frequency * intensity. Include representative quotes. These are the highest-leverage improvement opportunities.
3. Generate action items. For each top pain, propose a concrete action: what to do, why it matters (theme frequency and intensity), and the expected impact (how many people would be affected). Assign priority:
   - **Critical**: high frequency + high intensity, directly causes churn or safety issues
   - **High**: high frequency or high intensity, significant pain but not existential
   - **Medium**: moderate frequency and intensity, improvement opportunity
   - **Low**: infrequent but valid, address when resources allow
4. Detect trends. If comparison_period data is provided, compare theme frequencies and sentiments. Identify: new themes (did not exist before), growing themes (frequency increasing), declining themes (improving), and sentiment shifts (a theme that was positive is becoming negative).
5. Identify outliers. Individual feedback items that do not fit any theme but contain unique, high-signal insights. An outlier might identify a bug nobody else mentioned, suggest a feature that reframes the product, or describe a use case you did not know existed.

**Output:** Ranked loves and pains, prioritized action items, trend analysis, outliers.

**Quality gate:** At least 3 loves and 3 pains identified (unless corpus is too small). Every pain has a corresponding action item. Priorities are justified by data.

---

### ACT: Deliver Insights Report

**Entry criteria:** Analysis is prioritized and actions are defined.

**Actions:**
1. Output sentiment_breakdown with percentages and average rating.
2. Output themes ranked by frequency with sentiment, intensity, and representative evidence.
3. Output top_loves and top_pains as the executive summary -- these are what most readers care about.
4. Output action_items prioritized by impact.
5. Output trends if comparison data was provided.
6. Output outliers with context on why they are notable.
7. Note the sample size and any caveats (skewed sources, small corpus, data quality issues).
8. Check for loop trigger: did the analysis reveal that a theme is ambiguous and needs the feedback re-read with a different lens? If so, loop back to REASON.

**Output:** Complete insights report.

**Quality gate:** Insights are supported by data (frequencies, quotes). Action items are specific and prioritized. Caveats are disclosed.

## Exit Criteria

The skill is DONE when:
1. Sentiment breakdown covers all feedback items
2. Themes are extracted with frequency, intensity, and representative evidence
3. Top loves and pains are identified
4. Action items are prioritized with expected impact
5. Caveats about sample size and data quality are noted

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Fewer than 5 feedback items | **Adjust** -- analyze individually rather than thematically, note that patterns cannot be established from small samples |
| OBSERVE | All feedback has identical ratings (e.g., all 5-star) | **Flag** -- possible incentivized or curated feedback, analyze text for genuine vs. formulaic content |
| REASON | No clear themes emerge (all feedback is unique) | **Adjust** -- report at the individual-item level, suggest collecting more feedback before drawing conclusions |
| REASON | Feedback is in multiple languages | **Adjust** -- analyze each language group separately, then merge themes |
| PLAN | All feedback is positive (no pains to address) | **Adjust** -- look for "even better if" suggestions, minor friction points, and feature requests hidden in positive reviews |
| ACT | User rejects final output | **Targeted revision** -- ask which section fell short (theme extraction, sentiment scoring, action item prioritization, or outlier analysis) and rerun only that section. Do not re-analyze the full corpus. |

## State Persistence

Between runs, this skill accumulates:
- **Theme taxonomy**: stable theme categories per product/service, enabling consistent tracking over time
- **Baseline metrics**: sentiment and theme frequencies from previous analyses, powering trend detection
- **Action item tracking**: previously recommended actions and whether they were implemented, enabling impact measurement

## Reference

### Theme Significance Threshold

A theme is significant if it appears in at least 10% of items OR at least 3 items, whichever is smaller.

### Priority Assignment Rules

| Priority | Conditions |
|---|---|
| Critical | High frequency (>20% of items) + high intensity (4-5) + causes churn or safety risk |
| High | High frequency OR high intensity; significant pain but not existential |
| Medium | Moderate frequency (10-20%) and moderate intensity (2-3) |
| Low | Low frequency (<10%) but valid and actionable |

### Sentiment Classification Guide

| Classification | Signal |
|---|---|
| Positive | Net positive language, satisfaction, recommends to others |
| Negative | Frustration, regret, churn intent, complaint language |
| Neutral | Factual, descriptive, no emotional valence |
| Mixed | Contains both strong positive AND strong negative elements in the same item |

Note: Use full text, not just star ratings. A 3-star review can be very negative in language.

### Intensity Scale

| Score | Signal Words / Patterns |
|---|---|
| 1 | Mild mention, passing reference ("it could be better") |
| 2 | Clear preference or mild frustration |
| 3 | Explicit opinion, repeated in multiple items |
| 4 | Strong language, emotional tone, likely influenced behavior |
| 5 | Passionate, extreme language, all-caps, multiple exclamations, drove a specific action (churn, referral, return) |

### Common Theme Categories

Pricing, onboarding, performance/speed, reliability/uptime, customer support, documentation, feature gaps, UI/UX, billing, integrations, mobile experience, value for money

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
