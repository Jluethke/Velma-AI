# HARA Step 2: Rate Severity, Exposure, Controllability and Determine ASIL

**One-line description:** Rates each hazardous event for severity (S0 to S3), exposure (E0 to E4) and controllability (C0 to C3) with a written rationale per class, then determines the ASIL from the ISO 26262-3 Table 4 lookup and flags every rating the evidence does not support.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `hazardous_events` (object[], required): Output of `fusa-hara-hazardous-events`.
- `rating_evidence` (string, optional): Path to test logs, drive-time statistics, injury data or controllability study notes the team already holds.

---

## Outputs

- `hara_table` (object[]): Each hazardous event row plus `S`, `S_rationale`, `E`, `E_rationale`, `C`, `C_rationale`, `asil` (QM, A, B, C, D), `confidence` (evidenced or assumed), `review_flags`.

---

## Phase 1: Severity and Exposure

### Entry Criteria
- `hazardous_events` has at least one row.
- The rater has access to ISO 26262-3:2018 (Tables 1, 2, 3 and 4, and Annex B). If not, every class is marked `assumed` and listed for review.

### Actions
1. Severity: pick the class from ISO 26262-3 Table 1 by the worst credible injury to `persons_at_risk` in that situation:

   | Class | Description in the standard |
   |---|---|
   | S0 | no injuries |
   | S1 | light and moderate injuries |
   | S2 | severe and life-threatening injuries (survival probable) |
   | S3 | life-threatening injuries (survival uncertain), fatal injuries |

   Write the rationale as speed, mass, contact type and body region ("cart at test speed band 2 striking a standing marshal's legs").
2. Exposure: pick E0 to E4 from Table 2 using either duration or frequency of the situation, and say which. Annex B gives example situations; cite the closest example by its row text. The duration reading in Annex B is: E1 very low probability, E2 low (under 1 % of average operating time), E3 medium (1 % to 10 %), E4 high (over 10 %). Check these against your copy before use.
3. If `rating_evidence` contains logged time in the situation, compute the share of operating time from it and attach the command used, for example `jq '[.[]|select(.situation=="OS-03")|.seconds]|add' drive_log.json`.
4. Rate the situation's exposure independently of the malfunction's probability. Exposure is how often the situation happens, not how often the fault happens.

### Output
S and E with rationale per row.

### Quality Gate
- Every row has `S` in {S0,S1,S2,S3} and `E` in {E0,E1,E2,E3,E4}.
- Every `E_rationale` states "duration" or "frequency".
- No `E_rationale` mentions failure rate, FIT or MTBF (search the column: zero hits).

---

## Phase 2: Controllability

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Identify who could act to avoid harm: the safety driver, the remote operator, the bystander stepping away. Name them in the rationale.
2. Pick C0 to C3 from ISO 26262-3 Table 3: C0 controllable in general, C1 simply controllable, C2 normally controllable, C3 difficult to control or uncontrollable. The note to Table 3 relates C1 to 99 % or more of drivers and C2 to 90 % or more of drivers avoiding harm; verify in your copy.
3. If no human is in a position to react (driverless robot, operator not watching), rate C3 and write that reason.
4. Mark `confidence = assumed` for any C class not backed by a test or study in `rating_evidence`. Controllability claims below C3 for automated driving without a safety driver must be backed by evidence or flagged.

### Output
C with rationale per row.

### Quality Gate
- Every row has `C` in {C0,C1,C2,C3} and a rationale naming the person who acts.
- Every row with C1 or C2 and `confidence = assumed` has a `review_flags` entry.

---

## Phase 3: Determine the ASIL

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. If any of S, E or C is class 0, set `asil = QM`.
2. Otherwise compute n = (S number) + (E number) + (C number). This sum reproduces ISO 26262-3 Table 4:

   | n | ASIL |
   |---|---|
   | 10 | D |
   | 9 | C |
   | 8 | B |
   | 7 | A |
   | 6 or less | QM |

3. Spot-check three rows against Table 4 itself: S3 E4 C3 must give D, S1 E4 C3 must give B, S3 E2 C2 must give A.
4. Add `review_flags` for rows where changing one class by one step changes the ASIL by two or more levels; those deserve a second rater.
5. Emit `hara_table` as JSON.

### Output
`hara_table`.

### Quality Gate
- `jq '[.[]|select(.asil==null)]|length' hara_table.json` prints 0.
- The three spot-check combinations give D, B and A.
- Every row has `confidence` set.

---

## Worked Example

Illustrative only. `HE-007` (unintended lateral motion at the hairpin, marshal at apex).

- Phase 1: S3 (cart mass and speed band 2 against an unprotected person; rationale cites contact with a standing adult). E3, frequency: the hairpin is passed on most laps but the marshal stands there only during some sessions.
- Phase 2: C2, safety driver with hands on wheel; `confidence = assumed`, flagged for a controllability test.
- Phase 3: n = 3 + 3 + 2 = 8, ASIL B.

```
$ jq -c '.[]|{he_id,S,E,C,asil}' hara_table.json | head -2
{"he_id":"HE-007","S":"S3","E":"E3","C":"C2","asil":"B"}
{"he_id":"HE-011","S":"S1","E":"E2","C":"C1","asil":"QM"}
```

---

## Exit Criteria

DONE when every hazardous event has S, E and C with written rationales, an ASIL from the Table 4 lookup, a confidence mark and any review flags.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Team argues exposure from fault probability | **Adjust**: re-rate from situation frequency or duration only. |
| Phase 1 | No copy of the standard available | **Adjust**: rate with the tables above, mark every row `assumed`, list for review. |
| Phase 2 | Controllability claimed without any test | **Adjust**: keep the class, set `confidence = assumed`, add a review flag. |
| Phase 3 | ASIL sum disagrees with a spot check | **Stop**: the class numbering is wrong somewhere; recheck that classes were stored as S1..S3, E1..E4, C1..C3 numbers. |

**Do not:** lower a class to reach a cheaper ASIL, average ratings across situations, or treat QM as "no safety work needed" for the safety driver's own controls.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
