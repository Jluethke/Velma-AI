# Supply Chain Optimizer

Maps supply chain dependencies from raw materials to finished product, identifies concentration risks and single points of failure, calculates optimal safety stock and reorder points, simulates disruption scenarios with production impact estimates, and tracks supplier performance with early warning indicators.

## Execution Pattern: Phase Pipeline

## Inputs
- suppliers: array -- Current suppliers with: name, location, products supplied, lead time, cost, quality rating, contract terms, % of total spend
- products: array -- Products dependent on supply chain, with bill of materials (BOM) linking components to suppliers
- demand_forecast: object -- Expected demand per product per period (monthly/weekly), demand variability (standard deviation or coefficient of variation)
- lead_times: object -- Per-supplier lead time (average and standard deviation), including transportation time
- risk_tolerance: string -- "low" (maximize resilience, accept higher cost), "medium" (balanced), "high" (minimize cost, accept more risk)

## Outputs
- supplier_map: object -- Visual dependency map showing all supplier relationships, tier depths, and concentration points
- risk_analysis: object -- Scored risk assessment per supplier and per supply chain node (single-source, geographic, financial, quality)
- diversification_plan: object -- Recommendations for dual/multi-sourcing with cost-benefit analysis
- safety_stock_calculations: object -- Optimal safety stock levels, reorder points, and weeks of supply per component
- disruption_simulations: array -- Scenario analyses showing production impact of various disruption types

## Execution

### Phase 1: MAP -- Supply Chain Topology
**Entry criteria:** Supplier list and product BOMs provided.
**Actions:**
1. Build the supply chain map:
   - **Tier 1:** Direct suppliers (you buy from them)
   - **Tier 2:** Suppliers' suppliers (they buy from; often invisible but critical)
   - **Tier 3+:** Deep supply chain (raw materials, specialized components)
   - For each node: supplier name, location (country/region), products, lead time, % of your spend, contract end date.
2. Identify critical paths: trace each finished product back to its raw inputs. Highlight any path where a single supplier failure stops production entirely.
3. Map geographic concentration: group suppliers by country/region. Identify clusters where multiple suppliers share the same geography (natural disaster, political risk, logistics bottleneck).
4. Map spend concentration: calculate % of total spend per supplier. Flag any supplier with >30% of total spend or >50% of a critical component.
5. Map lead time layers: total lead time from raw material to finished product for each critical path (sum of all tier lead times).

**Output:** Supply chain map with tier structure, critical paths, geographic distribution, spend concentration, and total lead times.
**Quality gate:** Every finished product has at least one complete path traced to Tier 1. All single-source dependencies are identified. Geographic and spend concentration are quantified.

### Phase 2: ANALYZE -- Risk Assessment
**Entry criteria:** Supply chain map complete.
**Actions:**
1. Score each supplier across four risk dimensions (each 1-10):
   - **Single-source risk:** Are they the only supplier for a critical component? (10 = sole source of critical item, 1 = one of many interchangeable suppliers)
   - **Geographic risk:** Political stability, natural disaster exposure, logistics vulnerability of their location. (10 = high-risk region, 1 = stable, well-connected region)
   - **Financial risk:** Supplier financial health indicators -- profitability, debt levels, customer concentration. (10 = financially distressed, 1 = strong balance sheet)
   - **Quality risk:** Historical defect rates, certification status, quality trend direction. (10 = declining quality, frequent defects, 1 = consistent high quality, improving)
2. Calculate composite risk score: weighted average of four dimensions (weights adjusted by risk tolerance: low tolerance = weight single-source and geographic higher).
3. Identify "hidden single sources": components sourced from multiple Tier 1 suppliers who all use the same Tier 2 supplier (false diversification).
4. Calculate cost of disruption per supplier:
   - Production revenue lost per day of stockout x expected disruption duration (in days)
   - Contract penalties, customer relationship damage, market share loss (harder to quantify but real)
   - Compare to cost of mitigation (safety stock, dual sourcing premium)

**Output:** Risk scorecard per supplier, ranked risk list, hidden dependencies, cost-of-disruption estimates.
**Quality gate:** Every supplier has a composite risk score. The top 5 highest-risk nodes are identified. Cost of disruption is estimated for at least the top 3 risks.

