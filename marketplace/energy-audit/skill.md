# Energy Audit

> **Starter Skill** -- Free to use. Royalties to original creator on derivatives. Build on this.

Track where your energy goes, not just your time. Time management is a lie -- you can have 4 free hours and waste them all if your energy is depleted. This skill walks you through mapping what gives you energy vs. what drains you, then identifies the mismatches: things you spend lots of time on that drain you, things that energize you that you never make time for. You leave with a restructured week that optimizes for energy, not just hours.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Map your week. Every activity. No judgment yet.
REASON  --> Score each activity: does it give energy or take it?
PLAN    --> Find the mismatches. Redesign the week around energy.
ACT     --> You commit to one swap and one protection this week.
     \                                                              /
      +--- Re-audit in 2 weeks? --- loop OBSERVE -------------------+
```

## Inputs

- `typical_week`: string -- Walk through a typical week. What fills your days? Work, personal, everything.
- `energy_complaint`: string -- What feels off? "I'm always tired." "I have time but no motivation." "Some days I'm on fire, other days I can't focus."
- `non_negotiables`: list[string] -- Things you can't change right now (job hours, childcare, health constraints). We work around these.

## Outputs

- `energy_map`: object -- Every activity scored by energy impact: charges you, neutral, or drains you.
- `mismatch_report`: array -- Time-vs-energy mismatches (high time + drain, low time + charge).
- `energy_schedule`: object -- A restructured week that puts high-energy activities in peak windows and protects recovery time.
- `one_swap`: object -- The single highest-impact change: one drain to reduce, one charge to add.

---

## Execution

### OBSERVE: Map the Week

**Actions:**

1. **Walk through the week.** Ask: "Take me through a typical week, day by day. Not the ideal week -- the ACTUAL week. What do you do from when you wake up to when you sleep? Include work, commute, chores, scrolling, everything. Especially the things you think don't count." The "doesn't count" stuff is usually where the energy leaks live. Twenty minutes of doomscrolling doesn't show up on any to-do list, but it costs more energy than most tasks.

2. **Categorize every activity.** Group into buckets:
   - **Work:** meetings, deep work, email, admin, commute
   - **Maintenance:** cooking, cleaning, errands, health appointments, bills
   - **Relationships:** time with partner, kids, friends, family, social events
   - **Growth:** learning, reading, exercise, therapy, creative projects
   - **Recovery:** sleep, rest, entertainment, hobbies, doing nothing
   - **Leaks:** scrolling, procrastination patterns, things you do on autopilot that serve nothing

3. **Estimate hours per week per category.** Ask: "Roughly how many hours per week go to each of these? Don't overthink it -- estimates are fine. We're looking for the big picture, not the minutes." Total the hours. If they add up to significantly more than waking hours, something is double-counted. If they add up to significantly less, something is being hidden or forgotten.

4. **Find the hidden hours.** Ask: "Where does time disappear? What do you start doing and then look up and an hour has passed? What activity is a black hole for your time that you don't plan for?" These are usually the biggest energy drains because they combine time loss with the frustration of time loss.

**Quality gate:** A full week is mapped with approximate hours per category. At least one "leak" activity is identified. Total hours are roughly plausible.

---

### REASON: Score the Energy

**Actions:**

1. **Score every activity.** For each regular activity, ask: "After you do this, do you have MORE energy than before, LESS energy, or about the same? Not during -- after. Some things are hard in the moment but leave you energized. Some things feel easy but leave you depleted."
   - **+2:** Actively energizing. You feel better after.
   - **+1:** Mildly energizing. Slight lift.
   - **0:** Neutral. No noticeable impact.
   - **-1:** Mildly draining. Slight dip.
   - **-2:** Actively depleting. You need to recover from this.

2. **Find the surprises.** Ask: "Any scores surprise you? Things you assumed would be draining that are actually energizing, or things you thought you enjoyed that are actually costing you?" Common surprises: exercise scores positive (people think of the effort, not the afterglow). Certain friendships score negative (obligation disguised as connection). "Relaxing" activities score negative (passive consumption drains more than it restores).

3. **Map the peaks and valleys.** Ask: "When during the day do you have the most energy? When do you crash? Is there a pattern?" Most people have a 2-4 hour peak window (usually morning) and a valley (usually early afternoon). The question is whether their high-energy activities are scheduled during peaks or wasted in valleys.

4. **Calculate the mismatch score.** For each activity: `hours_per_week * energy_score`. This reveals the true cost. A -2 activity you do for 10 hours a week is costing you -20 energy points. A +2 activity you do for 1 hour is only giving you +2. The math often reveals that one or two activities are responsible for most of the drain.

5. **The obligation audit.** Ask: "Which of the draining activities are you doing because you HAVE to, and which are you doing because you feel like you SHOULD? There's a difference. 'Have to' means real consequences if you stop. 'Should' means guilt if you stop. Guilt is not a reason."

**Quality gate:** Every regular activity has an energy score. Peak/valley pattern is identified. At least one mismatch (high hours + negative energy) is found. Obligation vs. choice is distinguished.

---

### PLAN: Redesign for Energy

**Actions:**

1. **Identify the top 3 drains.** Sort by `hours * negative_score`. Ask: "These are your biggest energy costs. For each one: can you eliminate it, reduce it, delegate it, or reframe it?" Reframing means changing HOW you do it (e.g., walking meetings instead of sitting meetings, batch-processing email instead of constant checking).

2. **Identify the underused charges.** Sort by positive energy score. Ask: "These are the things that charge your battery, but you're barely doing them. What's stopping you from doing more? Time? Permission? Guilt about 'wasting time' on something that makes you feel good?"

3. **Design the energy-optimized day.** Work with their peak/valley pattern:
   - **Peak hours:** Schedule highest-value, most energizing work here. Protect ruthlessly. No meetings, no email, no admin during peak unless it's peak-positive work.
   - **Valley hours:** Schedule low-energy-cost tasks: admin, email, routine maintenance. This is where drains do the least damage.
   - **Recovery windows:** Build in deliberate recovery before and after high-drain activities. Even 15 minutes of intentional recovery changes the equation.
   - **Charge stations:** Schedule at least one energizing activity per day. Not as a reward -- as fuel.

4. **Design the energy-optimized week.** Ask: "Are there days that are consistently more draining than others? Can you front-load drains early in the week and protect energy toward the end? Or vice versa -- whatever pattern works for your recovery rhythm?"

5. **Set boundaries.** Ask: "What's one thing you need to say NO to this week to protect your energy? And what's one thing you need to say YES to that you keep denying yourself?"

**Quality gate:** Top 3 drains have a plan (eliminate, reduce, delegate, or reframe). At least one charge activity is being expanded. Daily peak/valley structure is designed. One no and one yes are committed.

---

### ACT: One Swap, One Protection

**Actions:**

1. **The swap.** Ask: "This week, what's the one drain you're going to reduce or eliminate, and what's the one charge you're going to add or expand? Don't overhaul your whole life. One swap." The swap should be specific: "I'm replacing the 45-minute post-lunch scroll with a 20-minute walk" -- not "I'm going to be more intentional."

2. **The protection.** Ask: "What's the one energy boundary you're going to enforce this week? The meeting you'll decline, the request you'll push back on, the commitment you'll renegotiate?" Energy protection requires active defense. If you don't decide what to protect, your calendar will decide for you.

3. **The tracking prompt.** Say: "At the end of each day this week, take 30 seconds and ask yourself: 'What gave me energy today? What took it?' Just notice. Don't judge. After a week of noticing, you'll have real data instead of assumptions."

4. **The re-audit.** Say: "In 2 weeks, do this again. Your energy map will have shifted. Some things you thought were draining will turn out to be fine once they're in the right time slot. Some charges will have worn off. The map is alive -- it needs updating."

**Output:** Energy map with scores, mismatch report, restructured schedule, one swap + one protection for this week, 2-week re-audit date.

## Exit Criteria

Done when: (1) full week is mapped with energy scores, (2) mismatches are quantified, (3) peak/valley pattern is identified, (4) one swap and one protection are committed, (5) tracking prompt is set.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | User can't remember their typical week | Ask: "Open your calendar for last week. Walk me through what actually happened, day by day." Real data beats memory. |
| REASON | Everything scores negative | Ask: "When was the last time you felt genuinely energized? What were you doing? Even if it was months ago." Find the signal in the noise. |
| REASON | User scores everything as "fine" / neutral | Push: "Imagine doing this activity for 8 hours straight. Still neutral? What would shift?" Extremes reveal truth. |
| PLAN | User says they can't change anything | Challenge one thing: "If I told you that you had to cut 3 hours from your week or face a consequence -- what would you cut? That's your answer." |
| ACT | User makes the swap too ambitious | Scale down: "That's a great target for month 2. For this week, what's the smallest version of that swap?" |
| ACT | User rejects final output | Targeted revision -- ask which section felt off (energy scores, mismatch analysis, redesigned schedule, or the swap recommendation) and rerun only that section with different framing. |

## Reference

### Energy Scoring Formula

For each activity: `weekly_hours × energy_score = energy_cost`

| Score | Meaning | Weekly Example |
|---|---|---|
| +2 | Actively energizing (you feel better after) | 5 hrs × +2 = +10 |
| +1 | Mildly energizing | 10 hrs × +1 = +10 |
| 0 | Neutral, no noticeable impact | any hours × 0 = 0 |
| -1 | Mildly draining | 10 hrs × -1 = -10 |
| -2 | Actively depleting (need recovery after) | 5 hrs × -2 = -10 |

Activities with the largest negative products are the highest-leverage targets for change.

### Activity Category Reference

| Category | Examples | Common Energy Pattern |
|---|---|---|
| Work — deep focus | Writing, designing, coding, analysis | +1 to +2 when matched to peak hours |
| Work — admin | Email, scheduling, approvals | -1 to 0; do in valley hours |
| Work — meetings | Recurring standups, status updates | -1 to -2 if unstructured |
| Maintenance | Cooking, cleaning, errands | 0 to -1 |
| Relationships | Quality time with people you enjoy | +1 to +2 |
| Relationships (obligatory) | Events you attend from guilt | -1 to -2 |
| Exercise | Most forms post-workout | +1 to +2 (effort during, energy after) |
| Passive consumption | TV, social media scroll | -1 to -2 (often mistaken for recovery) |
| Active recovery | Walk, meditation, reading for pleasure | +1 to +2 |

### Peak/Valley Chronotype Guide

| Chronotype | Peak Window | Valley Window | Best Use of Peak |
|---|---|---|---|
| Morning (most common) | 8 AM – 12 PM | 1 PM – 3 PM | Deep creative or analytical work |
| Midday | 10 AM – 2 PM | 3 PM – 5 PM | Long-form projects, complex decisions |
| Evening | 4 PM – 9 PM | 10 AM – 12 PM | Creative work, learning, writing |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
