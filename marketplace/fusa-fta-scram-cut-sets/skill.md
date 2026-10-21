# Fault Tree for a Safety Goal with SCRAM Minimal Cut Sets

**One-line description:** Builds a fault tree (IEC 61025 gate logic) whose top event is the violation of one safety goal, writes it in the Open-PSA Model Exchange Format XML, runs the open-source SCRAM analyzer to get minimal cut sets, and reports every single-point (order 1) cut set and every common-cause candidate.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `safety_goals` (object[], required): Output of `fusa-safety-goals-safe-states`.
- `dfmea_worksheet` (object[], required): Output of `fusa-dfmea-worksheet`; rows with `linked_safety_goal` give basic event candidates.
- `failure_probabilities` (object, optional): Map of basic event name to probability over the mission time, from supplier data or a reliability handbook the user names. Without it the analysis is qualitative only.

---

## Outputs

- `fault_tree_xml` (string): Path to the MEF XML file.
- `cut_set_report` (object): `top_event`, `scram_version`, `cut_sets` (list of event lists), `order_1_cut_sets`, `common_cause_candidates`, `top_probability` (or `not computed`).

---

## Phase 1: Build the Tree on Paper

### Entry Criteria
- One safety goal is chosen; run this flow once per goal with ASIL B or higher.
- `dfmea_worksheet` contains rows linked to that goal.

### Actions
1. Write the top event as the goal violation: "unintended lateral motion caused by the item".
2. Expand top-down with one question per gate: "what immediate causes produce this event?" Use OR when any single cause suffices and AND when all causes are needed (for example the fault occurs AND its detection mechanism fails). Use a voting gate (k out of n) only for real k-of-n redundancy.
3. Stop expanding at a basic event: a component failure mode from the DFMEA (`relay K2 contact welded`), a software failure mode at a defined interface, or a human error. Name events with no spaces: `K2_WELD`, `STEER_MCU_CHECK_FAIL`.
4. For each safety mechanism, add the AND gate "fault present" with "mechanism fails to detect or react". A tree with no AND gate for a goal that claims a safety mechanism is wrong.

### Output
Gate list in text: gate name, type, children.

### Quality Gate
- Every leaf is a basic event traced to a DFMEA row id or an SW FMEA row id.
- Every safety mechanism claimed in the requirements appears as a child of an AND gate.

---

## Phase 2: Write MEF XML and Run SCRAM

### Entry Criteria
- Phase 1 gate passed.
- SCRAM is installed (`scram --version` prints a version). Install from the project's releases or your distribution package; if neither is possible, use the manual method in Error Handling.

### Actions
1. Write `ft_SG02.xml`:
   ```xml
   <?xml version="1.0"?>
   <opsa-mef>
     <define-fault-tree name="SG02">
       <define-gate name="TOP">
         <or>
           <gate name="STEER_POWER_NOT_REMOVED"/>
           <basic-event name="DRIVER_IC_SHORT_ON"/>
         </or>
       </define-gate>
       <define-gate name="STEER_POWER_NOT_REMOVED">
         <and>
           <basic-event name="CMD_IMPLAUSIBLE"/>
           <or>
             <basic-event name="STEER_MCU_CHECK_FAIL"/>
             <basic-event name="K2_WELD"/>
           </or>
         </and>
       </define-gate>
     </define-fault-tree>
     <model-data>
       <define-basic-event name="DRIVER_IC_SHORT_ON"><float value="1e-6"/></define-basic-event>
     </model-data>
   </opsa-mef>
   ```
   The `1e-6` above is a placeholder showing where a value from `failure_probabilities` goes. Put a `<define-basic-event>` with a `<float value=...>` only for events in `failure_probabilities`. Never type a probability that has no source.
2. Validate the XML is well formed: `xmllint --noout ft_SG02.xml`.
3. Run `scram --help` and read the option names for your version. Then run the minimal cut set analysis and write the report, for example `scram ft_SG02.xml -o report_SG02.xml`. Add the probability option listed by `--help` only when every basic event has a probability.
4. Record `scram --version` in the report.

### Output
`fault_tree_xml` and the SCRAM XML report.

### Quality Gate
- `xmllint --noout ft_SG02.xml` exits 0.
- `report_SG02.xml` exists and contains a `sum-of-products` element: `grep -c "sum-of-products" report_SG02.xml` prints at least 1.

---

## Phase 3: Read Cut Sets

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. List each `product` element in the report; each is one minimal cut set, and its `order` attribute is the number of basic events in it.
2. Every order 1 cut set is a single-point failure that violates the goal by itself. For ASIL B and above, each one needs a design change or a written rationale; list them in `order_1_cut_sets`.
3. For each order 2 or higher cut set, check whether its events share a cause: same supply, same connector, same software build, same temperature zone. List shared causes in `common_cause_candidates` for the dependent failure analysis.
4. Report `top_probability` only if SCRAM computed it from sourced probabilities; otherwise write `not computed`.

### Output
`cut_set_report`.

### Quality Gate
- The count of `product` elements in the report equals the length of `cut_sets` (`grep -c "<product " report_SG02.xml`).
- Every order 1 cut set has an action or rationale.

---

## Worked Example

Illustrative only. Using the XML above:

```
$ xmllint --noout ft_SG02.xml && echo ok
ok
$ scram ft_SG02.xml -o report_SG02.xml
$ grep -o '<product order="[0-9]*"' report_SG02.xml | sort | uniq -c
      1 <product order="1"
      2 <product order="2"
```
Cut sets: {DRIVER_IC_SHORT_ON}, {CMD_IMPLAUSIBLE, STEER_MCU_CHECK_FAIL}, {CMD_IMPLAUSIBLE, K2_WELD}. The order 1 set means a shorted driver output moves the wheel with no mechanism in between; the action is a second, independent power-removal path checked at startup.

---

## Exit Criteria

DONE when the tree for the chosen goal is in valid MEF XML, SCRAM produced minimal cut sets, every order 1 cut set has an action or rationale, and common-cause candidates are listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Basic event with no FMEA row | **Return**: add the row in `fusa-dfmea-worksheet` first. |
| Phase 2 | SCRAM not installable | **Adjust**: for trees under about 20 events, expand by hand with the MOCUS method (replace OR gates by new rows, AND gates by new columns), then remove supersets; record "manual" as the tool. |
| Phase 2 | SCRAM rejects the XML | **Retry**: run `xmllint` and fix the named element; check element names against the Open-PSA MEF specification. |
| Phase 3 | Probability requested without data | **Stop**: report qualitative results only. |

**Do not:** invent failure probabilities, collapse AND gates into OR to simplify, or drop a basic event because it seems unlikely.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
