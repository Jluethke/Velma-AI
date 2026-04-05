# KPI Anomaly Detector -- SaaS Revenue Monitoring

## Scenario

A B2B SaaS company tracks 5 core KPIs daily: MRR, churn rate, new signups, conversion rate, and average deal size. The VP of Revenue asks: "Why did MRR drop yesterday? Is it real or noise?"

## Input Data

```
KPI: Monthly Recurring Revenue (MRR)
Frequency: Daily snapshot
Last 30 days (USD):
  Day 1-25:  $2.41M, $2.42M, $2.43M, $2.41M, $2.44M, $2.45M, $2.43M,
             $2.46M, $2.47M, $2.45M, $2.48M, $2.49M, $2.47M, $2.50M,
             $2.51M, $2.49M, $2.52M, $2.53M, $2.51M, $2.54M, $2.55M,
             $2.53M, $2.56M, $2.57M, $2.55M
  Day 26-30: $2.58M, $2.59M, $2.57M, $2.60M, $2.34M  <-- Day 30 = TODAY
```

## Execution: ORPA Loop

### OBSERVE

**Data ingestion:**
- KPI: MRR, daily granularity, 30-day window
- Current value: $2.34M (Day 30)
- Previous day: $2.60M
- Day-over-day change: -$260K (-10.0%)

**Baseline computation:**
- 30-day mean: $2.497M
- 30-day std dev: $0.057M
- 30-day median: $2.505M
- IQR (Q1-Q3): $2.445M - $2.555M

**Historical context:**
- Trend: upward, ~$6K/day growth rate
- Seasonality: slight dip pattern every 3rd day (normal variance)
- Max prior single-day drop: -$30K (Day 5 to Day 4)

### REASON

**Detection method results:**

1. **Z-score:** (2.34 - 2.497) / 0.057 = **-2.75** (threshold: |z| > 2.0 = anomaly, |z| > 3.0 = critical)
   - Result: ANOMALY (high severity)

2. **IQR method:** Lower fence = Q1 - 1.5 * IQR = 2.445 - 1.5 * 0.110 = $2.28M
   - $2.34M > $2.28M, so NOT an outlier by IQR
   - However, IQR is less sensitive for trending data

3. **Moving average deviation:** 7-day MA = $2.576M. Deviation = -$236K (-9.2%)
   - Threshold: > 5% deviation = anomaly
   - Result: ANOMALY

4. **Trend decomposition:**
   - Trend component (Day 30 expected): ~$2.59M
   - Seasonal component: -$10K (slight down-day expected)
   - Residual: $2.34M - $2.59M + $0.01M = **-$240K**
   - Residual is 4.2x the historical residual std dev
   - Result: ANOMALY (residual-driven)

5. **Change point detection (CUSUM):**
   - Cumulative sum of deviations shows sharp break at Day 30
   - No gradual drift detected -- this is a single-day event
   - Result: POINT ANOMALY (not trend change)

### PLAN

**Classification:**
- Type: **Sharp dip** (single-day, not gradual)
- Severity: **HIGH** (z-score -2.75, 10% drop, 4.2x residual)
- Confidence: **92%** (4 of 5 methods flagged it)
- Pattern: Not seasonality (wrong day in cycle), not noise (too large)

**Root cause hypotheses (ranked by likelihood):**
1. Large customer churn event ($260K = ~10% of MRR, consistent with 1-2 enterprise accounts)
2. Billing system error (failed charges, payment processing outage)
3. Data pipeline error (incomplete data ingestion for Day 30)
4. Contract downgrade batch (end-of-month downgrades processing)

### ACT

**Alert report:**

```
ANOMALY ALERT: MRR
Severity: HIGH | Type: Sharp Dip | Confidence: 92%

Current: $2.34M | Expected: ~$2.59M | Delta: -$260K (-10.0%)
Detection: z-score -2.75, MA deviation -9.2%, residual 4.2x normal

Root Cause Hypotheses:
1. [LIKELY] Enterprise churn — check if any accounts >$100K ARR
   churned or downgraded in last 24h
2. [CHECK] Billing system — verify payment processing uptime
   and failed charge count for yesterday
3. [CHECK] Data pipeline — confirm Day 30 data is complete
   (compare record count to Day 29)
4. [POSSIBLE] Month-end downgrades — pull downgrade log for
   last 48h, compare to prior month-ends

Recommended Actions:
1. IMMEDIATE: Check CRM for enterprise churn events (5 min)
2. IMMEDIATE: Verify billing system status page (2 min)
3. WITHIN 1H: Pull data pipeline completeness check
4. TODAY: If confirmed real, update forecast and notify board

Do NOT adjust baseline yet — wait for root cause confirmation.
```

**Baseline update:** Suppressed pending investigation. If root cause is confirmed as real churn, baseline will absorb the new level after 7 days of stable data at the lower level. If data error, Day 30 will be excluded from baseline computation.
