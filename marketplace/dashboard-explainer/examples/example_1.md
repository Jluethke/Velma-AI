# Dashboard Explainer -- Weekly Executive Summary

## Scenario

A product-led SaaS company has a weekly executive dashboard with 8 metrics. The COO wants a plain-English narrative for the Monday all-hands, not just numbers.

## Dashboard Data

```
Metric                 This Week    Last Week    WoW Change    Target
-------------------------------------------------------------------
Weekly Active Users     34,200       31,800       +7.5%        33,000
New Signups              2,140        1,780       +20.2%        2,000
Activation Rate           38%          42%        -4 pts         45%
7-Day Retention           61%          63%        -2 pts         65%
MRR                    $485K        $472K        +2.8%        $500K
Avg Revenue/User        $14.18       $14.85       -4.5%       $15.00
Support Tickets           312          287        +8.7%          <250
NPS                        42           44         -2 pts         50
```

## Execution: ORPA Loop

### OBSERVE

**Data ingestion:**
- 8 metrics with current, prior period, change, and target values
- Comparison period: week-over-week
- Audience: executive team (non-technical, care about business impact)

**What moved:**
- Big movers (>10% change): New Signups (+20.2%)
- Notable moves (>5%): WAU (+7.5%), Support Tickets (+8.7%)
- Direction changes: Activation Rate and Retention both declining
- Below target: Activation (38% vs 45%), Retention (61% vs 65%), ARPU ($14.18 vs $15), Support (312 vs <250), NPS (42 vs 50)
- Above target: WAU (34,200 vs 33,000), Signups (2,140 vs 2,000)

### REASON

**Insight extraction:**

1. **Growth vs Quality Tension (HIGH IMPACT):**
   Signups surged +20% and WAU is up +7.5%, both beating targets. But activation dropped 4 points and retention dropped 2 points. This pattern suggests the new signups are lower quality -- likely from a broader channel (paid ads? viral loop?) that brings less-qualified users.

2. **Revenue Dilution (HIGH IMPACT):**
   MRR grew +2.8%, but ARPU dropped -4.5%. Revenue is growing slower than users, meaning new users monetize worse than existing ones. If this continues, revenue growth will decelerate even as user growth accelerates.

3. **Support Load Warning (MEDIUM IMPACT):**
   Tickets up 8.7% to 312 (target <250). Combined with lower activation, this suggests new users are struggling with onboarding. The activation drop and support spike are likely the same root cause.

4. **NPS Erosion (MEDIUM IMPACT):**
   NPS dropped 2 points to 42 (target 50). Small week-over-week but part of a 3-week declining trend (was 47 three weeks ago). Customer satisfaction is slowly eroding.

**Causal chain identified:**
Signup surge (likely new channel) -> lower-quality users -> activation drops -> support tickets rise -> NPS drops -> ARPU dilution

### PLAN

**Prioritize by business impact:**

1. **Lead insight:** Growth is strong but quality is declining -- this is the story that matters most
2. **Supporting insight:** Revenue dilution -- connects growth to financial impact
3. **Operational insight:** Support overload -- actionable, fixable
4. **Watch item:** NPS trend -- not yet critical but trajectory is concerning

### ACT

**Narrative Report:**

---

**Weekly Pulse: Growth Accelerating, Quality Needs Attention**

The top line looks strong this week. Signups jumped 20% to 2,140, beating our 2,000 target, and weekly active users grew 7.5% to 34,200. MRR is up 2.8% to $485K, closing the gap to our $500K target.

But the quality signals are flashing yellow. Activation rate dropped 4 points to 38% -- well below our 45% target -- meaning more users are signing up but fewer are reaching their "aha moment." Retention dipped 2 points to 61%. Together, this suggests the new signups are coming from a less-qualified channel or campaign.

The financial impact is already visible: average revenue per user fell 4.5% to $14.18. We're adding users faster than we're adding revenue, which dilutes unit economics. If this ratio holds, hitting $500K MRR will require 15% more users than originally planned.

On the operations side, support tickets jumped 8.7% to 312 (target: <250). This is likely connected to the activation drop -- new users who can't self-serve file tickets instead. Improving the onboarding flow could address both metrics simultaneously.

**Recommended actions:**
- **This week:** Identify which signup channel drove the +20% surge. Compare activation rates by channel to isolate the quality gap.
- **This week:** Review the top 5 support ticket categories from new users. If onboarding-related, prioritize onboarding flow improvements.
- **Watch:** NPS has declined 5 points over 3 weeks (47 -> 42). If it drops below 40, escalate to a dedicated investigation.

---
