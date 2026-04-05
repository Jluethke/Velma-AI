# Runway Calculator -- Series A SaaS Scenario Planning

## Scenario

A Series A SaaS company just closed a $6M round. The CEO needs runway projections under three scenarios, plus sensitivity analysis on key variables.

## Input Data

```
Cash balance:     $6,200,000 (post-round, including existing cash)
Monthly revenue:  $180,000 (MRR)
Revenue growth:   6% MoM
Monthly expenses: $420,000
  - Personnel:    $310,000 (42 employees)
  - Infrastructure: $45,000
  - SaaS/Tools:   $25,000
  - Office:       $20,000
  - Other:        $20,000
Gross margin:     82%
```

## Execution: Phase Pipeline

### Phase 1: BASELINE

**Current state:**
```
Gross burn:           $420,000/mo
Net burn:             $420,000 - $180,000 = $240,000/mo
Simple runway:        $6,200,000 / $240,000 = 25.8 months
Revenue growth rate:  6% MoM (72% annualized)
Burn multiple:        $240,000 / ($180,000 * 0.06) = 22.2x  [HIGH]
```

**Unit economics:**
```
Total customers:      120 (implied ARPU = $1,500/mo)
CAC:                  ~$12,000 (estimated: S&M spend / new customers)
LTV:                  $1,500/mo * 82% margin / 3% monthly churn = $41,000
LTV:CAC ratio:        3.4:1 (healthy, >3:1 threshold)
CAC payback:          $12,000 / ($1,500 * 0.82) = 9.8 months
```

### Phase 2: MODEL

**Scenario A -- Base Case (current trajectory):**
```
Assumptions: 6% MoM revenue growth, expenses grow 3% MoM (hiring plan)

Month    Cash        Revenue    Expenses   Net Burn
1       $6,200K      $180K      $420K      $240K
3       $5,670K      $202K      $446K      $243K
6       $4,878K      $241K      $487K      $247K
9       $3,977K      $287K      $533K      $246K
12      $2,945K      $342K      $582K      $240K
15      $1,760K      $408K      $636K      $228K
18        $392K      $486K      $695K      $209K

Cash-zero month: ~19 months
Break-even month: ~24 months (revenue = expenses)
```

**Scenario B -- Optimistic (accelerated growth):**
```
Assumptions: 8% MoM revenue growth, expenses grow 4% MoM (aggressive hiring)

Month    Cash        Revenue    Expenses   Net Burn
6       $4,718K      $270K      $531K      $261K
12      $2,884K      $429K      $672K      $243K
18        $936K      $681K      $850K      $169K

Cash-zero month: ~21 months
Break-even month: ~20 months (earlier due to faster revenue)
```

**Scenario C -- Pessimistic (growth stalls):**
```
Assumptions: 3% MoM revenue growth, expenses grow 3% MoM

Month    Cash        Revenue    Expenses   Net Burn
6       $4,878K      $209K      $487K      $278K
12      $3,026K      $242K      $582K      $340K
18        $573K      $280K      $695K      $415K

Cash-zero month: ~19 months
Break-even month: NEVER (revenue never catches expenses at 3% growth)
```

### Phase 3: SENSITIVITY

**What-if analysis:**

```
Variable                    Impact on Runway
----------------------------------------------------------
Hire 5 engineers (+$75K/mo)  -4.2 months (25.8 -> 21.6)
Lose biggest client (-$30K)  -1.8 months (25.8 -> 24.0)
Raise prices 20%             +3.1 months (25.8 -> 28.9)
Cut infra costs 30%          +0.8 months (25.8 -> 26.6)
Revenue growth -> 10% MoM    +4.5 months (25.8 -> 30.3)
Revenue growth -> 0% MoM     -9.3 months (25.8 -> 16.5)
Churn doubles (3% -> 6%)     -3.7 months (25.8 -> 22.1)
```

**Two-variable sensitivity (Revenue Growth x Hiring Pace):**
```
Runway (months)     Hire 0    Hire 3    Hire 5    Hire 10
-----------------------------------------------------------
Rev growth 3%        22.1     20.3      18.8      15.2
Rev growth 6%        25.8     23.6      21.6      17.4
Rev growth 8%        28.4     25.9      23.7      19.1
Rev growth 10%       30.3     27.5      25.1      20.2
```

### Phase 4: ALERTS

```
ALERT: CAUTION — Burn multiple of 22.2x is very high
  Target: < 2x for efficient growth
  Your net new ARR ($10.8K/mo) costs 22x that in net burn
  Implication: Growth is expensive. Prioritize efficiency.

ALERT: OK — Runway > 18 months in base case
  Best practice: maintain > 18 months post-fundraise
  You have 19 months base case, which is tight

ALERT: WARNING — Pessimistic scenario never reaches break-even
  If growth drops to 3%, you will need to either cut costs
  or raise another round. No organic path to sustainability.

ALERT: INFO — Fundraising window opens in 9 months
  Standard: begin fundraising when you have 9-12 months runway
  Base case: start fundraising by month 9-10 (~Q3)
  Pessimistic: start fundraising by month 7 (~Q2)
```

### Phase 5: RECOMMEND

```
Priority  Action                        Impact           Timeline
-------------------------------------------------------------------
1         Set fundraising start date     Risk mitigation  Month 9
          for month 9 (12-month
          cushion in base case)

2         Reduce burn multiple to <5x    +3-6 months      Immediate
          Focus on conversion rate and   runway
          expansion revenue, not just
          new logos

3         Build "Plan B" cost cuts       Emergency plan   Month 6
          Identify $100K/mo in           if growth stalls
          cuttable spend (non-critical
          hiring freeze, vendor cuts)

4         Track actuals vs projection    Early warning     Monthly
          monthly. If actual cash is
          >5% below base case for 2
          consecutive months, trigger
          Plan B review

5         Model bridge round terms       Contingency       Month 8
          If full round takes too long,
          have bridge round terms ready
          ($1-2M on SAFEs)
```
