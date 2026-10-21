# Cost of Ownership

Calculates the true cost of owning a vehicle or a home by combining every
recurring and one-time expense into a single daily, monthly, and annual
figure. Most people underestimate ownership cost by 30-40% because they
track payments but ignore depreciation, insurance, maintenance, fuel,
registration, property tax, utilities, and repair reserves. This flow
captures all of it, compares to published benchmarks, and identifies the
largest cost reduction opportunities.

```
INPUT -> [INVENTORY] -> [CALCULATE] -> [BENCHMARK] -> [OPTIMIZE] -> REPORT
```

## Inputs

| Field          | Type    | Required | Description                               |
|----------------|---------|----------|-------------------------------------------|
| asset_type     | string  | yes      | "vehicle" or "home"                        |
| purchase_price | number  | yes      | Original purchase price in USD             |
| purchase_date  | string  | yes      | YYYY-MM-DD                                 |
| current_value  | number  | no       | Estimated current market value             |
| zip_code       | string  | no       | For regional cost adjustment               |
- `asset_type:string`: (from manifest)
- `purchase_price:number`: (from manifest)
- `purchase_date:string`: (from manifest)

## Outputs

| Field                | Type    | Description                              |
|----------------------|---------|------------------------------------------|
| cost_breakdown       | object  | Every cost category with annual amount   |
| daily_cost           | number  | Total ownership cost per day             |
| monthly_cost         | number  | Total ownership cost per month           |
| annual_cost          | number  | Total ownership cost per year            |
| benchmark_comparison | object  | Your cost vs national average            |
| optimization_list    | array   | Ranked cost reduction opportunities      |

---
- `cost_breakdown:object`: (from manifest)
- `daily_cost:number`: (from manifest)
- `monthly_cost:number`: (from manifest)
- `annual_cost:number`: (from manifest)
- `benchmark_comparison:object`: (from manifest)

## Phase 1: Expense Inventory

### Entry Criteria
Asset type and purchase price provided.

### Actions
1. For **vehicle**, collect or estimate each category:
   - Depreciation: (purchase_price - current_value) / years_owned. If no
     current_value, use standard curve: 20% year 1, 15% year 2, 12% year 3,
     10% years 4-5, 8% years 6+.
   - Fuel: annual miles / MPG * price per gallon. Default 12,000 mi/yr,
     24 MPG combined, $3.50/gal if not provided.
   - Insurance: user-provided or default $1,674/yr (national average 2025).
   - Maintenance: sum from maintenance-schedule output if available, else
     use AAA estimate $0.10/mile.
   - Repairs: separate from maintenance. $500/yr for vehicles under 5 years,
     $1,200/yr for 5-10 years, $2,000/yr for 10+.
   - Registration/fees: user-provided or $200/yr average.
   - Financing: monthly payment * 12 if financed. Interest portion only for
     true cost (principal is captured in depreciation).
   - Parking/tolls: user-provided or $0.

2. For **home**, collect or estimate each category:
   - Mortgage payment: principal + interest (monthly * 12).
   - Property tax: user-provided or estimate at 1.1% of current_value (national median).
   - Insurance: user-provided or $1,820/yr (national average 2025).
   - Utilities: electric + gas + water + sewer + trash. Default $300/mo if
     not provided. Use home-energy-audit output if available.
   - Maintenance reserve: 1% of home value per year (standard rule).
   - HOA fees: user-provided or $0.
   - Repairs: separate from maintenance. $1,000/yr baseline, scaled by age.
     Homes over 20 years: $2,500/yr. Over 40 years: $4,000/yr.
   - Lawn/landscape: user-provided or $150/mo seasonal average.
   - Pest control: user-provided or $50/mo if applicable.

3. Record each line item with: category, annual_amount, source (user-provided
   vs estimated), confidence (HIGH if user-provided, MEDIUM if calculated,
   LOW if defaulted).

### Output
Complete expense inventory: [{category, annual_amount, source, confidence}].

### Quality Gate
At least 4 categories populated. No negative amounts. Depreciation calculated
for vehicles, mortgage or rent captured for homes.

---

## Phase 2: Rate Calculation

### Entry Criteria
Expense inventory from Phase 1.

### Actions
1. Sum all annual amounts to get total annual cost.
2. Divide: monthly = annual / 12, daily = annual / 365.
3. Calculate cost per unit:
   - Vehicle: cost per mile = annual / annual_miles.
     AAA 2025 benchmark: $0.827/mile for medium sedan.
   - Home: cost per square foot = annual / sqft (if sqft provided).
     National average: $15-20/sqft/year for owned homes.
4. Calculate depreciation as a percentage of total cost.
   For vehicles, depreciation is typically 35-45% of total cost.
   For homes, appreciation may offset (use negative depreciation if
   current_value > purchase_price).
5. Identify the top 3 cost categories by annual amount.

### Output
Rate summary: {annual, monthly, daily, per_unit, top_3_categories,
depreciation_pct}.

### Quality Gate
Annual cost is positive. Per-unit cost calculated. Top 3 categories identified.

