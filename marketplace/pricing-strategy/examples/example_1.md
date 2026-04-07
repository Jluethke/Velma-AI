# Pricing Strategy -- B2B SaaS Analytics Platform

## Scenario

A data analytics startup is launching their platform. Current pricing: flat $99/month. They have 200 customers, 15% monthly churn on the $99 plan, and their COGS is $22/user/month. Competitors range from $49-$299/month. They want to introduce tiered pricing to improve retention and revenue.

## OBSERVE: Gather Data

**Cost Structure:**
```
Variable cost per user:     $22/month (infrastructure + support)
Customer acquisition cost:  $340 (blended across channels)
Current price:              $99/month
Gross margin:               77.8% ($99 - $22 = $77)
Payback period:             4.4 months ($340 / $77)
Current churn:              15%/month → average lifetime: 6.7 months
LTV:                        $77 × 6.7 = $516
LTV:CAC ratio:              1.52:1 (unhealthy — below 3:1 threshold)
```

**Competitor Landscape:**
| Competitor | Starter | Mid | Enterprise | Key Differentiator |
|---|---|---|---|---|
| DataView | $49/mo | $149/mo | $399/mo | Real-time dashboards |
| InsightPro | $79/mo | $199/mo | Custom | AI-powered insights |
| MetricFlow | Free | $99/mo | $249/mo | Developer-friendly |
| ChartStack | $29/mo | $89/mo | $189/mo | Simplicity |

**Customer Segments (from usage data):**
- **Explorers (40%):** Use 2-3 features, <10 queries/day, low engagement. Churning at 22%.
- **Power Users (35%):** Use 6-8 features, 20-50 queries/day, moderate engagement. Churning at 10%.
- **Teams (25%):** 3+ seats, use integrations and sharing, high engagement. Churning at 5%.

## REASON: Analyze Pricing Models

**Key Insight:** The flat $99 price is too high for Explorers (they churn because they don't use enough to justify it) and too low for Teams (they'd pay more for the value they extract). One-size-fits-all is leaving money on the table and driving churn simultaneously.

**Model Analysis:**

| Model | Pros | Cons | Fit |
|---|---|---|---|
| Cost-Plus ($22 × 3.5 = $77) | Simple, guaranteed margin | Ignores value, may underprice | LOW -- doesn't address segmentation |
| Value-Based | Captures willingness to pay per segment | Requires segment understanding | HIGH -- matches our 3-segment reality |
| Competitive ($49-$149) | Market-validated range | Race to bottom risk | MEDIUM -- good for positioning reference |
| Freemium ($0 + paid) | Volume acquisition | Low conversion rates (2-5%) | MEDIUM -- depends on viral coefficient |
| Tiered (3 plans) | Segment-specific pricing, upsell path | Complexity, requires feature gating | HIGH -- directly addresses the problem |

**Recommendation:** Tiered pricing with value-based anchoring. Three plans aligned to the three customer segments.

## PLAN: Design Pricing Structure

**Proposed Pricing Table:**

| | Starter | Professional | Team |
|---|---|---|---|
| **Target Segment** | Explorers | Power Users | Teams |
| **Monthly Price** | $49/mo | $129/mo | $249/mo |
| **Annual Price** | $39/mo (billed annually) | $99/mo (billed annually) | $199/mo (billed annually) |
| **Seats** | 1 | 1-3 | 5-25 |
| **Queries/day** | 20 | 100 | Unlimited |
| **Features** | Core dashboards, 3 data sources | All dashboards, 10 sources, AI insights | Everything + API, SSO, shared workspaces |
| **Support** | Email (48h) | Email (24h) + chat | Priority + dedicated CSM |
| **COGS** | $15 | $22 | $35 |
| **Gross Margin** | 69.4% | 82.9% | 85.9% |

**Why These Prices:**
- **$49 Starter:** Undercuts cheapest competitor tier ($49 matches ChartStack), captures Explorer segment that's currently churning at $99. Predicting churn drops from 22% to 10%.
- **$129 Professional:** Price-anchored between competitor mid-tiers ($99-$199). The 30% increase from current $99 is justified by AI insights feature gate. Power Users already value the product -- they'll upgrade or stay.
- **$249 Team:** Below competitor enterprise tiers ($249-$399) but includes per-seat economics that scale. Teams segment has 5% churn and high willingness to pay.

**Sensitivity Analysis:**

| Scenario | Starter Conv. | Pro Conv. | Team Conv. | Monthly Revenue | vs. Current |
|---|---|---|---|---|---|
| Conservative | 60% of Explorers | 70% of Power | 80% of Teams | $18,190 | -8% |
| Expected | 75% of Explorers | 80% of Power | 90% of Teams | $22,035 | +11% |
| Optimistic | 85% of Explorers | 90% of Power | 95% of Teams | $25,255 | +28% |
| Current (flat $99) | 100% at $99 | — | — | $19,800 | baseline |

**Break-even analysis:** The tiered model breaks even (matches current revenue) when Starter retains 65% of Explorers, Pro retains 72% of Power Users, and Teams retains 82% of Teams. All conservative estimates exceed these thresholds.

## ACT: Implementation Plan

**Phase 1 (Week 1-2): Announce**
- Grandfather existing customers at current $99 for 6 months
- New customers see tiered pricing immediately
- Internal training: sales team briefed on positioning per tier

**Phase 2 (Month 1-3): Migrate**
- At 3-month mark: notify grandfathered customers of migration
- Offer annual lock-in at $99/mo Professional plan (creates urgency)
- Monitor: churn rate per segment, upgrade/downgrade ratios, new customer tier distribution

**Phase 3 (Month 3-6): Optimize**
- Analyze tier distribution: if >60% on Starter, the gap to Pro is too large
- A/B test: add a "Most Popular" badge to Professional tier
- Consider: usage-based add-ons for customers who exceed tier limits

**Key Metrics to Track:**
- Revenue per customer (target: $99 → $110+ blended)
- Churn rate per tier (target: Starter <12%, Pro <8%, Team <4%)
- LTV:CAC ratio (target: 1.52 → 2.5+ within 6 months)
- Upgrade rate from Starter to Pro (target: 8%/quarter)
