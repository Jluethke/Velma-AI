# Morning Brief

Daily intelligence briefing. Aggregates weather, vehicle readiness, home status,
financial snapshot, calendar conflicts, and fitness goals into a single readout
delivered in under 90 seconds of reading time. Designed to answer one question:
"What do I need to know before I leave the house?"

```
GATHER --> WEATHER --> FINANCE --> CALENDAR --> COMPILE
CONTEXT    IMPACT     SNAPSHOT    REVIEW      BRIEFING
```

## Inputs

| Field                  | Type   | Required | Description                          |
|------------------------|--------|----------|--------------------------------------|
| location               | string | yes      | City or ZIP for weather lookup       |
| commute_distance_miles | number | yes      | One-way commute in miles             |
| calendar_source        | string | no       | Calendar provider (google, outlook, apple, manual) |
| wake_time              | string | no       | HH:MM local time, defaults to now   |
| vehicle_year           | number | no       | Model year for tire pressure thresholds |
- `location:string`: (from manifest)
- `commute_distance_miles:number`: (from manifest)
- `calendar_source:string`: (from manifest)

## Outputs

| Field          | Type   | Description                                    |
|----------------|--------|------------------------------------------------|
| briefing       | object | Structured briefing with per-domain sections   |
| action_items   | array  | Prioritized list of things requiring attention  |
| alert_level    | string | GREEN / YELLOW / RED overall day rating         |
| read_time_sec  | number | Estimated seconds to consume the briefing       |

---
- `briefing:object`: (from manifest)
- `action_items:array`: (from manifest)
- `alert_level:string`: (from manifest)

## Phase 1: Gather Context

### Entry Criteria
Location provided. Current date and time known.

### Actions

1. Pull current weather conditions for the provided location: temperature (F),
   humidity (%), wind speed (mph), precipitation probability (%), visibility
   (miles), and UV index.
2. Pull 12-hour forecast at 3-hour intervals. Flag any period where precipitation
   probability exceeds 40% or temperature drops below 32F.
3. Check vehicle state from last known scan. If vehicle-health ran in the past
   7 days, pull its health_grade. If pre-drive-check ran in the past 24 hours,
   pull its go_nogo status. Otherwise mark vehicle_state as UNKNOWN.
4. Check home-status last run. If within 48 hours, pull device_alerts and
   anomaly_count. Otherwise mark home_state as STALE.
5. Collect any pending maintenance items from maintenance-schedule (vehicle)
   and home-maintenance (house) that fall within the next 7 days.

### Output
- weather_current: object with temp_f, humidity_pct, wind_mph, precip_pct, visibility_mi, uv_index
- forecast_12h: array of 4 forecast objects at 3-hour intervals
- vehicle_state: GOOD / CAUTION / UNKNOWN with last_scan_date
- home_state: CLEAR / ALERT / STALE with anomaly_count
- upcoming_maintenance: array of items due within 7 days

### Quality Gate
All five data domains attempted. Any domain that fails returns a STALE marker
rather than blocking the briefing. At least weather_current must succeed.

---

## Phase 2: Weather Impact Analysis

### Entry Criteria
weather_current and forecast_12h populated.

### Actions

1. Calculate commute weather impact using this matrix:

   | Condition              | Impact   | Commute Adjustment |
   |------------------------|----------|--------------------|
   | Clear, visibility > 5  | NONE     | +0 min             |
   | Rain < 50%             | LOW      | +5 min             |
   | Rain >= 50%            | MODERATE | +10-15 min         |
   | Snow/ice               | HIGH     | +15-30 min         |
   | Fog, visibility < 1 mi | HIGH     | +10-20 min         |
   | Wind > 40 mph          | MODERATE | +5-10 min          |

2. Calculate home weather impact: if temp drops below 32F, flag pipe freeze risk.
   If wind exceeds 50 mph, flag exterior damage risk. If precipitation exceeds
   1 inch forecast, flag flooding risk for basements and low-grade lots.
3. Calculate vehicle weather impact: if temp below 20F, flag battery stress
   (lead-acid CCA drops ~35% at 0F). If temp above 95F, flag coolant load.
   If road salt likely (snow + temp 15-35F), flag undercarriage corrosion window.
4. Produce a departure_recommendation: LEAVE EARLY (impact HIGH), NORMAL
   (impact LOW/NONE), or DELAY (severe weather in next 2 hours clearing later).

### Output
- commute_impact: object with level, extra_minutes, reason
- home_weather_risks: array of risk objects (type, severity, action)
- vehicle_weather_risks: array of risk objects
- departure_recommendation: LEAVE EARLY / NORMAL / DELAY with reason

### Quality Gate
Impact levels derived from actual forecast numbers, not defaults. If weather
data was STALE, skip this phase and mark weather_impact as UNAVAILABLE.

---

## Phase 3: Financial Snapshot

### Entry Criteria
Phase 1 complete.

### Actions

1. Pull portfolio-check last run data if within 48 hours. Extract: total value,
   day change percentage, any position with > 3% single-day move.
2. Pull market-brief last run data if within 24 hours. Extract: S&P 500 change,
   10Y Treasury yield, any sector with > 2% move.
3. Check budget-builder current month status if available. Extract: spending
   vs budget percentage, largest overspend category, days remaining in month.
4. Check for bills due today or within 3 days. Cross-reference with
   subscription-audit if available for recurring charge awareness.
5. Calculate a financial_pulse: GREEN (spending on track, markets normal),
   YELLOW (overspending or notable market move), RED (significant market event
   or missed payment risk).

