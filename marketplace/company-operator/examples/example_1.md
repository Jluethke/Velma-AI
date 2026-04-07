# Example: Weekly Briefing for a 20-Person B2B SaaS Company

## Input
```
company_metrics: { "MRR": 82000, "MRR_growth_MoM": 0.08, "ARR": 984000, "gross_margin": 0.82, "NRR": 1.05 }
pipeline_data: { "total_pipeline": 320000, "deals": 45, "avg_deal_size": 7100, "win_rate": 0.22, "avg_cycle_days": 52, "pipeline_added_this_month": 180000 }
team_status: { "headcount": 20, "open_roles": 3, "recent_departures": ["Senior Engineer (2 weeks ago)"], "morale": "mixed -- engineering stressed, sales energized" }
product_metrics: { "uptime": 99.8, "bug_backlog": 34, "critical_bugs": 3, "release_this_month": 2, "DAU_MAU_ratio": 0.35 }
customer_feedback: { "NPS": 38, "NPS_previous": 42, "churn_this_month": 4, "churn_reasons": ["Price too high (2)", "Missing integration with Salesforce (1)", "Switched to competitor X (1)"], "top_feature_requests": ["Salesforce integration", "API improvements", "Mobile app"] }
financial_data: { "cash_balance": 1400000, "monthly_burn": 95000, "revenue_vs_budget": -0.05 }
```

## OBSERVE Output

**Company Snapshot:**
| Function | RAG | Key Metric | Notes |
|---|---|---|---|
| Revenue | AMBER | MRR $82K, +8% MoM | Growth slowing (was 12% two months ago). 5% below budget. |
| Customers | AMBER | 4 churns, NPS 38 (was 42) | NPS declining. 2 churns cite price. 1 lost to competitor. |
| Pipeline | GREEN | $320K pipeline, 3.9x coverage | Healthy pipeline. Win rate (22%) could improve. |
| Cash | GREEN | $1.4M, 14.7 months runway | Comfortable but not infinite. Burning $95K/mo. |
| Team | AMBER | Senior engineer departed, 3 open roles | Engineering capacity reduced. Morale split. |
| Product | AMBER | 3 critical bugs, DAU/MAU 0.35 | Critical bugs need attention. Engagement below target (0.40). |

**Derived metrics:**
- Burn multiple: $95K burn / ($82K - $75.4K prev) x 12 = $95K / $79.2K net new ARR = **1.20x** (GOOD)
- Quick ratio: need expansion/contraction data, estimated at **2.8** (AMBER)
- Rule of 40: 8% growth + (-15.8% profit margin) = **-7.8** (RED -- growth not covering burn)
- Months to default alive: at current growth trajectory (~8% MoM), revenue exceeds burn in **~10 months**

## REASON Output

**Triage:**

1. **CHURN IS THE TOP PRIORITY (Revenue-threatening).**
   - 4 churns is elevated. At $82K MRR with ~100 customers, that's 4% logo churn this month.
   - Root cause hypothesis: 2 price-related + 1 competitor + 1 missing feature = mixed causes. But "price too high" often masks "insufficient value for the price."
   - NPS decline (42 -> 38) is a leading indicator of more churn coming.
   - **If churn stays at 4%/month, it will eat all growth.** This is the most urgent issue.

2. **ENGINEERING CAPACITY (Growth-limiting).**
   - Senior engineer left. 3 open roles. 3 critical bugs unresolved. Engineering morale is stressed.
   - Root cause hypothesis: overloaded team (too many initiatives vs. headcount), tech debt accumulating, senior departure creates knowledge gap.
   - **Impact:** Feature velocity is slowing, critical bugs aren't getting fixed, and the #1 feature request (Salesforce integration) isn't being built. This feeds into churn (customer lost due to missing Salesforce integration).

3. **GROWTH DECELERATION (Growth-limiting).**
   - MRR growth slowing: 12% -> 10% -> 8% over three months.
   - Root cause hypothesis: market is getting more competitive (customer lost to competitor X). Win rate at 22% is acceptable but has room for improvement.
   - Not urgent this week but needs strategic attention.

**Delegation:**
- Churn analysis -> kpi-anomaly-detector (deep dive into the 4 churned customers: usage patterns before churn, support history, segment analysis)
- Competitive loss -> competitor-teardown (analyze competitor X: pricing, features, positioning)

## PLAN Output