---

## Phase 3: Benchmark Comparison

### Entry Criteria
Rate calculations from Phase 2.

### Actions
1. Compare against published benchmarks:

   **Vehicle benchmarks (AAA 2025 data)**
   | Category        | Small Sedan | Medium Sedan | SUV     | Pickup  |
   |-----------------|-------------|--------------|---------|---------|
   | Annual cost     | $7,950      | $10,054      | $11,358 | $12,449 |
   | Per mile        | $0.530      | $0.670       | $0.757  | $0.830  |
   | Fuel            | $1,568      | $2,054       | $2,398  | $2,871  |
   | Insurance       | $1,674      | $1,674       | $1,674  | $1,674  |
   | Maintenance     | $886        | $987         | $1,098  | $1,150  |
   | Depreciation    | $2,990      | $3,875       | $4,356  | $4,800  |

   **Home benchmarks (national medians)**
   | Category        | Under $300K | $300-500K | $500K-750K | Over $750K |
   |-----------------|-------------|-----------|------------|------------|
   | Annual cost     | $18,500     | $28,000   | $40,000    | $58,000    |
   | Monthly cost    | $1,542      | $2,333    | $3,333     | $4,833     |
   | Maintenance %   | 1.0%        | 0.9%      | 0.8%       | 0.7%       |
   | Insurance       | $1,500      | $1,820    | $2,400     | $3,200     |

2. For each category, compute: your_cost / benchmark_cost as a ratio.
   - Under 0.8: BELOW AVERAGE (good)
   - 0.8 to 1.2: AVERAGE
   - Over 1.2: ABOVE AVERAGE (investigate)
3. Overall comparison: your total vs benchmark total, percentile estimate.

### Output
Benchmark report: {overall_ratio, overall_assessment, category_comparisons[]}.

### Quality Gate
At least 3 categories benchmarked. Overall ratio calculated.

---

## Phase 4: Optimization

### Entry Criteria
Benchmark comparison from Phase 3.

### Actions
1. For every category rated ABOVE AVERAGE, generate a specific suggestion:
   - Fuel above average: "Current spend ${X}/yr. At benchmark MPG, target
     ${Y}/yr. Savings: ${X-Y}/yr. Actions: tire pressure check, driving
     habit review, fuel grade review."
   - Insurance above average: "Current ${X}/yr vs benchmark ${Y}/yr.
     Actions: quote comparison (average savings $400/yr from switching),
     deductible increase analysis, bundling discount check."
   - Maintenance above average: "Current ${X}/yr. Check if dealer vs
     independent shop. Independent shops average 25-30% less for identical
     work on non-warranty vehicles."
   - Utilities above average: "Run home-energy-audit flow for specific
     waste identification. Average savings from audit recommendations:
     15-25% of utility bill."
2. Rank suggestions by annual savings potential (largest first).
3. Include implementation difficulty: EASY (phone call or habit change),
   MEDIUM (requires shopping or minor work), HARD (requires investment
   with payback period).
4. Calculate total potential savings if all suggestions implemented.

### Output
Optimization list: [{category, current_cost, target_cost, savings,
suggestion, difficulty}]. Total potential savings.

### Quality Gate
At least one suggestion generated (every owner has at least one ABOVE AVERAGE
category). Savings amounts are positive and plausible (no savings > current cost).

---


---

## Worked Example

Illustrative only.

Given typical inputs for Total cost of ownership tracking for vehicles and homes with benchmark compariso, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

- Complete cost breakdown with every applicable category
- Daily, monthly, and annual rates calculated
- Benchmark comparison completed
- At least one optimization suggestion provided
- Per-unit cost calculated (per mile or per sqft)

## Error Handling

| Error                        | Response                                    |
|------------------------------|---------------------------------------------|
| Missing purchase price       | Abort: "Purchase price required for depreciation calculation" |
| Unknown asset type           | Abort: "Asset type must be 'vehicle' or 'home'" |
| Current value > 2x purchase  | Flag for review, possible data entry error   |
| All categories defaulted     | Warn: "All costs estimated. Provide actuals for accuracy" |
| Negative depreciation (home) | Valid: means appreciation. Note it as equity gain |

## State Persistence

Store each calculation as:
```
{asset_type}_{YYYY-MM}.cost.json
```
Retain for trend analysis. Month-over-month change in total cost
identifies creeping expenses before they become problems.

## Quick Reference: Hidden Costs People Miss

| Asset   | Commonly Missed            | Typical Annual Amount |
|---------|----------------------------|-----------------------|
| Vehicle | Depreciation               | $3,000-5,000          |
| Vehicle | Tire replacement reserve   | $200-400              |
| Vehicle | Registration + inspection  | $100-300              |
| Vehicle | Parking (urban)            | $1,200-3,600          |
| Home    | Maintenance reserve        | 1% of value           |
| Home    | Capital improvements       | $2,000-5,000          |
| Home    | Pest control               | $300-600              |
| Home    | Appliance replacement fund | $500-1,000            |

---

Copyright 2026 the governance provider Group. All rights reserved.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
