# Example: Knowledge Worker Daily Plan

## Input
```
calendar_events: [
  { "title": "Team standup", "start": "9:30", "end": "9:45" },
  { "title": "Client call", "start": "14:00", "end": "15:00" }
]
task_list: [
  { "task": "Write Q2 strategy doc", "estimate": "3h", "category": "deep_work" },
  { "task": "Review 2 pull requests", "estimate": "45m", "category": "admin" },
  { "task": "Reply to vendor emails", "estimate": "20m", "category": "communication" },
  { "task": "Fix login bug (due today)", "estimate": "1.5h", "category": "deep_work" },
  { "task": "Update team wiki", "estimate": "30m", "category": "admin" },
  { "task": "Research competitor feature", "estimate": "1h", "category": "deep_work" },
  { "task": "Book travel for conference", "estimate": "15m", "category": "admin" },
  { "task": "Scroll industry news", "estimate": "30m", "category": "reading" }
]
energy_profile: { "peak": "8:00-11:30", "moderate": "13:00-16:00", "trough": "11:30-13:00, 16:00-17:30" }
goals: ["Ship v2.0 by April 15", "Build client relationships", "Reduce tech debt"]
deadlines: [{ "task": "Fix login bug", "due": "today", "consequence": "Blocking 3 users" }]
```

## OBSERVE Output
Available time: 7.25 hours (8:00-17:30 minus meetings minus lunch)
Adjusted task durations (1.3x multiplier): Strategy doc 3h54m, PRs 58m, emails 26m, login bug 1h57m, wiki 39m, research 1h18m, travel 20m, news 39m.
Total adjusted: ~10h12m vs 7h15m available = **41% overcommitted**.
Energy map: Peak 8:00-9:30 + 9:45-11:30 (3h15m). Moderate 13:00-14:00 + 15:00-16:00 (2h). Trough 11:30-13:00 + 16:00-17:30 (3h).

## REASON Output
| Task | Quadrant | Cognitive Load | Energy Slot |
|---|---|---|---|
| Fix login bug | Q1 (Urgent+Important) | Deep | Peak |
| Write Q2 strategy doc | Q2 (Important) | Deep | Peak |
| Review PRs | Q2 (Important) | Moderate | Moderate |
| Research competitor | Q2 (Important) | Deep | Moderate |
| Reply to emails | Q3 (Urgent, not important) | Light | Trough |
| Update wiki | Q3 | Light | Trough |
| Book travel | Q3 | Light | Trough |
| Scroll industry news | Q4 (Neither) | Light | **ELIMINATE** |

**Top 3 Priorities:**
1. Fix login bug -- Q1, due today, blocking 3 users
2. Write Q2 strategy doc -- Q2, advances "Ship v2.0" goal, needs deep focus
3. Review PRs -- Q2, advances "Reduce tech debt," unblocks teammates

**Resolution:** Eliminate "scroll industry news" (Q4). Defer "research competitor" to tomorrow (Q2 but lowest priority today). Saves ~2h, bringing total to ~8h -- tight but feasible with buffers.

## PLAN Output: Time-Blocked Schedule

| Time | Block | Task | Notes |
|---|---|---|---|
| 8:00-8:10 | Startup | Review schedule, set intentions | |
| 8:10-10:00 | Deep Work 1 | Fix login bug (1h57m adjusted) | Peak energy, Q1 priority |
| 10:00-10:10 | Buffer | Transition | |
| 10:10-10:15 | Break | Stand, water | |
| 10:15-11:30 | Deep Work 2 | Q2 strategy doc (1h15m chunk 1) | Peak energy, Q2 priority |
| 11:30-12:00 | Admin Batch | Emails (26m) + book travel (20m) | Trough energy, batch Q3 |
| 12:00-13:00 | Lunch | Break | |
| 13:00-14:00 | Moderate Work | Review 2 PRs (58m) | Moderate energy |
| 14:00-15:00 | Meeting | Client call | Fixed |
| 15:00-15:10 | Buffer | Post-meeting notes | |
| 15:10-16:00 | Deep Work 3 | Q2 strategy doc (50m chunk 2) | Moderate slot, continuing started work |
| 16:00-16:30 | Admin | Update team wiki (39m adjusted, do 30m) | Trough energy |
| 16:30-16:40 | Buffer | Overflow | |
| 16:40-17:00 | Evening Review | Reflect + plan tomorrow | |

**Note:** 9:30-9:45 team standup fits naturally as a break from the login bug work.

## ACT Output

### Top 3 Priorities
1. **Fix login bug** -- Due today, 3 users blocked. This is the only Q1 item. If nothing else gets done, this must ship.
2. **Write Q2 strategy doc** -- Split across two blocks (1h15m + 50m = 2h05m of the 3h54m adjusted estimate). You will NOT finish today. Goal: complete the outline and first two sections. Finish tomorrow.
3. **Review PRs** -- Unblocks two teammates. Scheduled post-lunch when energy is moderate but sufficient for code review.

### Evening Review Prompts
- Did you ship the login bug fix? If not, what blocked you?
- How far did the strategy doc get? Is the remaining scope clear for tomorrow?
- Did the PRs get reviewed? Any follow-up needed?
- Was your energy profile accurate? Did you actually peak 8-11:30?
- The competitor research was deferred -- schedule it for tomorrow or delegate it.