### Phase 3: OPTIMIZE -- Diversification and Safety Stock
**Entry criteria:** Risk analysis complete.
**Actions:**
1. **Dual-sourcing recommendations:**
   - For every single-source critical component: identify potential alternate suppliers.
   - Calculate the "insurance premium" of dual sourcing: (cost from alternate - cost from primary) x volume.
   - Compare insurance premium to expected cost of disruption x probability of disruption:
     - If insurance premium < expected disruption cost: dual source immediately.
     - If insurance premium > expected disruption cost: accept the risk or invest in higher safety stock instead.
   - Recommend split ratios: primary 70%, alternate 30% (maintains leverage with primary while building alternate capability).
2. **Safety stock calculations:**
   - Formula: Safety Stock = Z x sqrt(avg_lead_time x demand_variance^2 + avg_demand^2 x lead_time_variance^2)
     - Z = service level factor (95% service = Z of 1.65, 99% = Z of 2.33)
   - Reorder Point = avg_demand x avg_lead_time + safety_stock
   - Calculate weeks of supply = (on-hand inventory + on-order) / weekly demand
   - Target weeks of supply by component criticality:
     - Critical (sole-source or long lead time): 6-12 weeks
     - Important (dual-sourced, moderate lead time): 3-6 weeks
     - Standard (commodity, multiple sources, short lead): 1-3 weeks
3. **Inventory cost trade-off:**
   - Carrying cost of safety stock = avg_inventory_value x carrying_rate (typically 20-30% per year including storage, insurance, obsolescence)
   - Compare to cost of stockout (production loss, expediting fees, customer penalties)
   - Find the minimum-total-cost point

**Output:** Dual-sourcing recommendations with cost-benefit, safety stock levels per component, reorder points, target weeks of supply.
**Quality gate:** Every critical component has a safety stock calculation. Dual-sourcing recommendations include quantified cost-benefit. Total inventory investment is calculated.

### Phase 4: SIMULATE -- Disruption Scenarios
**Entry criteria:** Safety stock and diversification plans defined.
**Actions:**
1. Define disruption scenarios:
   - **Supplier failure:** Primary supplier for [component] goes offline for 2/4/8 weeks.
   - **Regional disruption:** All suppliers in [region] offline for 4 weeks (natural disaster, political event).
   - **Logistics disruption:** Shipping lead time doubles for 6 weeks (port congestion, route disruption).
   - **Demand spike:** Demand increases 50% for 4 weeks (unexpected order, viral product).
   - **Quality failure:** Supplier ships defective batch, need to source replacement + sort/rework existing inventory.
2. For each scenario, calculate:
   - **Days until stockout:** current inventory / daily demand rate (considering safety stock buffer).
   - **Production impact:** units of finished product that cannot be produced.
   - **Revenue impact:** production impact x revenue per unit.
   - **Recovery time:** how long to return to normal operations after disruption ends.
   - **Mitigation effectiveness:** how much does the proposed safety stock / dual sourcing reduce the impact?
3. Present scenarios as before/after: "Without mitigation, a 4-week supplier failure causes $X in lost revenue. With proposed safety stock, impact is reduced to $Y."

**Output:** Disruption scenario analysis with impact quantification, mitigation effectiveness comparison, worst-case identification.
**Quality gate:** At least 3 scenarios are modeled. Each scenario has quantified financial impact. Before/after mitigation comparison is provided.

### Phase 5: MONITOR -- Supplier Performance Tracking
**Entry criteria:** Optimization plan delivered.
**Actions:**
1. Define KPIs to track per supplier:
   - **On-time delivery rate:** % of orders delivered within agreed lead time. Target: >95%. Warning: <90%.
   - **Quality acceptance rate:** % of deliveries passing incoming inspection. Target: >98%. Warning: <95%.
   - **Lead time trend:** is average lead time stable, increasing, or decreasing? Increasing = early warning.
   - **Price trend:** are costs stable or creeping up? Sudden increases may signal supplier distress.
   - **Responsiveness:** time to respond to inquiries, willingness to share capacity information.
