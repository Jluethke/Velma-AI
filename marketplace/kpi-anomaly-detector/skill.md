# KPI Anomaly Detector

Detect anomalies in business KPI time series by ingesting metric data, applying statistical detection methods (z-score, IQR, moving average deviation, trend decomposition, change point detection), classifying anomaly type and severity, and producing actionable alert reports with root cause hypotheses and investigation steps.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Ingest KPI data (time series: revenue, churn, conversion, etc.)
REASON  --> Detect anomalies (z-score, moving average deviation, trend breaks)
PLAN    --> Classify anomalies (spike, dip, trend change, seasonality shift), assess severity
ACT     --> Output alert report with root cause hypotheses, recommended investigation steps
     \                                                                              /
      +--- New data or investigation results --- loop back to OBSERVE -------------+
```

## Inputs

- `kpi_data`: object -- Time series data for one or more KPIs. Each KPI has: name, values (timestamped), unit, frequency (daily/hourly/weekly)
- `kpi_metadata`: object -- Context per KPI: expected range, seasonality pattern, business meaning, upstream dependencies
- `alert_history`: array -- Previous alerts for these KPIs (to suppress known patterns and reduce false positives)
- `detection_config`: object -- Thresholds and method preferences: z-score threshold (default 2.0), IQR multiplier (default 1.5), MA window (default 7), sensitivity level (low/medium/high)

## Outputs

- `anomaly_report`: object -- Per-anomaly: KPI name, timestamp, observed value, expected value, delta, detection methods that fired, classification, severity, confidence score
- `alert_list`: array -- Prioritized alerts with severity (critical/high/medium/low), suppression status, and deduplication against history
- `baseline_update`: object -- Updated baseline parameters per KPI (mean, std, trend, seasonal components) incorporating new data
- `investigation_plan`: array -- Ordered list of investigation steps per anomaly, with estimated time and expected resolution

---

## Execution

### OBSERVE: Ingest KPI Data

**Entry criteria:** At least one KPI time series is provided with minimum 14 data points for statistical validity.

**Actions:**
1. Parse each KPI time series: validate timestamps are ordered, check for missing values, identify frequency
2. Compute descriptive statistics per KPI:
   - Mean, median, standard deviation, min, max
   - Q1, Q3, IQR
   - Skewness (to determine if distribution is symmetric)
3. Load or initialize baseline per KPI:
   - If prior baseline exists: load saved mean, std, trend, seasonal decomposition
   - If first run: compute baseline from the provided data window
4. Load alert history: identify recent alerts for same KPIs to enable deduplication
5. Identify the evaluation window: typically the most recent 1-3 data points against the historical baseline
6. Check data quality: flag if >10% of values are missing, if timestamps have gaps, or if values contain obvious data errors (negative revenue, >100% rates)

**Output:** Cleaned KPI data with descriptive statistics, loaded baselines, and data quality flags.

**Quality gate:** Every KPI has at least 14 valid data points. Data quality issues are flagged but do not block execution (anomalies in data quality are themselves worth reporting).

---

### REASON: Detect Anomalies

**Entry criteria:** Clean KPI data and baselines are available.

**Actions:**

Run all five detection methods on each KPI. Each method votes independently.

1. **Z-Score Detection:**
   - Compute z = (x - mean) / std for each data point in the evaluation window
   - Flag if |z| > threshold (default 2.0 for medium, 1.5 for high sensitivity, 3.0 for low)
   - For non-normal distributions (skewness > 1.0): use Modified Z-Score with median and MAD instead
   - Formula: Modified Z = 0.6745 * (x - median) / MAD

2. **IQR Method:**
   - Lower fence = Q1 - (multiplier * IQR)
   - Upper fence = Q3 + (multiplier * IQR)
   - Flag values outside fences
   - More robust to outliers than z-score; preferred for heavy-tailed distributions

3. **Moving Average Deviation:**
   - Compute MA over configured window (default 7 periods)
   - Compute deviation: (actual - MA) / MA * 100
   - Flag if absolute deviation exceeds threshold (default 5% for medium sensitivity)
   - Also compute Exponential Moving Average (EMA) for recency-weighted detection

4. **Trend Decomposition (Additive):**
   - Decompose series: Y = Trend + Seasonal + Residual
   - Trend: rolling median or LOESS smoothing
   - Seasonal: average residual per period position (day-of-week, month, etc.)
   - Residual: Y - Trend - Seasonal
   - Flag if |Residual| > 3 * std(Residual_history)
   - This catches anomalies that z-score misses in trending or seasonal data

5. **Change Point Detection (CUSUM):**
   - Cumulative sum of deviations from mean: S_t = S_(t-1) + (x_t - target)
   - Flag when |S_t| exceeds decision threshold h (default: 4 * std)
   - Distinguishes point anomalies from structural shifts
   - If CUSUM stays elevated for >5 consecutive periods: classify as regime change

**Output:** Per data point: list of detection methods that fired, raw scores from each method, combined confidence score (percentage of methods that agree).

**Quality gate:** At least 2 detection methods must agree for an anomaly to be reported (consensus requirement). Single-method detections are logged but suppressed from alerts.

---

### PLAN: Classify and Prioritize

**Entry criteria:** Detection results are available with consensus scores.

**Actions:**

1. **Classify each anomaly by type:**
   - **Spike:** Single-period increase, z > 2, preceded and followed by normal values
   - **Dip:** Single-period decrease, z < -2, preceded and followed by normal values
   - **Trend change:** CUSUM elevated for >5 periods, trend slope changed direction or magnitude
   - **Seasonality shift:** Residual pattern changed relative to historical seasonal component
   - **Level shift:** Mean shifted to new level and stabilized (change point + stable post-period)
   - **Variance change:** Spread of values increased/decreased without mean shift

2. **Assess severity:**
   - **Critical:** z > 3.0 or impact > 20% of KPI value, 4+ methods agree
   - **High:** z > 2.5 or impact > 10%, 3+ methods agree
   - **Medium:** z > 2.0 or impact > 5%, 2+ methods agree
   - **Low:** z > 1.5, 2 methods agree, or single-method detection with high confidence

3. **Generate root cause hypotheses:**
   - Cross-reference with other KPIs: did correlated KPIs also change? (e.g., signups dropped + conversion dropped = traffic source issue)
   - Check calendar: holidays, product launches, marketing campaigns, pricing changes
   - Check for data issues: pipeline delays, incomplete ingestion, schema changes
   - Rank hypotheses by likelihood based on anomaly pattern

4. **Deduplicate against alert history:**
   - Same KPI + same type + within 48h = suppress (unless severity increased)
   - Known seasonal pattern (e.g., Monday dips) = suppress with note
   - Track false positive rate per KPI to auto-adjust thresholds over time

5. **Prioritize alerts:**
   - Sort by: severity (desc), business impact (revenue-affecting first), confidence (desc)
   - Group related anomalies (e.g., multiple KPIs affected simultaneously)

**Output:** Classified, prioritized anomaly list with type, severity, confidence, root cause hypotheses, and suppression decisions.

**Quality gate:** Every reported anomaly has a type classification and at least one root cause hypothesis. Severity is justified by specific metric thresholds. False positive check is complete.

---

### ACT: Generate Alert Report

**Entry criteria:** Classified, prioritized anomaly list is ready.

**Actions:**

1. **Format alert report per anomaly:**
   ```
   ANOMALY ALERT: [KPI Name]
   Severity: [CRITICAL/HIGH/MEDIUM/LOW] | Type: [classification] | Confidence: [%]
   
   Current: [value] | Expected: [baseline value] | Delta: [absolute] ([%])
   Detection: [methods that fired with scores]
   
   Root Cause Hypotheses:
   1. [LIKELY/CHECK/POSSIBLE] [hypothesis] -- [investigation step]
   2. ...
   
   Recommended Actions:
   1. [IMMEDIATE/WITHIN_1H/TODAY] [action] ([estimated time])
   2. ...
   ```

2. **Generate investigation plan per anomaly:**
   - Step-by-step investigation ordered by likelihood and speed
   - Each step has: what to check, where to check it, expected time, what the result means

3. **Update baseline:**
   - If anomaly is confirmed noise or data error: exclude from baseline
   - If anomaly is real and sustained (>7 periods at new level): reset baseline
   - If anomaly is point event: include but down-weight in baseline computation
   - Update false positive tracking per KPI

4. **Adjust detection thresholds (adaptive):**
   - If false positive rate > 20% for a KPI: increase z-score threshold by 0.25
   - If true anomalies were missed (reported retroactively): decrease threshold by 0.25
   - Clamp thresholds between 1.5 and 4.0

**Output:** Complete alert report, investigation plan, updated baselines, adjusted thresholds.

**Quality gate:** Every critical/high alert has at least 3 investigation steps. Alert format is complete (no missing fields). Baseline updates are logged with reasoning.

---

**Loop condition:** After ACT, if investigation results become available (e.g., root cause confirmed, new data arrives, related KPIs show correlated anomalies), loop back to OBSERVE to re-evaluate with new context.

## Exit Criteria

The skill is DONE when:
- All KPIs in the input have been analyzed through all 5 detection methods
- Every detected anomaly (2+ method consensus) has a type classification, severity rating, and at least one root cause hypothesis
- Alert report is generated with prioritized investigation steps
- Baselines are updated (or flagged for deferred update pending investigation)
- False positive suppression logic has been applied against alert history

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Insufficient data points (< 14) | **Adjust** -- use available data with wider confidence intervals, note reduced reliability |
| OBSERVE | Data quality issues (>30% missing) | **Escalate** -- report data quality as its own alert, proceed with available data |
| OBSERVE | KPI metadata missing | **Adjust** -- infer frequency from timestamps, skip seasonal decomposition if period unknown |
| REASON | All methods disagree (no consensus) | **Adjust** -- report as low-confidence finding with individual method results |
| REASON | Distribution is multimodal | **Adjust** -- switch to IQR/MAD methods, disable z-score for this KPI |
| PLAN | No root cause hypotheses available | **Adjust** -- report anomaly with "unknown cause, manual investigation required" |
| PLAN | Alert history unavailable | **Adjust** -- skip deduplication, note potential for duplicate alerts |
| ACT | Baseline update conflicts with manual override | **Escalate** -- preserve manual override, log conflict |
| ACT | User rejects final output | **Targeted revision** -- ask which anomaly detection, root cause hypothesis, or alert threshold fell short and rerun only that section. Do not re-analyze all KPIs. |

## State Persistence

Between runs, this skill saves:
- **Baselines per KPI**: mean, std, median, MAD, trend slope, seasonal components, IQR bounds
- **Alert history**: all previous alerts with outcome (true positive, false positive, unresolved)
- **False positive rate**: per KPI, used to auto-adjust thresholds
- **Detection thresholds**: per KPI, adapted over time from false positive tracking
- **Seasonal patterns**: learned day-of-week, day-of-month, and monthly patterns per KPI

---

## Reference

### Z-Score Detection

```
Standard Z-Score:
  z = (x - mean) / std
  
  Interpretation:
    |z| > 1.0: unusual (68% of data is within 1 std)
    |z| > 2.0: anomalous (95% within 2 std)  <-- default threshold
    |z| > 3.0: critical (99.7% within 3 std)
  
  Limitation: assumes normal distribution
  When to avoid: heavy tails, multimodal, small samples (<30)

