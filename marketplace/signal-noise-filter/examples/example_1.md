# Signal-Noise Filter -- Morning Triage for a Platform Engineering Lead

## Scenario

A platform engineering lead arrives at work to find 43 items in their information feed. They have 3 hours before a strategy meeting and need to know what actually matters.

## OBSERVE: Ingest the Stream

**Normalized stream (43 items):**

| # | Type | Source | Reliability | Content Summary |
|---|---|---|---|---|
| 1 | Alert | PagerDuty | 0.95 | P95 latency spike to 800ms on auth service |
| 2 | Alert | PagerDuty | 0.95 | Disk usage 87% on prod-db-03 |
| 3 | Alert | Datadog | 0.85 | Error rate 4.2% (baseline 0.5%) on payment service |
| 4 | News | Hacker News | 0.45 | "PostgreSQL 18 released with native sharding" |
| 5 | Message | Slack #general | 0.60 | CTO: "Heads up -- board is asking about infrastructure costs" |
| 6-15 | Log | CI/CD | 0.80 | 10 deployment logs (3 failed, 7 succeeded) |
| 16-28 | Email | Marketing | 0.20 | 13 vendor marketing emails |
| 29-33 | Jira | Other teams | 0.70 | 5 ticket updates for unrelated projects |
| 34 | Message | Slack #incidents | 0.80 | "Users reporting slow login since 6am" |
| 35-37 | Alert | AWS | 0.90 | 3 CloudWatch alarms: CPU, memory, network |
| 38 | News | Reuters | 0.75 | AWS announces new region pricing changes |
| 39-41 | Message | Slack #random | 0.30 | 3 social messages |
| 42 | Report | Weekly metrics | 0.85 | Infrastructure cost report showing 22% increase MoM |
| 43 | Message | Slack DM | 0.70 | Junior engineer: "Can I ask you about load balancing?" |

**Deduplication:** Items 1, 34, and 35 are related (auth service latency). Merged into a single enriched item with higher confidence (multiple independent sources).

**Volume anomaly:** 4 items related to auth service performance in a 2-hour window (vs. baseline of 0 per day). Volume spike flagged as meta-signal.

## REASON: Classify Each Item

**Classification results:**

| # | Relevance | Actionability | Novelty | Signal Score | Classification |
|---|---|---|---|---|---|
| 1+34+35 | 1.0 | 1.0 | 1.0 | **1.00** | SIGNAL |
| 3 | 0.9 | 0.9 | 0.9 | **0.90** | SIGNAL |
| 2 | 0.8 | 0.7 | 0.5 | **0.70** | SIGNAL |
| 5 | 0.7 | 0.6 | 0.8 | **0.68** | SIGNAL |
| 42 | 0.8 | 0.5 | 0.7 | **0.66** | SIGNAL |
| 6 (3 failed) | 0.7 | 0.6 | 0.4 | **0.60** | SIGNAL |
| 38 | 0.5 | 0.3 | 0.7 | **0.46** | WEAK SIGNAL |
| 4 | 0.4 | 0.2 | 0.8 | **0.40** | WEAK SIGNAL |
| 43 | 0.3 | 0.3 | 0.2 | **0.28** | NOISE |
| 6 (7 success) | 0.2 | 0.0 | 0.0 | **0.08** | NOISE |
| 16-28 | 0.0 | 0.0 | 0.0 | **0.00** | NOISE |
| 29-33 | 0.1 | 0.0 | 0.1 | **0.06** | NOISE |
| 39-41 | 0.0 | 0.0 | 0.0 | **0.00** | NOISE |

**Alert fatigue check:** 6 signals identified. Below the cap of 7. No demotion needed.

## PLAN: Prioritize Signals

| Priority | Item | Urgency | Impact | Confidence | Priority Score | Action Type |
|---|---|---|---|---|---|---|
| 1 | Auth service latency spike (merged) | 5 | 4 | 0.95 | **19.0** | Execute |
| 2 | Payment service error rate 4.2% | 5 | 5 | 0.85 | **21.25** | Execute |
| 3 | Disk usage 87% on prod-db-03 | 3 | 3 | 0.95 | **8.55** | Execute |
| 4 | CTO board cost question | 3 | 4 | 0.60 | **7.20** | Communicate |
| 5 | Infra cost report +22% MoM | 2 | 3 | 0.85 | **5.10** | Investigate |
| 6 | 3 failed deployments | 2 | 2 | 0.80 | **3.20** | Investigate |

**Re-ordered by priority score:** Payment error rate (21.25) > Auth latency (19.0) > Disk (8.55) > CTO question (7.20) > Cost report (5.10) > Failed deploys (3.20).

Note: Payment service jumped to #1 by priority score despite auth service being merged from more sources. Impact=5 (payment affects revenue) pushed it above auth latency.

**Weak signal monitoring:**

| Item | Check-in | Promote Trigger |
|---|---|---|
| AWS pricing changes | Review before next billing cycle | >5% cost impact on current infra |
| PostgreSQL 18 native sharding | Review during next architecture discussion | Team discusses scaling challenges |

## ACT: Deliver the Filtered Feed

```
FILTERED FEED -- 2026-03-31 09:00

[SIGNAL - Priority 21.25] Payment service error rate 4.2% (baseline 0.5%)
  Source: Datadog (reliability: 0.85)
  Action: EXECUTE -- Investigate payment error spike immediately. 8x baseline.
  Urgency: 5  Impact: 5  Confidence: 0.85

[SIGNAL - Priority 19.0] Auth service latency spike (P95: 800ms, users reporting slow login)
  Sources: PagerDuty + Slack #incidents + CloudWatch (merged, reliability: 0.95)
  Action: EXECUTE -- Auth and payment may be related. Check shared dependencies.
  Urgency: 5  Impact: 4  Confidence: 0.95

[SIGNAL - Priority 8.55] Disk usage 87% on prod-db-03
  Source: PagerDuty (reliability: 0.95)
  Action: EXECUTE -- Not urgent but approaching critical. Expand or clean up.
  Urgency: 3  Impact: 3  Confidence: 0.95

[SIGNAL - Priority 7.20] CTO: Board asking about infrastructure costs
  Source: Slack (reliability: 0.60)
  Action: COMMUNICATE -- Connect CTO to the cost report (below). Prepare talking points.
  Urgency: 3  Impact: 4  Confidence: 0.60

[SIGNAL - Priority 5.10] Infrastructure costs +22% MoM
  Source: Weekly metrics (reliability: 0.85)
  Action: INVESTIGATE -- Relevant to CTO's board question. Analyze drivers.
  Urgency: 2  Impact: 3  Confidence: 0.85

[SIGNAL - Priority 3.20] 3 failed deployments overnight
  Source: CI/CD (reliability: 0.80)
  Action: INVESTIGATE -- Check if related to auth/payment issues.
  Urgency: 2  Impact: 2  Confidence: 0.80

[WEAK SIGNAL - Monitor] AWS region pricing changes
  Check-in: Before April billing review
  Promote if: >5% cost impact

[WEAK SIGNAL - Monitor] PostgreSQL 18 native sharding released
  Check-in: Next architecture review
  Promote if: Scaling discussion arises

NOISE SUMMARY: Suppressed 29 items: 13 vendor emails, 7 routine deploy logs,
5 unrelated Jira updates, 3 social messages, 1 mentoring request (deferred, not urgent)
```

**Key insight from this triage:** The payment error spike and auth latency spike happened simultaneously. This correlation was not visible in any single alert but becomes obvious when signals are grouped. The filter surfaced the pattern by merging related items and placing them adjacent in the priority list.
