# Weekly Scorecard

End of week performance review across every domain. Collects data from vehicle,
home, money, fitness, and calendar flows that ran during the week, grades each
domain A through F, compares to the previous week, and produces a single-page
scorecard with concrete action items for the coming week.

```
COLLECT --> SCORE --> COMPARE --> ACTIONS --> SCORECARD
  DATA      DOMAINS   TRENDS     ITEMS      GENERATE
```

## Inputs

| Field       | Type   | Required | Description                              |
|-------------|--------|----------|------------------------------------------|
| week_ending | string | yes      | Date (YYYY-MM-DD) of the Saturday ending the week |
| domains     | array  | no       | Subset of domains to score; defaults to all |
| prior_scorecard | object | no  | Previous week's scorecard for trend comparison |
- `week_ending:string`: (from manifest)
- `domains:array`: (from manifest)

## Outputs

| Field             | Type   | Description                              |
|-------------------|--------|------------------------------------------|
| scorecard         | object | Complete weekly scorecard with all domains|
| grades            | object | Per-domain letter grades A-F             |
| trends            | object | Per-domain direction vs prior week       |
| next_week_actions | array  | Prioritized actions for the coming week  |
| overall_grade     | string | Weighted composite grade A-F             |

---
- `scorecard:object`: (from manifest)
- `grades:object`: (from manifest)
- `trends:object`: (from manifest)
- `next_week_actions:array`: (from manifest)

## Phase 1: Data Collection

### Entry Criteria
week_ending date provided. At least one domain's flow has run data from the target week.

### Actions

1. VEHICLE domain: collect from the target week:
   - drive-analysis runs: total miles, fuel consumed (gallons), average mpg,
     hard braking events, max speed recorded
   - vehicle-health runs: health grade, DTC count, new vs resolved DTCs
   - pre-drive-check runs: count of runs, go/nogo ratio
   - maintenance-schedule: items completed vs items due

2. HOME domain: collect from the target week:
   - home-status runs: total device alerts, anomaly count by severity
     (RED/YELLOW/GREEN), devices offline count
   - home-maintenance: tasks completed vs tasks due this week
   - home-energy-audit: if run, utility cost and waste percentage

3. MONEY domain: collect from the target week:
   - budget-builder: actual spend vs planned by category, total surplus/deficit
   - portfolio-check: week-start value, week-end value, net change percentage
   - net-worth-tracker: if run, month-over-month delta
   - subscription-audit: if run, monthly waste identified
   - market-brief runs: count of briefings consumed

4. FITNESS domain: collect from the target week:
   - workout-log runs: sessions logged, total volume (sets x reps x weight),
     cardio minutes, rest days taken
   - fitness-progress: if run, any PRs set, plateau status, 1RM changes

5. LIFE domain: collect from the target week:
   - morning-brief runs: count, average alert level, streak days
   - Calendar: events attended, conflicts encountered
   - weekly-review: if run prior to scorecard, any unresolved items

### Output
- vehicle_data: object with miles, mpg, health_grade, dtc_delta, maintenance_compliance
- home_data: object with alerts, anomalies, tasks_completed, tasks_due
- money_data: object with budget_variance_pct, portfolio_change_pct, waste_found
- fitness_data: object with sessions, volume, cardio_min, prs, rest_days
- life_data: object with briefings, calendar_events, streak

### Quality Gate
At least 2 of 5 domains have data from the target week. Domains with no data
are scored as INCOMPLETE rather than penalized.

---

## Phase 2: Domain Scoring

### Entry Criteria
Phase 1 data collected for at least 2 domains.

### Actions

1. Score VEHICLE (if data exists) using this rubric:

   | Metric                | A      | B      | C      | D      | F      |
   |-----------------------|--------|--------|--------|--------|--------|
   | Health grade          | A      | B      | C      | D      | F      |
   | Hard braking / 100 mi | < 1    | 1-3    | 3-5    | 5-10   | > 10   |
   | Maintenance compliance| 100%   | > 80%  | > 60%  | > 40%  | <= 40% |
   | Fuel efficiency vs EPA| > 100% | > 90%  | > 80%  | > 70%  | <= 70% |