Modified Z-Score (Robust):
  M = 0.6745 * (x - median) / MAD
  where MAD = median(|x_i - median(x)|)
  
  More robust to outliers. Use when:
    - Distribution is skewed (skewness > 1.0)
    - Existing outliers would inflate std
    - Sample size is small
```

### IQR Method

```
Q1 = 25th percentile
Q3 = 75th percentile
IQR = Q3 - Q1

Lower fence = Q1 - 1.5 * IQR  (mild outlier)
Upper fence = Q3 + 1.5 * IQR  (mild outlier)

Lower extreme = Q1 - 3.0 * IQR  (extreme outlier)
Upper extreme = Q3 + 3.0 * IQR  (extreme outlier)

Advantages:
  - No distribution assumption
  - Robust to existing outliers
  - Simple to compute and explain

Limitations:
  - Less sensitive than z-score for normally distributed data
  - Does not account for trend or seasonality
  - Requires at least 20 data points for stable quartiles
```

### Moving Average Deviation

```
Simple Moving Average (SMA):
  MA_t = (1/w) * sum(x_{t-w+1} ... x_t)
  Deviation = (x_t - MA_t) / MA_t * 100

Exponential Moving Average (EMA):
  EMA_t = alpha * x_t + (1 - alpha) * EMA_{t-1}
  where alpha = 2 / (w + 1)
  
  EMA reacts faster to recent changes.