### Executive Briefing

**Headline:** Company is growing but decelerating. Churn is elevated at 4% this month and is the primary risk to reaching $1M ARR.

**Scorecard:**
| Function | Status | One-Line |
|---|---|---|
| Revenue | AMBER | $82K MRR, +8% MoM but slowing. 5% below budget. |
| Customers | AMBER | 4 churns this month, NPS dropping. Price and competition cited. |
| Pipeline | GREEN | $320K, 3.9x coverage. Pipeline is healthy. |
| Cash | GREEN | 14.7 months runway. Comfortable. |
| Team | AMBER | Down one senior engineer. 3 roles open. Engineering stressed. |
| Product | AMBER | 3 critical bugs. Salesforce integration is top customer request. |

### Top 3 Priorities This Week

**Priority 1: Stop the churn bleeding.**
- Owner: Head of Customer Success
- Action: Call every customer with NPS <30 this week (estimate: 10-15 calls). Identify at-risk accounts. For the 2 "price too high" churns: were they offered a retention discount? If not, policy gap.
- Deadline: End of week
- Success metric: Identify 5+ at-risk accounts with intervention plans
- Delegation: kpi-anomaly-detector to analyze churned customer usage patterns

**Priority 2: Fix the 3 critical bugs.**
- Owner: Engineering Lead
- Action: All engineering effort this week on critical bug resolution. Defer feature work. These bugs affect reliability which affects NPS which affects churn.
- Deadline: 2 of 3 critical bugs resolved by Friday
- Success metric: Critical bug count drops from 3 to 1

**Priority 3: Accelerate senior engineer hiring.**
- Owner: Hiring Manager / CEO
- Action: Review all current candidates in pipeline. If pipeline is empty, post on 3 additional channels this week. Consider: can we contract a senior engineer while permanent hire is in process?
- Deadline: At least 2 senior candidates in active interview process by end of next week
- Success metric: Time-to-fill estimated and tracked

### KPI Dashboard

| KPI | Current | Previous | Target | Trend | RAG |
|---|---|---|---|---|---|
| MRR | $82,000 | $75,926 | $86,000 | UP (+8%) | AMBER |
| Logo churn | 4% | 2% | <2% | UP | RED |
| Revenue churn | 3.1% | 1.8% | <1% | UP | RED |
| NPS | 38 | 42 | 50 | DOWN | AMBER |
| Pipeline coverage | 3.9x | 3.5x | >3x | UP | GREEN |
| Win rate | 22% | 24% | 25% | DOWN | AMBER |
| Runway | 14.7 mo | 15.2 mo | >18 | DOWN | GREEN |
| Critical bugs | 3 | 1 | 0 | UP | RED |
| DAU/MAU | 0.35 | 0.38 | 0.40 | DOWN | AMBER |
| Headcount vs plan | 20/23 | 21/23 | 23 | DOWN | AMBER |

### Risk Flags

1. **Churn trajectory risk (SEVERITY: HIGH):** If 4%/month churn continues for 3 months, MRR growth drops to ~4% (churn eats half of new revenue). Monitor: next month's churn closely. Response threshold: if next month >3%, escalate to full retention overhaul.

2. **Competitive pressure (SEVERITY: MEDIUM):** Lost one customer to competitor X this month. Unknown: how many prospects are we losing to them? Monitor: ask every lost deal if competitor X was in consideration. Route to competitor-teardown for analysis.

3. **Engineering burnout (SEVERITY: MEDIUM):** Senior departure + 3 critical bugs + stressed morale = attrition risk for remaining engineers. If another engineer leaves, product velocity will collapse. Monitor: schedule skip-level 1:1s this month.

### Wins
- Pipeline is strong at 3.9x coverage -- sales team is performing well on top-of-funnel.
- Gross margin improved to 82% (up from 79% after infrastructure optimization).
- Two product releases shipped despite being down one engineer -- team is resilient.

## ACT: Follow-Up from Last Week

| Last Week's Action | Owner | Status | Result |
|---|---|---|---|
| Launch email campaign to dormant trial users | Marketing | COMPLETED | 12% reactivation rate, 3 converted to paid |
| Interview 2 senior engineer candidates | Hiring | PARTIAL | 1 interviewed, 1 rescheduled. Pipeline thin. |
| Resolve critical billing bug | Engineering | COMPLETED | Fixed. No new billing complaints. |