2. Score HOME using this rubric:

   | Metric                | A      | B      | C      | D      | F      |
   |-----------------------|--------|--------|--------|--------|--------|
   | RED alerts            | 0      | 0      | 1      | 2      | > 2    |
   | YELLOW alerts         | 0      | 1-2    | 3-4    | 5+     | N/A    |
   | Tasks completed / due | 100%   | > 80%  | > 60%  | > 40%  | <= 40% |
   | Devices offline       | 0      | 1      | 2      | 3+     | N/A    |

3. Score MONEY using this rubric:

   | Metric                | A      | B      | C      | D      | F      |
   |-----------------------|--------|--------|--------|--------|--------|
   | Budget variance       | < 5%   | 5-10%  | 10-20% | 20-30% | > 30%  |
   | Portfolio weekly chg  | > 2%   | 0-2%   | -2-0%  | -5 to -2%| < -5%|
   | Bills paid on time    | 100%   | > 90%  | > 80%  | > 60%  | <= 60% |

4. Score FITNESS using this rubric:

   | Metric                | A      | B      | C      | D      | F      |
   |-----------------------|--------|--------|--------|--------|--------|
   | Sessions vs planned   | 100%   | > 80%  | > 60%  | > 40%  | <= 40% |
   | PRs set               | 2+     | 1      | 0      | 0      | 0      |
   | Rest days (target 2)  | 2      | 1 or 3 | 0 or 4 | 5+     | 7      |

5. Score LIFE using this rubric:

   | Metric                | A      | B      | C      | D      | F      |
   |-----------------------|--------|--------|--------|--------|--------|
   | Morning briefs / 7    | 7      | 5-6    | 3-4    | 1-2    | 0      |
   | Calendar conflicts    | 0      | 1      | 2-3    | 4+     | N/A    |

6. For each domain, take the median of its metrics' letter grades. Convert
   A=4, B=3, C=2, D=1, F=0 for the median calculation, then round back to
   nearest letter.

### Output
- grades: object mapping each domain to a letter grade A-F
- grade_details: object mapping each domain to its per-metric breakdown
- overall_grade: weighted mean (vehicle 20%, home 20%, money 25%, fitness 20%, life 15%)

### Quality Gate
Every scored domain has at least 2 metrics with actual data. INCOMPLETE domains
excluded from overall_grade calculation.

---

## Phase 3: Trend Comparison

### Entry Criteria
Current grades calculated. Prior scorecard available (or first week).

### Actions

1. For each domain, compare current grade to prior_scorecard grade:
   - UP: improved by 1+ letter grade
   - STABLE: same letter grade
   - DOWN: dropped by 1+ letter grade
   - NEW: no prior data for comparison

2. Calculate streaks: consecutive weeks at A or B in each domain. Longest
   streak gets highlighted.

3. Identify the biggest win (largest grade improvement) and biggest concern
   (largest grade drop) across all domains.

4. If 3+ weeks of scorecards exist, calculate trajectory: is the overall
   grade trending up, flat, or down over the window? Use simple linear
   regression on the numeric grade values (A=4 through F=0).

### Output
- trends: object mapping each domain to UP / STABLE / DOWN / NEW
- streaks: object mapping each domain to consecutive good-week count
- biggest_win: object with domain, old_grade, new_grade, reason
- biggest_concern: object with domain, old_grade, new_grade, reason
- trajectory: UP / FLAT / DOWN with slope value

### Quality Gate
Trends set to NEW for any domain without prior week data. Trajectory only
calculated with 3+ weeks of history; otherwise marked INSUFFICIENT_DATA.

---

## Phase 4: Action Items

### Entry Criteria
Grades and trends calculated.

### Actions

1. For each domain graded C or below, generate 1-2 specific action items.
   Action items must reference actual data, not generic advice:
   - BAD: "Improve your budget adherence"
   - GOOD: "Dining out was $340 vs $200 budget. Reduce by 3 meals out to close the gap."

2. For each domain trending DOWN, generate 1 recovery action even if current
   grade is B or above. Early intervention before the grade slips further.

3. For FITNESS domain specifically: if rest_days were 0 this week, add a
   mandatory rest action regardless of grade. Overtraining is invisible in
   weekly metrics until injury.

4. For VEHICLE domain: if any DTC is unresolved for 2+ weeks, escalate to
   HIGH priority action item with troubleshooter chain suggestion.

5. Sort all action items: HIGH priority first (grade F or unresolved issues),
   MEDIUM (grade D or downward trend), LOW (grade C, minor improvements).
   Cap at 7 items total. If more than 7, keep the 5 highest priority plus
   the 2 easiest quick wins.