Window selection:
  - 7 periods: captures weekly patterns, responsive
  - 14 periods: smooths weekly noise, moderate lag
  - 30 periods: monthly baseline, slow to react

Threshold guidelines:
  - Stable KPIs (churn, NPS): flag at 3% deviation
  - Moderate KPIs (conversion, ARPU): flag at 5%
  - Volatile KPIs (daily revenue, signups): flag at 10%
```

### Trend Decomposition

```
Additive Model: Y_t = T_t + S_t + R_t
  T_t = Trend (long-term direction)
  S_t = Seasonal (repeating pattern)
  R_t = Residual (noise + anomalies)

Multiplicative Model: Y_t = T_t * S_t * R_t
  Use when seasonal amplitude grows with trend level

Steps:
1. Estimate trend: centered moving average or LOESS
2. De-trend: Y_t - T_t (additive) or Y_t / T_t (multiplicative)
3. Estimate seasonal: average de-trended values per period position
4. Compute residual: R_t = Y_t - T_t - S_t
5. Anomaly = |R_t| > k * std(R_history), typically k = 3

Advantages:
  - Handles trending data (z-score can't)
  - Handles seasonal data (IQR can't)
  - Residual anomalies are "true" surprises
```

### Change Point Detection (CUSUM)

```
Cumulative Sum (CUSUM):
  S_0 = 0
  S_t = S_t-1 + (x_t - target)
  
  where target = historical mean or expected value

Signal when |S_t| > h (decision threshold)
  h = 4 * std (default) or 5 * std (conservative)

Interpretation:
  - S_t drifts positive: values consistently above target
  - S_t drifts negative: values consistently below target
  - Sharp jump: sudden level shift
  - Gradual drift: slowly changing mean

Distinguishing point vs structural:
  - Point anomaly: S_t spikes then returns to 0 within 1-3 periods
  - Structural shift: S_t stays elevated/depressed for >5 periods
  - If structural: recommend baseline reset after confirmation period (7 periods)
```

### Anomaly Classification Matrix

```
| Pattern          | Duration | Direction | Detection Method       |
|------------------|----------|-----------|------------------------|
| Spike            | 1 period | Up        | Z-score, IQR           |
| Dip              | 1 period | Down      | Z-score, IQR           |
| Trend change     | >5 per.  | Either    | CUSUM, Trend decomp    |
| Seasonality shift| Periodic | Either    | Decomposition residual |
| Level shift      | Permanent| Either    | CUSUM + stabilization  |
| Variance change  | >5 per.  | Spread    | F-test on rolling var  |
```

### Severity Scoring Formula

```
severity_score = (
    0.30 * normalized_z_score +      # Statistical significance
    0.25 * pct_impact +               # Business impact (% change)
    0.25 * method_consensus +          # Agreement across methods (0-1)
    0.20 * recency_weight             # More recent = more urgent
)

Thresholds:
  severity_score > 0.8: CRITICAL
  severity_score > 0.6: HIGH
  severity_score > 0.4: MEDIUM
  severity_score > 0.2: LOW
  severity_score <= 0.2: NOISE (suppress)
```

### False Positive Reduction Strategy

```
1. Seasonal suppression: learn recurring patterns, suppress known dips/spikes
2. Alert deduplication: same KPI + same type within 48h = single alert
3. Adaptive thresholds: increase threshold for noisy KPIs, decrease for stable
4. Confirmation window: wait 1 period before alerting on medium-severity (reduces point noise)
5. Correlation check: if only 1 KPI anomalous while correlated KPIs are normal, reduce confidence
6. Business calendar: suppress during known events (product launches, holidays, sales)
7. Track and learn: log all alerts, track which were true/false positives, retrain thresholds quarterly
```

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
