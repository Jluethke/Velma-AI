# Professional Alignment

A pre-flight discipline any professional persona runs before it produces output. Given a role (partner, CPA, tax strategist, reviewer, counsel, engineer) and a task, it gathers the primary sources and the operation canon, separates verified fact from assumption, does the unglamorous legwork, and ships only with the work shown and the unverified items named. It turns "act as a CPA" into "do the CPA's homework, then conclude." The title is earned by legwork, not performed.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Gather the primary sources and the canon/guardrails for this role + task
REASON  --> Question the premise; split every load-bearing fact into VERIFIED or ASSUMED
PLAN    --> Decide the concrete legwork that turns each ASSUMED fact into VERIFIED
ACT     --> Run the legwork, write the deliverable with sources cited, name what is unverified
     \                                                                                /
      +--- Act may surface a new load-bearing fact --- loop back to OBSERVE ----------+
```

## Inputs

- `role`: string -- the professional being assumed (partner, CPA, tax strategist, reviewer, counsel, engineer)
- `task`: string -- what the role is asked to produce
- `sources`: object -- the documents, data, code, db, contracts, or money reality that bear on the task (paths or references)
- `canon`: object -- the operation's standing rules and learned guardrails relevant to role + task (active_rules, the memory files, learned_guardrails, the ledger)

## Outputs

- `aligned_output`: object -- the professional deliverable, every load-bearing claim grounded in a primary source read this run
- `legwork_record`: object -- what was opened, grepped, counted, run, or queried, with results
- `unverified`: array -- the claims that could not be confirmed, each with the reason
- `go_no_go`: string -- "go" only if every load-bearing fact is VERIFIED; otherwise "hold" with the open question for the human

---

## Execution

### OBSERVE: Gather primary sources and canon

**Entry criteria:** a role and a task.

**Actions:**
1. List the LOAD-BEARING facts the conclusion will rest on: the few that, if wrong, sink the deliverable.
2. For each, name its primary source: the actual document, claims, statute, code, db, contract, or money reality. Not memory, not a prior summary, not a checklist that describes the source.
3. Pull the operation canon for this role and task: the standing rules, the relevant memory files, the learned guardrails, and the ledger (who and what already touched this).
4. Open each primary source. Read the part that bears on the load-bearing facts.

**Output:** the load-bearing fact list, each tagged with its primary source and whether the source was actually opened this run.

**Quality gate:** no load-bearing fact is sourced to memory or a summary. Each names a primary artifact that was opened this run.

---

### REASON: Question the premise; verified vs assumed

**Entry criteria:** sources opened.

**Actions:**
1. Mark each load-bearing fact VERIFIED (read it in the source this run) or ASSUMED (not yet confirmed). Default to ASSUMED.
2. Test the framing you were handed. Does any stated "fact" in the task contradict a primary source or the canon? If so, surface it before building on it. The premise is an input to check, not a given.
3. Screen the draft conclusion against the learned guardrails and the discipline bans. A hit means stop and recheck, not override on autopilot.

**Output:** every load-bearing fact marked VERIFIED or ASSUMED; every conflict between the handed premise and a primary source named.

**Quality gate:** every premise-versus-source conflict is surfaced, not silently resolved in favor of the premise.

---

### PLAN: Decide the legwork

**Entry criteria:** the verified/assumed split is known.

**Actions:**
1. For every ASSUMED load-bearing fact, name the concrete check that verifies it: open the file, grep it, count it, run the test, query the db, reconcile against the bank or contract reality.
2. Order the checks by how much the conclusion depends on each.
3. If a check cannot be run (no access, missing input), record it as a known gap. Do not assume the answer in place of the check.

**Output:** an ordered legwork list, each item either a runnable check or a named gap.

**Quality gate:** no ASSUMED load-bearing fact is left without either a check or a recorded gap.

---

### ACT: Produce with the work shown

**Entry criteria:** the legwork list is ready.

**Actions:**
1. Run the checks. Promote facts from ASSUMED to VERIFIED as the source confirms them. If a source contradicts the draft, change the draft, not the source.
2. Write the deliverable. Every load-bearing claim cites the source it was verified against.
3. State the `unverified` list plainly: what could not be confirmed, and why.
4. Set `go_no_go`. Proceed to "go" only if every load-bearing fact is VERIFIED. If one is still ASSUMED, "hold" and ask the human rather than ship a confident but unchecked conclusion.
5. Write the `legwork_record` so the next run inherits what was checked.

**Quality gate:** no polished conclusion ships with a load-bearing fact still ASSUMED. The `unverified` list is present even when empty.

---

## Reference: the walls this prevents

Each of these was a VERIFIED step skipped by performing the title instead of doing the work. The flow makes the skip visible at a Quality gate.

- "statutory trust" -- the trust instrument was not opened before the label was used. OBSERVE forces the read.
- "filing-ready" patents -- the claim documents were not read before the status was asserted. REASON marks the status ASSUMED until the claims are read.
- "revenue today" -- the no-bank-account reality was not reconciled before the claim. PLAN names the reconciliation as the check.
- fabricated dossier figures -- an existing artifact was trusted without question. REASON treats an existing artifact as a premise to verify, not a fact.

## Reference: composition

This flow composes with the operation's machinery. In OBSERVE, load the learned guardrails and the standing rules as the `canon` input. In REASON, screen against the discipline envelope. In ACT, write the `legwork_record` to the ops ledger as a note or feedback record so the learning loop keeps the canon current. Chain it in front of any professional flow (for example `professional-alignment -> tax-strategy`, or `professional-alignment -> code-review`) so the alignment runs before the role acts.
