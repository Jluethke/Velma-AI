# Example: Community Workshop Resource Allocation

## Input
```
resources: [
  { "name": "Workshop space", "available": "160 hours/month", "unit": "hours" },
  { "name": "Instructor time", "available": "80 hours/month", "unit": "hours" },
  { "name": "Materials budget", "available": "$3000/month", "unit": "dollars" },
  { "name": "Equipment (3D printers)", "available": "120 hours/month", "unit": "hours" }
]
needs: [
  { "name": "Youth coding classes", "per_session": { "space": 4, "instructor": 4, "budget": 50, "equipment": 0 }, "sessions_requested": 12, "value_score": 9 },
  { "name": "Adult maker workshops", "per_session": { "space": 6, "instructor": 3, "budget": 200, "equipment": 8 }, "sessions_requested": 8, "value_score": 7 },
  { "name": "Community repair cafe", "per_session": { "space": 4, "instructor": 2, "budget": 30, "equipment": 2 }, "sessions_requested": 8, "value_score": 8 },
  { "name": "Open lab hours", "per_session": { "space": 8, "instructor": 1, "budget": 20, "equipment": 4 }, "sessions_requested": 12, "value_score": 5 },
  { "name": "Small business prototyping", "per_session": { "space": 4, "instructor": 2, "budget": 300, "equipment": 10 }, "sessions_requested": 6, "value_score": 6 }
]
constraints: ["Youth programs must run at least 8 sessions (grant requirement)", "Space cannot exceed 160 hrs", "3D printers need 2hr maintenance block per week (8 hrs/month unavailable)"]
optimization_goal: "Maximize community impact while meeting grant requirements"
```

## OBSERVE Output

**Resource consumption matrix (per session):**
| Need | Space (hrs) | Instructor (hrs) | Budget ($) | Equipment (hrs) |
|---|---|---|---|---|
| Youth coding | 4 | 4 | 50 | 0 |
| Maker workshops | 6 | 3 | 200 | 8 |
| Repair cafe | 4 | 2 | 30 | 2 |
| Open lab | 8 | 1 | 20 | 4 |
| Biz prototyping | 4 | 2 | 300 | 10 |

**Total demand (if all requests fulfilled):**
| Resource | Available | Total Demand | Status |
|---|---|---|---|
| Space | 160 hrs | 208 hrs | OVERSUBSCRIBED (130%) |
| Instructor | 80 hrs | 90 hrs | OVERSUBSCRIBED (112%) |
| Budget | $3000 | $3,060 | OVERSUBSCRIBED (102%) |
| Equipment | 112 hrs (120-8 maintenance) | 108 hrs | Feasible (96%) |

**Conclusion:** Cannot fulfill all requests. Space is the primary bottleneck.

## REASON Output

**Bottleneck: Workshop Space (130% oversubscribed)**

**Value per space-hour (impact score / space hours per session):**
| Need | Impact/Space-hr | Rank |
|---|---|---|
| Youth coding | 9/4 = 2.25 | 1 |
| Repair cafe | 8/4 = 2.00 | 2 |
| Biz prototyping | 6/4 = 1.50 | 3 |
| Maker workshops | 7/6 = 1.17 | 4 |
| Open lab | 5/8 = 0.63 | 5 |

Open lab hours are by far the least space-efficient program.

## PLAN Output

**Allocation (greedy by value per bottleneck unit, respecting constraints):**

| Need | Requested | Allocated | Space Used | Instructor | Budget | Equipment |
|---|---|---|---|---|---|---|
| Youth coding | 12 | 10 | 40 hrs | 40 hrs | $500 | 0 |
| Repair cafe | 8 | 8 | 32 hrs | 16 hrs | $240 | 16 hrs |
| Biz prototyping | 6 | 4 | 16 hrs | 8 hrs | $1,200 | 40 hrs |
| Maker workshops | 8 | 6 | 36 hrs | 18 hrs | $1,200 | 48 hrs |
| Open lab | 12 | 4 | 32 hrs | 4 hrs | $80 | 16 hrs |
| **Totals** | **46** | **32** | **156/160** | **86/80** | **$3,220/$3,000** | **120/112** |

**Problem:** Instructor (86 > 80) and budget ($3,220 > $3,000) are now oversubscribed.

**Adjustment:** Reduce biz prototyping to 3 sessions (saves $300 budget + 2 instructor hrs) and reduce youth coding to 9 sessions (saves 4 instructor hrs). Youth still exceeds 8-session grant minimum.

**Final allocation:**
| Need | Sessions | Space | Instructor | Budget | Equipment |
|---|---|---|---|---|---|
| Youth coding | 9 | 36 | 36 | $450 | 0 |
| Repair cafe | 8 | 32 | 16 | $240 | 16 |
| Biz prototyping | 3 | 12 | 6 | $900 | 30 |
| Maker workshops | 6 | 36 | 18 | $1,200 | 48 |
| Open lab | 4 | 32 | 4 | $80 | 16 |
| **Totals** | **30** | **148/160** | **80/80** | **$2,870/$3,000** | **110/112** |

All constraints satisfied. Remaining slack: 12 space-hrs, $130 budget, 2 equipment-hrs.

## ACT Output

**Utilization Dashboard:**
| Resource | Available | Allocated | Utilization |
|---|---|---|---|
| Space | 160 hrs | 148 hrs | 92.5% |
| Instructor | 80 hrs | 80 hrs | 100% (binding) |
| Budget | $3,000 | $2,870 | 95.7% |
| Equipment | 112 hrs | 110 hrs | 98.2% |

**Bottleneck:** Instructor time is now the binding constraint (100% utilized).

**Rebalancing recommendations:**
1. **Highest ROI investment:** Adding 10 instructor hours/month (part-time volunteer or paid assistant) would enable 2 more youth coding sessions and 1 more repair cafe. Community impact increase: ~15%. Cost: ~$250-500/month.
2. **Waste opportunity:** The $130 budget slack could fund 4 more repair cafe sessions (only $30/session) IF instructor time is found -- repair cafe has the second-highest impact per resource unit.
3. **Open lab restructuring:** Open lab scores lowest on space efficiency. Consider converting 2 open lab sessions to "self-directed" format (no instructor required, just key access) to free 2 instructor hours for higher-value programs.
