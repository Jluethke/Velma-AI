# Signal-Noise Filter

Triage an information stream by classifying each item as signal (actionable), noise (irrelevant), or weak signal (monitor), then prioritize signals by urgency x impact x confidence and output a filtered feed that prevents alert fatigue.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Ingest information stream (news, data, reports, alerts)
REASON  --> Classify each item: signal (actionable) vs noise (irrelevant) vs weak signal (monitor)
PLAN    --> Prioritize signals by urgency x impact x confidence
ACT     --> Output filtered feed with priority tags, suppress noise, flag weak signals for monitoring
     \                                                              /
      +--- New items arrive or thresholds adapt --- loop OBSERVE ---+
```

## Inputs

- `information_stream`: list[object] -- Items to triage. Each: `{content, source, timestamp, type, metadata}`
- `user_context`: string -- What the user is working on, their role, their current priorities
- `priority_framework`: object -- User-defined priority rules: what topics are always signal, always noise, conditionally relevant
- `signal_history`: list[object] -- Past classifications and user feedback (from accumulated state)
- `source_reliability_map`: object -- Known source reliability scores: `{source_id: reliability_score (0-1)}`

## Outputs

- `filtered_feed`: list[object] -- Items classified and prioritized, ready for consumption
- `signal_list`: list[object] -- Actionable items ranked by priority score
- `noise_list`: list[object] -- Suppressed items with classification reasoning (available for review)
- `weak_signals`: list[object] -- Items worth monitoring with recommended check-in triggers
- `priority_rankings`: list[object] -- Signals ranked by `urgency * impact * confidence`
- `filter_adaptation_log`: object -- How filters changed based on user feedback this cycle

---

## Execution

### OBSERVE: Ingest the Stream

**Entry criteria:** An information stream with at least one item is provided.

**Actions:**

1. **Normalize items.** Each item needs a standard representation:
   ```
   {
     "id": unique identifier,
     "content": the text/data,
     "source": where it came from,
     "source_reliability": 0.0-1.0 (from source_reliability_map or default 0.5),
     "timestamp": when it was created/received,
     "type": "news" | "alert" | "metric" | "report" | "message" | "event",
     "metadata": domain-specific fields
   }
   ```

2. **Deduplicate.** Identify items that are substantively the same information from different sources. Merge duplicates, boost confidence (multiple independent sources = more reliable). Deduplication uses keyword overlap (Jaccard >= 0.6 for near-duplicates).

3. **Apply source reliability.** Look up each source in the `source_reliability_map`. Unknown sources get a default of 0.5. Adjust item weight by source reliability -- a 0.9 reliability source's alert matters more than a 0.2 source's alert.

4. **Check for volume anomalies.** Sudden spikes in information volume about a topic are themselves a signal. If the stream has 10x normal volume on a topic, flag the volume spike as a meta-signal regardless of individual item classification.

**Output:** Normalized, deduplicated stream with source reliability scores attached.

**Quality gate:** All items have source reliability scores. Duplicates are merged. Volume anomalies (if any) are flagged.

---

### REASON: Classify Each Item

**Entry criteria:** Normalized stream is ready.

**Actions:**

1. **Apply the Signal Classification Framework.** For each item, evaluate three dimensions:

   **Relevance (0-1):** How related is this to the user's context and priorities?
   - Exact match to a priority topic: 0.8-1.0
   - Related to a priority topic: 0.4-0.7
   - Tangentially connected: 0.1-0.3
   - No connection: 0.0

   **Actionability (0-1):** Can the user DO something with this information?
   - Requires immediate action: 0.8-1.0
   - Informs an upcoming decision: 0.5-0.7
   - Background context, no action needed now: 0.1-0.4
   - Purely informational, no action path: 0.0

   **Novelty (0-1):** Does this tell the user something they don't already know?
   - Completely new information: 0.8-1.0
   - New angle on known topic: 0.4-0.7
   - Confirmation of existing knowledge: 0.1-0.3
   - Redundant with recent items: 0.0

2. **Compute signal score.** `signal_score = (relevance * 0.4) + (actionability * 0.4) + (novelty * 0.2)`
   - This weights relevance and actionability equally (you need both for a true signal) while novelty serves as a tiebreaker (redundant signals still matter, they just matter less).

3. **Classify using thresholds:**
   - **Signal** (score >= 0.6): Actionable, relevant, worth the user's attention
   - **Weak signal** (score 0.3-0.6): Worth monitoring, might become important, not actionable yet
   - **Noise** (score < 0.3): Not relevant, not actionable, suppress

4. **Apply user overrides.** Check `priority_framework` for explicit rules:
   - "Always signal" topics bypass scoring (security alerts, regulatory changes)
   - "Always noise" topics bypass scoring (marketing emails, routine logs)
   - These overrides prevent the filter from learning bad habits on critical topics

5. **Detect weak signal patterns.** Individual weak signals are ignorable. But clusters of weak signals on the same topic may constitute a strong signal. If 3+ weak signals on the same topic arrive within a time window, promote the cluster to a signal.

6. **Check for information decay.** Stale items (older than the relevance window for their type) get their scores decayed:
   - Alerts: 1-hour half-life
   - News: 24-hour half-life
   - Reports: 7-day half-life
   - Metrics: depends on measurement frequency

**Output:** Classified stream: each item labeled signal/weak-signal/noise with scores and reasoning.

**Quality gate:** Every item has a classification. Signal items have relevance >= 0.4 and actionability >= 0.4. Noise items have signal score < 0.3. No items are unclassified.

---

### PLAN: Prioritize Signals

**Entry criteria:** Items are classified.

**Actions:**

1. **Score signal priority.** For each signal-classified item:
   ```
   priority = urgency * impact * confidence
   ```
   Where:
   - **Urgency (1-5):** How time-sensitive is this? 5 = act now, 1 = can wait weeks
   - **Impact (1-5):** If acted on, how much does it matter? 5 = existential, 1 = minor improvement
   - **Confidence (0-1):** How reliable is this information? Product of source reliability and evidence quality

2. **Apply the alert fatigue prevention rule.** If more than N signals are identified (where N is configurable, default 7), apply stricter thresholds:
   - Re-score with a 20% higher signal threshold
   - Keep only the top N by priority score
   - Demote excess signals to weak-signal status
   - Rationale: Shannon's information theory -- a channel with too many signals is equivalent to noise. The filter's job is to maintain a manageable signal rate.

3. **Group signals by action type.** Cluster signals that require the same type of response:
   - "Investigate" -- need more information before acting
   - "Decide" -- a decision is needed (route to decision-analyzer)
   - "Execute" -- action is clear, just do it
   - "Communicate" -- someone else needs to know about this

4. **Schedule weak signal check-ins.** For each weak signal, define:
   - When to re-evaluate (based on expected development timeline)
   - What trigger would promote it to signal status
   - What trigger would demote it to noise

**Output:** Prioritized signal list, grouped by action type, with weak signal monitoring schedule.

**Quality gate:** Signals are ordered by priority score. Alert fatigue rule applied (no more than N signals in final output). Weak signals have check-in triggers.

---

### ACT: Deliver the Filtered Feed

**Entry criteria:** Signals are prioritized, noise is classified, weak signals have monitoring plans.

**Actions:**

1. **Format the filtered feed.** Present in priority order:
   ```
   [SIGNAL - Priority 20.0] Security vulnerability in dependency X
     Source: GitHub Advisory (reliability: 0.95)
     Action type: Execute (update dependency)
     Urgency: 5  Impact: 4  Confidence: 1.0

   [SIGNAL - Priority 9.0] Competitor launched feature Y
     Source: TechCrunch (reliability: 0.7)
     Action type: Investigate (assess impact on roadmap)
     Urgency: 3  Impact: 3  Confidence: 1.0

   [WEAK SIGNAL - Monitor] Rising user complaints about load times
     Source: Support tickets (reliability: 0.8)
     Check-in: Recheck in 48 hours
     Promote trigger: >10 tickets or p95 latency > 500ms
   ```

2. **Generate noise summary.** Don't list every noise item -- just summarize:
   - "Suppressed 47 items: 23 routine logs, 12 marketing emails, 8 duplicate alerts, 4 stale reports"
   - This lets the user verify the filter isn't suppressing important things

3. **Adapt filters based on feedback.** If user feedback is available from `signal_history`:
   - Items the user marked as "actually important" that were classified noise: lower the threshold for similar items
   - Items the user marked as "not useful" that were classified signal: raise the threshold
   - Track adaptation in `filter_adaptation_log`
   - Adaptation rate: small adjustments (5% threshold shift per feedback item) to prevent oscillation

4. **Check for loop trigger.** ORPA loops when:
   - New items arrive in the stream
   - User provides feedback that changes classifications
   - A weak signal's check-in trigger fires
   - Alert fatigue conditions change (user's capacity changes)

**Output:** Filtered feed, noise summary, filter adaptation log.

**Quality gate:** Feed is in priority order. Noise summary accounts for all suppressed items. If feedback was provided, adaptation log shows what changed.

## Exit Criteria

The skill is DONE when:
1. Every item in the stream is classified (signal, weak signal, or noise)
2. Signals are prioritized by urgency x impact x confidence
3. Alert fatigue rule has been applied (manageable number of signals)
4. Weak signals have monitoring triggers
5. No new items are arriving (stream is fully processed for this cycle)

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Empty stream | Abort -- nothing to filter, report "no items" |
| OBSERVE | All sources have unknown reliability | Adjust -- assign default 0.5 reliability, flag confidence as reduced |
| REASON | Cannot determine relevance (no user context) | Adjust -- classify all items as weak signals, request user context |
| REASON | All items classify as signal (threshold too low) | Adjust -- raise threshold by 20%, re-classify |
| PLAN | Alert fatigue rule eliminates all signals | Adjust -- keep top 3 regardless of threshold |
| ACT | User feedback contradicts filter logic consistently | Escalate -- present the conflict, ask user to update priority framework |

## State Persistence

- Signal classification history (past items with their classifications and user feedback -- the training data for adaptive thresholds)
- Threshold calibration (current signal/weak-signal/noise thresholds, adjusted from user feedback over time)
- Source reliability scores (Bayesian-updated reliability per source based on whether their signals proved actionable)
- False positive/negative rates (how often signals were marked irrelevant by the user, how often noise was marked important)
- Weak signal watchlist (active weak signals being monitored with their promotion/demotion triggers and check-in schedules)
- Topic baseline volumes (normal information volume per topic -- used to detect volume anomaly spikes)

---

## Reference

### Information Theory Foundations

**Shannon's Channel Capacity.** A communication channel has a maximum information throughput. Beyond that, noise overwhelms signal and the effective information rate drops. The same applies to human attention: beyond ~7 simultaneous signals (Miller's Law), comprehension degrades. The filter's job is to keep the signal rate within human channel capacity.

**Surprise as Information.** In information theory, the information content of an event is proportional to its surprise: `I(x) = -log2(P(x))`. Common events carry little information. Rare events carry lots. This is why novelty scoring matters -- a 10th alert about the same issue carries less information than the first.

**Signal-to-Noise Ratio (SNR).** Defined as `SNR = P(signal) / P(noise)`. A good filter maintains a high SNR. But there is a tradeoff:
- High sensitivity (low threshold): catches all signals but also admits noise (false positives)
- High specificity (high threshold): rejects all noise but may miss signals (false negatives)
- The optimal threshold depends on the cost of missing a signal vs. the cost of processing noise. For security alerts, bias toward sensitivity. For marketing updates, bias toward specificity.

### Alert Fatigue Prevention

Alert fatigue is the #1 failure mode of information systems. Studies from clinical medicine (where alert fatigue kills patients) show:
- Override rates exceed 90% when alerts exceed 50/day
- Critical alerts get ignored when mixed with low-priority alerts
- The most effective intervention is REDUCING alert volume, not adding urgency labels

**Prevention strategies implemented in this skill:**
1. Hard cap on signal count (default 7, configurable)
2. Noise suppression with summary (user can audit but isn't interrupted)
3. Weak signal monitoring (defer attention, don't eliminate)
4. Adaptive thresholds (learn from user feedback)
5. Deduplication (same information from 5 sources = 1 signal, not 5)

### Relevance Scoring Dimensions

**Relevance** is context-dependent. A stock price alert is noise for an engineer and signal for a trader. The filter handles this through:
- `user_context`: what the user is doing right now
- `priority_framework`: persistent rules about what matters
- `signal_history`: learned preferences from past feedback

**Actionability** is the most important filter. Information that cannot be acted on is entertainment, not signal. The test: "If I received this, what would I DO differently?" If the answer is "nothing," it's noise regardless of relevance.

**Novelty** prevents redundancy fatigue. The 10th article about the same topic adds diminishing returns. Novelty detection compares each new item against recent items for keyword overlap (Jaccard > 0.6 = redundant).

### Weak Signal Theory (Ansoff, 1975)

Weak signals are early indicators of future change that are easy to dismiss because they are ambiguous, uncertain, or seemingly insignificant. The canonical examples:
- A single customer complaint about a feature that later causes mass churn
- A small competitor's experiment that later disrupts the market
- A minor regulatory discussion that later becomes mandatory compliance

Weak signals become strong signals through **convergence**: multiple independent weak signals pointing in the same direction. This skill monitors weak signals and promotes clusters to signal status.

### Source Reliability Calibration

Source reliability is not static. It should be calibrated over time:
- **Bayesian updating**: Start with a prior (0.5 for unknown sources), update based on whether their claims prove accurate
- **Domain specificity**: A source may be reliable for technology news but unreliable for financial analysis
- **Recency of calibration**: A source that was reliable 2 years ago may not be now (editorial changes, quality drift)

Default reliability scores by source type:
- Peer-reviewed journal: 0.85
- Official documentation: 0.80
- Major news outlet (Reuters, AP): 0.75
- Industry analyst (Gartner, Forrester): 0.65
- Tech blog (established): 0.55
- Social media (verified expert): 0.45
- Social media (unknown): 0.20
- Anonymous forum: 0.15

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
