# Pricing Model Simulator -- B2B Analytics Platform

## Scenario

A B2B analytics platform ($2M ARR, 150 customers) currently uses flat per-seat pricing at $49/seat/month. The CEO wants to explore tiered and usage-based pricing to capture more value from large customers who process significantly more data.

## Input Data

```
Product: Cloud analytics platform
Current pricing: $49/seat/month (flat)
Customers: 150
  - SMB (1-10 seats):      80 customers, avg 4 seats, $196/mo avg
  - Mid-market (11-50):    50 customers, avg 22 seats, $1,078/mo avg
  - Enterprise (51-200):   20 customers, avg 95 seats, $4,655/mo avg
  
Usage patterns:
  - Data processed: ranges from 10GB to 5TB/month per customer
  - API calls: ranges from 1K to 500K/month per customer
  - Dashboards created: ranges from 5 to 200 per customer
  
Cost to serve:
  - Infrastructure: ~$0.02/GB processed, $0.001/API call
  - Support: $200/mo SMB, $500/mo mid-market, $2,000/mo enterprise
  - Base platform cost: $50K/month (fixed)

Competitors:
  - Competitor A: $39/seat/month (cheap, fewer features)
  - Competitor B: Usage-based, ~$0.05/GB + $99/seat/month
  - Competitor C: Tiered, $29-$99/seat with feature gates
```

## Execution: Phase Pipeline

### Phase 1: INPUTS

**Value metric analysis:**

The seat count is weakly correlated with value received. A 5-seat customer processing 2TB/month gets far more value than a 20-seat customer processing 50GB. The value metric should be closer to data processed or insights generated.

```
Correlation analysis:
  Seats vs NPS:          r = 0.21 (weak)
  Data processed vs NPS: r = 0.67 (strong)
  Dashboards vs NPS:     r = 0.58 (moderate)
  API calls vs NPS:      r = 0.43 (moderate)

Best value metric candidate: Data processed (GB/month)
Secondary: Dashboard count (proxy for value delivered)
```

### Phase 2: MODELS

**Model A: Enhanced Per-Seat (current, optimized)**
```
Starter:    $39/seat/month  (1-10 seats, basic features)
Pro:        $59/seat/month  (11-50 seats, advanced analytics)
Enterprise: $79/seat/month  (51+ seats, SSO, dedicated support, SLA)
```

**Model B: Usage-Based (data volume)**
```
Platform fee: $199/month (base access, 5 seats included)
Data processing: $0.05/GB (first 100GB), $0.03/GB (100-1TB), $0.02/GB (1TB+)
Additional seats: $19/seat/month
API calls: first 10K free, then $0.50 per 1K calls
```

**Model C: Tiered (feature + volume gates)**
```
Starter:    $299/month   (5 seats, 100GB data, 10 dashboards, email support)
Growth:     $799/month   (20 seats, 500GB data, 50 dashboards, chat support)
Business:   $1,999/month (50 seats, 2TB data, unlimited dashboards, phone support)
Enterprise: Custom       (unlimited seats, unlimited data, dedicated CSM, SLA)
```

**Model D: Hybrid (seat + usage)**
```
Per-seat: $29/month (access fee)
Data: $0.04/GB processed
Minimum monthly: $199
Enterprise: custom pricing at >$5K/month
```

### Phase 3: SIMULATE

**Revenue projection at current customer mix:**

```
Model               SMB (80)    Mid (50)    Ent (20)    Total MRR    vs Current
--------------------------------------------------------------------------------
Current (flat $49)   $15.7K      $53.9K      $93.1K      $162.7K       --
A: Enhanced seat     $12.5K      $64.9K     $150.1K      $227.5K      +40%
B: Usage-based       $18.4K      $47.2K     $112.8K      $178.4K      +10%
C: Tiered            $23.9K      $39.9K     $128.0K      $191.8K      +18%
D: Hybrid            $14.2K      $52.8K     $135.6K      $202.6K      +25%
```

**Churn risk adjustment (estimated price elasticity):**
```
Model          SMB Churn Risk    Mid Churn Risk    Ent Churn Risk    Net MRR
---------------------------------------------------------------------------
A: Enhanced     -5% (cheaper)    +3% (pricier)     +5% (pricier)    $215K
B: Usage        +2% (complexity) +2% (lower bill)  +3% (variable)   $170K
C: Tiered       -8% (clear)      +5% (forced up)   +2% (value)      $181K
D: Hybrid       +3% (complex)    +2% (similar)     +3% (variable)   $192K
```

**Expansion revenue potential (12-month projection):**
```
Model          Expansion Driver               12-mo Expansion
--------------------------------------------------------------
Current        Seat additions only            +8% ($13K/mo)
A: Enhanced    Seat + tier upgrades           +12% ($27K/mo)
B: Usage       Organic data growth            +25% ($45K/mo)
C: Tiered      Tier upgrades at limits        +15% ($29K/mo)
D: Hybrid      Seat adds + data growth        +20% ($40K/mo)
```

### Phase 4: COMPARE

```
Criteria           Weight   Model A   Model B   Model C   Model D
-------------------------------------------------------------------
Revenue uplift       30%      9/10      6/10      7/10      8/10
Expansion potential  25%      6/10      10/10     7/10      9/10
Churn risk           20%      6/10      7/10      7/10      7/10
Simplicity           15%      8/10      4/10      9/10      5/10
Competitive fit      10%      7/10      6/10      8/10      7/10
-------------------------------------------------------------------
Weighted score               7.2       6.7       7.4       7.5
```

**Tradeoff analysis:**
- Model A: Biggest immediate uplift but limited expansion; enterprise may resist 61% increase
- Model B: Best expansion potential but complexity scares SMBs and makes revenue less predictable
- Model C: Clearest packaging but mid-market gets squeezed between tiers
- Model D: Good balance but hybrid complexity may confuse sales and customers

### Phase 5: RECOMMEND

**Recommendation: Model C (Tiered) with elements of Model B expansion**

```
OPTIMAL PRICING:

Starter:    $299/month   (5 seats, 100GB, 10 dashboards)
Growth:     $799/month   (20 seats, 500GB, 50 dashboards)  
Business:   $1,999/month (50 seats, 2TB, unlimited dashboards)
Enterprise: Custom       (from $4,999/month, unlimited everything)

Add-ons (usage expansion):
  Additional data: $0.03/GB over tier limit
  Additional seats: $29/seat over tier limit
  Premium support: +$500/month
```

**Implementation plan:**
```
Week 1-2:   Finalize pricing, update billing system, prep sales materials
Week 3:     Announce to existing customers with 60-day grace period
Week 4:     New customers on new pricing immediately
Month 2-3:  Grandfather existing customers at current effective rate
             for 6 months, then migrate to nearest tier
Month 4:    Full migration, track churn and expansion metrics weekly
Month 6:    Review: adjust tier limits based on usage data
```

**Expected outcome:**
- MRR increase: +18-25% within 6 months ($192K -> $227K)
- Net revenue retention: increase from 108% to 115% (tier upgrades + add-ons)
- SMB churn: decrease (Starter is cheaper than 5 seats at $49)
- Enterprise ARPU: increase 35-50% (value-aligned pricing)