### Output
- next_week_actions: array of action objects with priority, domain, action, metric_basis
- quick_wins: array of actions achievable in under 30 minutes
- high_priority_count: number of HIGH items

### Quality Gate
Every action item references a specific metric and number from Phase 1 data.
No generic advice. Total actions between 1 and 7.

---

## Phase 5: Scorecard Generation

### Entry Criteria
All prior phases complete.

### Actions

1. Compose the scorecard object:
   ```
   WEEKLY SCORECARD - Week ending {week_ending}

   OVERALL: {overall_grade}  Trend: {trajectory}

   VEHICLE  [{grade}] {trend_arrow}  {one-line summary}
   HOME     [{grade}] {trend_arrow}  {one-line summary}
   MONEY    [{grade}] {trend_arrow}  {one-line summary}
   FITNESS  [{grade}] {trend_arrow}  {one-line summary}
   LIFE     [{grade}] {trend_arrow}  {one-line summary}

   WIN OF THE WEEK: {biggest_win}
   WATCH:           {biggest_concern}

   NEXT WEEK (top 3):
   1. {action}
   2. {action}
   3. {action}
   ```

2. Trend arrows: UP = upward, STABLE = level, DOWN = downward, NEW = star.

3. One-line summaries use the most notable metric per domain:
   - VEHICLE: "{miles} mi driven, {mpg} avg mpg, health {grade}"
   - HOME: "{alerts} alerts, {tasks_done}/{tasks_due} tasks done"
   - MONEY: "{budget_variance}% vs budget, portfolio {change}%"
   - FITNESS: "{sessions} sessions, {prs} PRs, {rest} rest days"
   - LIFE: "{briefs}/7 briefings, {conflicts} conflicts"

4. Store the scorecard for retrieval by next week's trend comparison and
   by monthly-full-review chain.

### Output
- scorecard: formatted scorecard object
- grades: final grade map
- trends: final trend map
- next_week_actions: prioritized action list

### Quality Gate
Scorecard contains all 5 domain lines (INCOMPLETE domains shown with [-] grade).
Overall grade calculated from scored domains only. Stored for next week retrieval.

---


---

## Worked Example

Illustrative only.

Given typical inputs for End of week roll-up across vehicle, home, money, fitness, and life with grades p, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

Scorecard fully populated. All scored domains have letter grades. Trend
comparison complete (or marked NEW). Action items generated for any domain
graded C or below. Scorecard stored for future trend comparison.

## Error Handling

| Error                         | Severity | Response                                |
|-------------------------------|----------|-----------------------------------------|
| No flow data for target week  | HIGH     | Return error: "No flows ran this week. Run at least 2 domain flows first." |
| Only 1 domain has data        | MEDIUM   | Score that domain, mark others INCOMPLETE, warn about limited scorecard |
| Prior scorecard not found      | LOW      | Skip trend comparison, mark all trends NEW |
| Grade calculation tie          | LOW      | Round up (benefit of doubt)              |
| Metric data partially missing | LOW      | Score with available metrics, note in grade_details |

## State Persistence

| Key                    | Storage  | TTL    | Description                        |
|------------------------|----------|--------|------------------------------------|
| scorecard_latest       | persist  | 90d    | Most recent completed scorecard    |
| scorecard_history      | persist  | 365d   | Array of past scorecards for trends|
| grade_streaks          | persist  | 365d   | Per-domain consecutive good weeks  |

## Reference: Grade Point Conversion

| Letter | Points | Meaning                                   |
|--------|--------|-------------------------------------------|
| A      | 4.0    | Performing above targets across metrics    |
| B      | 3.0    | Meeting most targets, minor gaps           |
| C      | 2.0    | Below target in multiple metrics           |
| D      | 1.0    | Significant underperformance               |
| F      | 0.0    | Critical issues or no engagement           |

## Reference: Domain Weights for Overall Grade

| Domain   | Weight | Rationale                                 |
|----------|--------|-------------------------------------------|
| Vehicle  | 20%    | Safety and reliability                     |
| Home     | 20%    | Living environment stability               |
| Money    | 25%    | Financial health has widest downstream impact |
| Fitness  | 20%    | Physical capacity affects all other domains|
| Life     | 15%    | Meta-awareness and routine consistency     |

---

Copyright 2026 the governance provider Group. All rights reserved.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