### Output
- portfolio_snapshot: object with total_value, day_change_pct, movers array
- market_snapshot: object with sp500_change, treasury_10y, sector_movers
- budget_status: object with spent_pct, top_overspend, days_remaining
- bills_due: array of upcoming bills within 3 days
- financial_pulse: GREEN / YELLOW / RED with reason

### Quality Gate
At least one financial data source returned data. Missing sources produce
null fields, not errors. financial_pulse defaults to GREEN if no data available
(absence of data is not a crisis).

---

## Phase 4: Calendar and Task Review

### Entry Criteria
Phase 1 complete. Calendar source identified or manual mode.

### Actions

1. If calendar_source is provided, pull today's events. For each event extract:
   title, start_time, end_time, location (if any), attendees count.
2. Identify scheduling conflicts: overlapping events, back-to-back meetings
   with different locations (flag travel time needed), meetings starting before
   commute arrival time.
3. Pull fitness goals for today from workout-log or fitness-progress last run.
   What was planned: rest day, cardio, strength, specific muscle group.
4. Compile pending action items from any flow that ran in the past 48 hours
   and produced unresolved items: troubleshooter open issues, home-status
   alerts not addressed, maintenance items past due.
5. Rank all items by urgency: OVERDUE (past due date), TODAY (due today),
   UPCOMING (due within 3 days), BACKGROUND (informational).

### Output
- today_events: array of calendar event objects
- conflicts: array of scheduling conflict objects with resolution suggestions
- fitness_plan: object with today's planned activity or REST
- pending_actions: array ranked by urgency tier
- busiest_hour: string HH:MM identifying the most packed part of the day

### Quality Gate
Calendar events sorted chronologically. Conflicts detected if any overlapping
windows exist. Manual mode returns empty events array (valid state).

---

## Phase 5: Briefing Compilation

### Entry Criteria
Phases 2-4 complete (or marked UNAVAILABLE where data missing).

### Actions

1. Set overall alert_level using the highest severity across all domains:
   - RED if any domain is RED or any OVERDUE action items exist
   - YELLOW if any domain is YELLOW or vehicle/home state is UNKNOWN/STALE
   - GREEN if all domains GREEN and no outstanding issues
2. Compose the briefing object with these sections in order:
   a. HEADLINE: one sentence summary. Example: "Clear morning, markets flat,
      oil change due Thursday, leg day."
   b. WEATHER: departure_recommendation + commute_impact + risks
   c. VEHICLE: state + any weather risks + nearest maintenance due
   d. HOME: state + any weather risks + device alerts
   e. MONEY: financial_pulse + notable movers + bills due
   f. CALENDAR: event count + first event time + conflicts
   g. FITNESS: today's plan
   h. ACTION ITEMS: sorted by urgency, max 5 items
3. Calculate read_time_sec: count words in briefing, divide by 4 (words per
   second at comfortable reading pace). Target under 90 seconds.
4. If read_time exceeds 90 seconds, trim MONEY and CALENDAR sections to
   one line each and recalculate.
5. Store briefing with timestamp for retrieval by other flows (weekly-scorecard,
   evening-shutdown chain).

### Output
- briefing: complete structured object with all sections
- action_items: flattened prioritized array
- alert_level: GREEN / YELLOW / RED
- read_time_sec: integer

### Quality Gate
Briefing contains all 8 sections (some may be "No data available").
read_time_sec is at or below 90. alert_level matches the actual highest
severity found across domains.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Daily intelligence briefing aggregating weather, vehicle, home, finance, calenda, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

Briefing object fully populated. alert_level set. action_items array present
(may be empty). read_time_sec calculated and within 90-second target.

## Error Handling

| Error                         | Severity | Response                                |
|-------------------------------|----------|-----------------------------------------|
| Weather API unreachable       | MEDIUM   | Mark weather UNAVAILABLE, skip Phase 2  |
| No recent vehicle-health data | LOW      | Vehicle section shows UNKNOWN state     |
| No recent home-status data    | LOW      | Home section shows STALE state          |
| Calendar auth failure         | LOW      | Calendar section shows manual mode      |
| No financial data available   | LOW      | Money section shows "No recent data"    |
| All data sources fail         | HIGH     | Return minimal briefing: date, time, "No data sources available. Run individual flows first." |

## State Persistence

| Key                    | Storage  | TTL    | Description                        |
|------------------------|----------|--------|------------------------------------|
| morning_brief_latest   | session  | 24h    | Most recent compiled briefing      |
| morning_brief_streak   | persist  | 90d    | Consecutive days briefing was run  |
| domain_freshness       | session  | 12h    | Last-run timestamps per domain     |

## Reference: Domain Freshness Thresholds

| Domain           | Fresh     | Stale     | Source Flow        |
|------------------|-----------|-----------|--------------------|
| Vehicle health   | < 7 days  | >= 7 days | vehicle-health     |
| Vehicle pre-drive| < 24 hours| >= 24 hrs | pre-drive-check    |
| Home status      | < 48 hours| >= 48 hrs | home-status        |
| Portfolio        | < 48 hours| >= 48 hrs | portfolio-check    |
| Market data      | < 24 hours| >= 24 hrs | market-brief       |
| Budget           | < 30 days | >= 30 days| budget-builder     |
| Fitness          | < 7 days  | >= 7 days | workout-log        |
| Maintenance (car)| < 30 days | >= 30 days| maintenance-schedule|
| Maintenance (home)| < 30 days| >= 30 days| home-maintenance   |

---

Copyright 2026 the governance provider Group. All rights reserved.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
