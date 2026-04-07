# B2B Lead Finder -- DevOps SaaS Targeting Mid-Market

## Scenario

A DevOps platform company wants to find 10 qualified leads matching their ICP: mid-market companies (200-2000 employees) running Kubernetes in production, with engineering teams of 50+, headquartered in North America.

## OBSERVE: Read ICP and Context

**ICP Definition Parsed:**
```
Industry:       Technology, Financial Services, E-commerce
Employee Range: 200-2000
Tech Stack:     Kubernetes (required), Docker, CI/CD pipelines
Team Size:      Engineering 50+ headcount
Geography:      North America
Budget Signal:  Series B+ funding or $20M+ ARR
Pain Points:    Deployment frequency < daily, incident response > 30min
Exclusions:     Acme Corp (existing customer), BigTech Inc (contacted Q1)
```

**Context Gathered:**
- 47 leads previously contacted (loaded from state)
- Last ICP refinement: added "CI/CD pipelines" as secondary signal
- Conversion rate on last batch: 4.2% (above 3% baseline)

## REASON: Score Potential Leads

**Scoring Framework Applied (0-100):**

| Lead | Industry (25) | Size (20) | Tech (25) | Team (15) | Budget (15) | Total | Notes |
|---|---|---|---|---|---|---|---|
| CloudNova Inc | 25 (SaaS) | 20 (800 emp) | 25 (K8s + Docker) | 15 (120 eng) | 15 (Series C) | 100 | Perfect fit |
| DataStream Co | 25 (Fintech) | 15 (180 emp) | 25 (K8s prod) | 10 (40 eng) | 15 ($45M ARR) | 90 | Slightly under size |
| RetailEdge | 20 (E-comm) | 20 (500 emp) | 20 (K8s staging) | 15 (65 eng) | 10 (Series A) | 85 | K8s not yet prod |
| FinServe Ltd | 25 (Fintech) | 20 (1200 emp) | 15 (Docker only) | 15 (90 eng) | 15 (Public) | 90 | No K8s yet -- expansion opp |
| MedStack | 15 (Healthcare) | 20 (600 emp) | 25 (K8s + Helm) | 15 (70 eng) | 10 (Series B) | 85 | Adjacent industry |

**Duplicate Check:** Cross-referenced against 47 previous leads. 0 duplicates found.

**Disqualification Check:** No leads on exclusion list. FinServe Ltd flagged for possible competitor relationship -- needs verification.

## PLAN: Rank and Prioritize

**Priority Ranking:**
1. **CloudNova Inc (100)** -- Perfect ICP match. Approach via VP Engineering (LinkedIn shows active K8s community participation).
2. **DataStream Co (90)** -- Strong fit despite size. High-growth trajectory suggests they'll cross 200 threshold within 6 months.
3. **FinServe Ltd (90)** -- No K8s yet = greenfield opportunity. Approach as "start right" rather than "migrate."
4. **RetailEdge (85)** -- K8s in staging = buying signal. They're evaluating tooling now.
5. **MedStack (85)** -- Adjacent industry but strong tech fit. Compliance angle may differentiate.

**Outreach Approach per Lead:**
- CloudNova: Community-based (reference shared K8s meetup attendance)
- DataStream: Pain-point (deployment frequency data from their blog)
- FinServe: Educational (K8s adoption whitepaper)
- RetailEdge: Timing-based (they're in evaluation -- offer POC)
- MedStack: Compliance-angle (HIPAA + K8s security positioning)

## ACT: Output

**Validated Lead List:** 5 leads scored 85+, 0 duplicates, 1 flagged for verification.

**ICP Refinement Suggestions:**
1. Consider adding "K8s in staging/evaluation" as a qualifying signal -- these are active buyers
2. Healthcare showing up as viable adjacent industry -- test with 5-lead cohort
3. Companies slightly below 200 employees but on high-growth trajectory (Series B+) convert at similar rates -- consider lowering floor to 150

**State Updated:** 5 new leads added to contacted history. ICP version incremented to 3.2.
