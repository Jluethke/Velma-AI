# Professional Alignment -- Tax Strategist Confirms the Trust's Tax Status

## Scenario

The operator says: "As the tax strategist, confirm how the Wayfinder Trust is taxed so we can plan the royalty." The persona is `tax strategist`. The task rests on one load-bearing fact: the trust's tax character. Performing the title would answer from memory ("a Wyoming trust, holds the IP, taxed as ..."). The flow forces the homework first.

## OBSERVE: Gather primary sources and canon

Load-bearing facts the conclusion rests on:

```
1. The trust's tax character (grantor vs non-grantor)   -> primary source: the trust instrument
2. Who is taxed on trust income                          -> primary source: the instrument + the grantor's residence
3. Whether the IP is actually owned by the trust         -> primary source: the USPTO assignment record
```

Primary sources, opened this run:
- `Documents/TheWayfinderLivingTrust.pdf` -- the notarized instrument.
- `SkillChain/docs/patents/FILING_STATUS.md` + the patent ADS -- the applicant/assignment record.
- Canon: `active_rules.md` (Role discipline), `memory/learned_guardrails.md` (carries the prior "statutory trust" correction), the ops ledger.

**Quality gate met:** no load-bearing fact is sourced to memory; each names an artifact opened this run.

## REASON: Question the premise; verified vs assumed

```
Fact 1 (tax character): the instrument says REVOCABLE living trust, grantor is sole lifetime
        beneficiary -> grantor trust under IRC 676/677.  VERIFIED (read it this run).
Fact 2 (who is taxed): grantor trust -> all income taxed to the grantor on the 1040, at the
        grantor's residence.  VERIFIED against the instrument; residence ASSUMED until checked.
Fact 3 (IP ownership): patents name the Trust as applicant AND a recorded inventor-to-Trust
        assignment vests title.  VERIFIED against the filing record.
```

Premise test: the operator's earlier framing called it a "Wyoming statutory trust." The instrument contradicts that (revocable living trust). A guardrail in `learned_guardrails.md` already records this correction. **Surface it before building on it.**

## PLAN: Decide the legwork

```
ASSUMED -> check:
- Grantor residence (drives the state tax): reconcile the SS-4 street address + the operator's
  stated residency. Check before stating the state result.
```

## ACT: Produce with the work shown

- `aligned_output`: "The Wayfinder Trust is a revocable grantor trust; trust income is taxed to the grantor on the 1040. The IP is assigned to the Trust at the USPTO. The royalty between a disregarded operating LLC and the grantor trust washes until the operating company is a separate taxpayer." Every clause cites a source read this run.
- `legwork_record`: opened the instrument, the filing record, the guardrails; reconciled the assignment.
- `unverified`: ["grantor's state of residence not reconciled against a primary source this run; state-tax result held"].
- `go_no_go`: **hold** on the state-tax conclusion (residence still ASSUMED); **go** on the federal grantor-trust conclusion (VERIFIED).

## What the flow caught

Performing the title would have shipped "Wyoming statutory trust" and a confident state-tax answer. The flow marked the trust character as a load-bearing fact, forced the instrument open, surfaced the premise conflict, and held the one conclusion whose source was not yet read. The wall became a Quality-gate stop instead of a correction after the fact.
