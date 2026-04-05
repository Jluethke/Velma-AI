# Deal Risk Analyzer -- Q1 Pipeline Review

## Scenario

A sales team has 6 deals in their pipeline totaling $620K. Quarter ends in 5 weeks. They need to know which deals are real, which are at risk, and where to focus their energy.

## OBSERVE: Read Pipeline Data

**Pipeline Snapshot:**

| Deal | Account | ACV | Stage | Days in Stage | Last Touch | Champion | Competitor |
|---|---|---|---|---|---|---|---|
| D1 | NovaTech | $180K | Negotiation | 12 | 2 days ago | CTO (strong) | None known |
| D2 | Cascade Inc | $120K | Proposal | 35 | 18 days ago | VP Eng (weak) | Datadog |
| D3 | Meridian Co | $95K | Demo | 8 | 1 day ago | Dir. Platform | PagerDuty |
| D4 | Apex Group | $85K | Discovery | 42 | 30 days ago | None | Unknown |
| D5 | BluePeak | $80K | Negotiation | 25 | 5 days ago | CFO (strong) | Internal build |
| D6 | Vertex Labs | $60K | Proposal | 14 | 3 days ago | CTO (strong) | None known |

**Historical Benchmarks (from state):**
- Median days in Discovery: 14
- Median days in Demo: 10
- Median days in Proposal: 18
- Median days in Negotiation: 15
- Win rate from Negotiation: 72%
- Win rate from Proposal: 45%

## REASON: Score Risk Factors

**Risk Scoring (0-100, higher = more risk):**

### D1 -- NovaTech ($180K) -- Risk Score: 15 (LOW)
- Stage velocity: 12 days in Negotiation vs 15 median = HEALTHY
- Last touch: 2 days ago = ACTIVE
- Champion: CTO, strong = SOLID
- Competitor: None known = GOOD (but verify -- absence of intel is not absence of competition)
- Risk factors: Deal size ($180K) may trigger procurement review -- confirm no legal/procurement delays

### D2 -- Cascade Inc ($120K) -- Risk Score: 82 (CRITICAL)
- Stage velocity: 35 days in Proposal vs 18 median = 94th PERCENTILE STALL
- Last touch: 18 days ago = DARK (no response in 2.5 weeks)
- Champion: VP Eng rated "weak" = AT RISK (weak champions get overruled)
- Competitor: Datadog = STRONG COMPETITOR with brand advantage
- Risk factors: Multiple compounding risks. This deal is likely already lost or frozen.

### D3 -- Meridian Co ($95K) -- Risk Score: 35 (MODERATE)
- Stage velocity: 8 days in Demo vs 10 median = ON TRACK
- Last touch: 1 day ago = ACTIVE
- Champion: Dir. Platform = MID-LEVEL (may lack budget authority)
- Competitor: PagerDuty = MODERATE COMPETITOR
- Risk factors: Champion rank may not survive executive review. Need to multi-thread to VP/C-level.

### D4 -- Apex Group ($85K) -- Risk Score: 95 (CRITICAL)
- Stage velocity: 42 days in Discovery vs 14 median = 3X MEDIAN, SEVERE STALL
- Last touch: 30 days ago = GHOST (no contact in a month)
- Champion: None identified = FATAL FLAW
- Competitor: Unknown = NO INTEL
- Risk factors: This is not a real deal. No champion, no activity, 3x median duration. Remove from forecast.

### D5 -- BluePeak ($80K) -- Risk Score: 50 (ELEVATED)
- Stage velocity: 25 days in Negotiation vs 15 median = 67% OVER MEDIAN
- Last touch: 5 days ago = ACCEPTABLE
- Champion: CFO, strong = GOOD (but CFO champion = cost-driven buyer, price-sensitive)
- Competitor: Internal build = DANGEROUS (hardest to displace, infinite budget illusion)
- Risk factors: CFO champions often push for lower pricing. Internal build competition means they may choose "build" if negotiation stalls further.

### D6 -- Vertex Labs ($60K) -- Risk Score: 20 (LOW)
- Stage velocity: 14 days in Proposal vs 18 median = AHEAD OF PACE
- Last touch: 3 days ago = ACTIVE
- Champion: CTO, strong = SOLID
- Competitor: None known = GOOD
- Risk factors: Smallest deal, lowest risk. Straightforward close expected.

## PLAN: Recommend Actions

**Priority Actions by Deal:**

1. **D2 Cascade Inc (CRITICAL):** Immediate "break the glass" outreach. Call VP Eng directly today. If no response in 48 hours, attempt end-run to their CTO or another stakeholder. Prepare competitive battle card vs. Datadog. If still dark after 1 week, move to "Lost -- No Decision" and stop spending time.

2. **D4 Apex Group (CRITICAL):** Remove from commit forecast immediately. This deal needs to be re-qualified from scratch or abandoned. If pursuing: identify a champion within 1 week or kill the deal. Do not let a championless deal consume pipeline attention.

3. **D5 BluePeak (ELEVATED):** Address the "build vs. buy" objection head-on. Prepare TCO analysis showing 18-month cost of internal build vs. your solution. Accelerate: propose a "decision deadline" incentive (e.g., Q1 pricing valid through end of quarter). Watch for CFO pushing a last-minute discount demand.

4. **D3 Meridian (MODERATE):** Multi-thread to executive sponsor. Ask Dir. Platform to introduce you to their VP or CTO. Prepare competitive positioning vs. PagerDuty. Deal is healthy but fragile at current champion level.

5. **D1 NovaTech (LOW):** Stay the course. Confirm no procurement review needed at $180K. Prepare for signature next 2 weeks.

6. **D6 Vertex Labs (LOW):** Stay the course. Follow up on proposal, push for signature within 1 week.

## ACT: Risk Report Output

**Forecast Adjustment:**

| Deal | Original Probability | Risk-Adjusted | Weighted Value |
|---|---|---|---|
| D1 NovaTech | 80% | 78% | $140,400 |
| D2 Cascade Inc | 50% | 12% | $14,400 |
| D3 Meridian Co | 60% | 50% | $47,500 |
| D4 Apex Group | 40% | 5% | $4,250 |
| D5 BluePeak | 70% | 45% | $36,000 |
| D6 Vertex Labs | 75% | 72% | $43,200 |
| **TOTAL** | **$372K weighted** | **$285,750 adjusted** | **-23% from original forecast** |

**Bottom Line:** The team's $372K weighted pipeline is actually a $286K pipeline. Two deals (D2, D4) account for $175K of pipeline value but contribute only $19K in risk-adjusted terms. The team should reallocate time from D4 to D2 (salvageable) and D5 (closeable with right approach).
