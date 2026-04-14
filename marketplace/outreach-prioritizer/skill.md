# Outreach Prioritizer

Takes the qualified, scored target list and builds the master outreach sequencing plan — who gets contacted in what order, through what channel, on what date, with what angle. Prevents simultaneous outreach to competitors. Accounts for warm path timing. Outputs a day-by-day campaign calendar across all targets.

**Why this exists:** Running 20 licensing conversations at once is impossible and counterproductive. This skill sequences them — who goes first, how long to run each before pivoting, when to trigger warm intros, and how to stagger across sectors so you're not burning through all your leverage at once.

**Core principle:** Lead with urgency, close with leverage. Contact the company with the most acute pain first. Stagger competitors — never let two companies in the same sector know you're talking to both simultaneously. Build pipeline so by the time target #1 closes, targets #2 and #3 are mid-conversation.

## Inputs

- `qualified_targets`: list[object] — Output from target-qualifier with all scores
- `a_list`: list[string] — Top priority targets
- `b_list`: list[string] — Secondary pipeline
- `licensor_capacity`: integer — How many active conversations can run in parallel (default 3)
- `campaign_start_date`: string — ISO date to begin outreach
- `sector_stagger`: boolean — If true, never contact two direct competitors simultaneously (default true)
- `warm_path_lead_time_days`: integer — Days before main outreach to activate warm intro (default 7)

## Outputs

- `master_sequence`: list[object] — Every target in order with start date: `{rank, company, start_date, entry_channel, entry_contact, angle, warm_path_activation_date, sector, notes}`
- `active_pipeline_calendar`: object — Week-by-week view of what's active, what's warming, what's closing
- `sector_map`: object — Which companies per sector, staggered so no two competitors are in active outreach simultaneously
- `trigger_events`: list[object] — External events that should accelerate specific targets: regulatory deadlines, earnings calls, industry conferences
- `campaign_dashboard`: string — One-page markdown showing the full 90-day campaign at a glance

---

## Execution

### Phase 1: SEQUENCING LOGIC

**Build the master sequence using these rules in order:**

**Rule 1 — Urgency first.** The highest urgency_score company goes first regardless of other factors. If their regulatory clock is running, every day of delay costs leverage.

**Rule 2 — Stagger competitors.** If two companies are direct competitors (same sector, overlapping market), minimum 30-day gap between outreach starts. Reason: the moment both know you're talking to both, each will use it as a reason to delay — "let's see what they do." You want each target to feel like they're getting first-mover advantage.

**Rule 3 — Warm paths go first within a sector.** If an A-List target has a STRONG warm intro available, they jump to the top of their sector queue — warm outreach is 3-5x more effective and sets the tone for the sector.

**Rule 4 — Capacity constraint.** Never run more than `licensor_capacity` active first-touch sequences simultaneously. An "active" sequence is Day 1 through Day 22 (the 5-touch follow-up window). After Day 22, the target moves to "monitoring" status and a new target can be activated.

**Rule 5 — Trigger event alignment.** If a target has a major conference, earnings call, or regulatory deadline in the next 60 days, align their outreach start so touch 3-4 lands in the 2-week window before the event.

**Output:** `master_sequence`

---

### Phase 2: CALENDAR ASSEMBLY

**Build the week-by-week active pipeline calendar:**

For each week in the 90-day campaign:
- Which targets are in active first-touch sequence (Days 1-22)
- Which targets are in warm-up (warm intro being activated, not yet cold outreach)
- Which targets have responded (positive/neutral/negative) and what's next
- Which targets are entering the sequence this week

**Format:**
```
Week 1 (Apr 14-20):
  ACTIVE:   Coalition Insurance (Day 1 — first email to GC)
  WARMING:  Beazley (warm intro activated via [connector])
  QUEUED:   Travelers, Markel (next to enter)

Week 2 (Apr 21-27):
  ACTIVE:   Coalition Insurance (Day 5 — Touch 2), Beazley (Day 1 if intro landed)
  WARMING:  [Next sector target]
  QUEUED:   ...
```

**Output:** `active_pipeline_calendar`

---

### Phase 3: TRIGGER EVENT MAPPING

For each A-List target, identify external events that create natural outreach windows:

**Regulatory events:**
- EU AI Act enforcement dates
- NAIC model bulletin adoption by new states
- FDA guidance updates on adaptive algorithms
- NHTSA AV safety rule updates

**Company events:**
- Earnings calls (public companies mention AI governance in 10-K = hot signal)
- Series funding rounds (investors do IP diligence = they surface the gap)
- M&A announcements (acquirer does IP audit = gap becomes visible)
- Leadership changes (new GC or CRO = fresh eyes, no legacy position)
- Product launches featuring adaptive AI (= public acknowledgment of the system)

**Industry events:**
- InsureTech Connect (insurance targets)
- RSA Conference (cyber targets)
- NeurIPS / ICML (AI research community — adjacent credibility)
- CES (autonomous vehicles, robotics)
- HLTH / HIMSS (medical AI)

For each trigger event, note: which targets it affects, the optimal outreach timing relative to the event (7-14 days before = optimal), and the outreach angle it enables.

**Output:** `trigger_events`

---

### Phase 4: CAMPAIGN DASHBOARD

Compile the full 90-day view into a single dashboard:

```
IP LICENSING DIRECTED SEARCH CAMPAIGN
Licensor: Northstar Systems Group
Families: A (NeuroPRIN), B (ALG)
Campaign Start: [date]
Active Capacity: [N] simultaneous conversations

A-LIST TARGETS (immediate):
Rank | Company          | Sector          | Score | Start Date | Entry      | Warm Path
  1  | Coalition Ins.   | Cyber Insurance | 8.7   | Apr 14     | GC email   | GV overlap (check)
  2  | [Company 2]      | [Sector]        | 8.2   | Apr 21     | LinkedIn   | STRONG via [name]
  3  | [Company 3]      | [Sector]        | 7.9   | Apr 28     | GC email   | None — cold
  ...

B-LIST PIPELINE (90-day):
  [Companies 6-20 with start dates]

KEY TRIGGER EVENTS:
  Apr 28: EU AI Act compliance window opens for high-risk AI → accelerate [Company X]
  May 15: InsureTech Connect — Motta speaking → Touch 6 window
  Jun 1:  NAIC adoption expected in 3 more states → urgency refresh for all insurance targets

SECTOR STAGGER MAP:
  Cyber Insurance: Coalition (active) → Beazley (May) → Brit (June)
  Autonomous Vehicles: [Company] (May) → [Company] (June)
  Medical AI: [Company] (June)

PIPELINE STATUS:
  Active conversations: [N]
  Responses received: [N]
  Meetings booked: [N]
  Term sheets: [N]
```

**Output:** `campaign_dashboard`

---

## Exit Criteria

Done when:
1. Every A-List target has a start date, entry channel, and entry contact assigned
2. No two direct competitors have overlapping active outreach windows (sector_stagger = true)
3. Warm path activation dates set 7 days before first touch for all STRONG paths
4. Trigger events mapped to specific targets with optimal timing windows
5. 90-day calendar shows week-by-week active pipeline
6. Campaign dashboard is complete and ready for execution

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