2. Define early warning triggers:
   - On-time delivery drops 5+ percentage points in a quarter
   - Quality rejection rate doubles
   - Lead time increases >20% from historical average
   - Supplier stops sharing financial/capacity information (transparency decline)
   - Key personnel turnover at supplier (account manager, quality manager)
   - Supplier's customer concentration increases (dependency risk)
3. Define escalation actions for each trigger:
   - Warning: increase order frequency, monitor closely, request supplier corrective action
   - Alert: activate alternate supplier qualification, increase safety stock
   - Critical: shift volume to alternate supplier, renegotiate or terminate

**Output:** Supplier scorecard template, KPI definitions, early warning trigger definitions, escalation protocols.
**Quality gate:** Every active supplier has defined KPIs with targets and warning thresholds. At least 3 early warning triggers are defined with specific escalation actions.

## Exit Criteria
The pipeline completes when: (1) supply chain map is documented, (2) risks are scored and ranked, (3) safety stock levels and dual-sourcing recommendations are delivered with cost-benefit, (4) at least 3 disruption scenarios are modeled, and (5) supplier monitoring framework is established.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| MAP | Tier 2+ supplier data unavailable | Adjust -- map what's known, flag "unknown dependency" as a risk itself, recommend supplier transparency audit |
| ANALYZE | No financial data on suppliers | Adjust -- use observable proxies (delivery consistency, responsiveness, public information) |
| OPTIMIZE | No alternate suppliers exist for a critical component | Escalate -- flag as "critical unmitigable risk," recommend: design-out the component, build internal capacity, or negotiate long-term supply agreement with contractual guarantees |
| SIMULATE | Demand forecast has high uncertainty | Adjust -- run scenarios at multiple demand levels (low/mid/high) to show sensitivity |
| MONITOR | Supplier refuses to share performance data | Escalate -- limited visibility is itself a risk factor, increase safety stock or accelerate alternate qualification |
| MONITOR | User rejects final output | **Targeted revision** -- ask which supplier mapping, risk scenario, or optimization recommendation fell short and rerun only that section. Do not re-map the full supply chain. |

## Reference

### Safety Stock Formula (Detailed)
```
Safety Stock = Z x sqrt(LT_avg x D_std^2 + D_avg^2 x LT_std^2)

Where:
  Z       = service level factor (from normal distribution)
  LT_avg  = average lead time (in days/weeks)
  D_std   = standard deviation of demand (per day/week)
  D_avg   = average demand (per day/week)
  LT_std  = standard deviation of lead time (in days/weeks)

Common Z values:
  90% service level: Z = 1.28
  95% service level: Z = 1.65
  98% service level: Z = 2.05
  99% service level: Z = 2.33
  99.9% service level: Z = 3.09
```

### Reorder Point
```
Reorder Point = (D_avg x LT_avg) + Safety Stock
```
When inventory drops to this level, place a new order.

### Economic Order Quantity (EOQ)
```
EOQ = sqrt(2 x D x S / H)

Where:
  D = annual demand (units)
  S = ordering cost per order ($)
  H = holding cost per unit per year ($)
```
Balances ordering costs against holding costs.

### Supplier Evaluation Matrix (Weighted Scoring)
| Criterion | Weight (%) | Score (1-10) | Weighted Score |
|---|---|---|---|
| Price competitiveness | 25 | | |
| Quality/defect rate | 25 | | |
| Delivery reliability | 20 | | |
| Lead time | 15 | | |
| Financial stability | 10 | | |
| Communication/flexibility | 5 | | |

### Risk Mitigation Strategies (by cost)
1. **Safety stock** (low cost, immediate): buffer inventory for demand/supply variability
2. **Dual sourcing** (medium cost, medium-term): qualify and maintain alternate suppliers
3. **Nearshoring** (high cost, long-term): move supply closer to reduce lead time and geographic risk
4. **Vertical integration** (highest cost, strategic): build internal capability for critical components
5. **Demand shaping** (variable cost): adjust pricing/promotions to smooth demand variability

### State Persistence
Tracks over time:
- Supplier performance KPIs (delivery, quality, lead time, price) per period
- Safety stock levels vs actual stockout events
- Disruption history and recovery times
- Spend concentration trends
- Alternate supplier qualification pipeline status
