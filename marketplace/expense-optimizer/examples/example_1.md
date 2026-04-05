# Expense Optimizer -- Series B SaaS Company

## Scenario

A 120-person Series B SaaS company ($8M ARR, $650K/mo burn) needs to extend runway. The CFO wants a systematic expense review with prioritized savings opportunities.

## Execution: Phase Pipeline

### Phase 1: CATEGORIZE

**Expense breakdown (monthly):**

```
Category              Monthly     % of Revenue   Items
------------------------------------------------------------
Personnel             $520K        78.0%         Salaries, benefits, contractors
  - Engineering        $280K        42.0%         45 engineers + 8 contractors
  - Sales              $120K        18.0%         15 AEs + 5 SDRs + 2 managers
  - G&A                 $70K        10.5%         Exec, finance, HR, legal, ops
  - Marketing           $50K         7.5%         5 marketers + agencies

SaaS & Tools           $45K         6.7%          38 subscriptions
  - Dev tools           $18K                      GitHub, Datadog, PagerDuty, etc.
  - Sales tools         $12K                      Salesforce, Outreach, ZoomInfo
  - Productivity         $8K                      Slack, Notion, Zoom, Google
  - Marketing            $5K                      HubSpot, Webflow, analytics
  - Other                $2K                      Misc point solutions

Infrastructure         $55K         8.2%          AWS, GCP, Cloudflare
  - Compute             $30K                      EC2/ECS instances
  - Storage             $12K                      S3, RDS, ElastiCache
  - Data/ML              $8K                      Sagemaker, data pipeline
  - Network/CDN          $5K                      CloudFront, bandwidth

Office & Facilities    $25K         3.7%          Lease, utilities, supplies
Travel & Events        $12K         1.8%          Sales travel, conferences
Other                  $10K         1.5%          Insurance, legal, misc

TOTAL                 $667K        100%
Revenue               $667K (=$8M/12)
Net burn              $650K - $667K = -$17K/mo (revenue growth offsetting)
```

### Phase 2: BENCHMARK

**Industry comparison (Series B SaaS, 100-150 employees):**

```
Category        This Company    Benchmark (Median)    Status
------------------------------------------------------------
Personnel/Rev      78.0%           70-75%             ABOVE -- overstaffed or underpaid
  Engineering      42.0%           35-40%             ABOVE -- high eng ratio
  Sales            18.0%           18-22%             ON TARGET
  G&A              10.5%            8-12%             ON TARGET
  Marketing         7.5%           10-15%             BELOW -- underinvesting?

SaaS/Rev            6.7%            5-8%              ON TARGET
Infra/Rev           8.2%            5-7%              ABOVE -- cloud costs high
Office/Rev          3.7%            2-4%              ON TARGET
Travel/Rev          1.8%            1-3%              ON TARGET
```

**Key findings:**
- Engineering headcount at 42% of revenue is above benchmark
- Infrastructure costs at 8.2% of revenue suggest scaling inefficiency
- Marketing spend is low -- potential underinvestment risk

### Phase 3: IDENTIFY

**Savings opportunities found:**

```
#  Opportunity                    Annual Savings  Effort    Confidence
---------------------------------------------------------------------
1  Right-size AWS instances        $72K           Medium    High
   - 12 instances running large,
     actual CPU utilization <20%

2  Consolidate overlapping SaaS    $36K           Low       High
   - 3 project management tools
     (Jira + Asana + Linear)
   - 2 communication tools
     (Slack already covers Teams)

3  Eliminate unused SaaS licenses  $28K           Low       High
   - 47 Salesforce licenses,
     31 active users
   - 120 Notion seats, 85 active

4  Convert contractors to FTEs     $96K           High      Medium
   - 3 long-term contractors at
     2x FTE equivalent cost

5  Reserved instances (AWS)        $48K           Low       Medium
   - 60% of compute is on-demand
     but usage is predictable

6  Renegotiate SaaS contracts      $24K           Medium    Medium
   - 4 contracts up for renewal
     in next 90 days, negotiate
     annual vs monthly pricing

TOTAL IDENTIFIED:                 $304K/year
```

### Phase 4: RECOMMEND

**Prioritized by Impact x Effort:**

```
Priority  Action                     Savings   Effort   Timeline   Owner
------------------------------------------------------------------------
1 (DO NOW) Eliminate unused licenses  $28K/yr   2 days   Week 1    IT Ops
2 (DO NOW) Consolidate SaaS overlap   $36K/yr   1 week   Week 1-2  IT Ops
3 (QUICK)  Reserved instances          $48K/yr   3 days   Week 2    DevOps
4 (PLAN)   Right-size AWS instances    $72K/yr   2 weeks  Month 1   DevOps
5 (PLAN)   Renegotiate contracts       $24K/yr   2 weeks  Month 1-2 Finance
6 (LATER)  Contractor conversion       $96K/yr   1 month  Quarter   HR

Quick wins (Priority 1-3): $112K/yr, achievable in 2 weeks
Medium-term (Priority 4-5): $96K/yr, achievable in 2 months
Longer-term (Priority 6): $96K/yr, achievable in 1 quarter
```

### Phase 5: TRACK

**Savings realization tracker (set up for monthly review):**

```
Month    Target Savings   Actual Savings   Variance   Notes
-------------------------------------------------------------
Month 1   $9.3K/mo         --              --         Licenses + consolidation
Month 2  $14.0K/mo         --              --         + reserved instances
Month 3  $18.7K/mo         --              --         + right-sizing
Month 6  $25.3K/mo         --              --         + contractor conversion

Tracking method:
- Compare actual monthly spend per category to pre-optimization baseline
- Flag if any category increases >5% without approved reason (cost drift)
- Quarterly re-benchmark against industry to identify new opportunities
```

**Net impact:** $304K annual savings extends runway by approximately 5.5 months at current burn rate.
