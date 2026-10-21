# Safety Requirements Traceability with Doorstop

**One-line description:** Stores safety goals, functional and technical safety requirements and test cases as a Doorstop document tree in Git (SG to FSR to TSR to TST), links every item to its parent, and uses Doorstop's own validation output to report orphans, unlinked parents and suspect links after edits.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `safety_goals` (object[], required): Output of `fusa-safety-goals-safe-states`.
- `safety_requirements` (object[], required): Output of `fusa-requirements-decomposition`.
- `repo_dir` (string, required): Path to a Git working copy where the requirement files will live (Doorstop needs a version-controlled root).

---

## Outputs

- `doorstop_trace_report` (object): `doorstop_version`, `documents` (prefix, parent, item count), `orphans`, `parents_without_children`, `suspect_links`, `published_html_dir`, `validation_log_path`.

---

## Phase 1: Create the Document Tree

### Entry Criteria
- `git -C <repo_dir> rev-parse --show-toplevel` prints a path.
- Python 3 and pip are available.

### Actions
1. Install and record the version: `pip install doorstop` then `doorstop --version`.
2. From `repo_dir`, create the tree, root first:
   ```
   doorstop create SG ./reqs/sg
   doorstop create FSR ./reqs/fsr --parent SG
   doorstop create TSR ./reqs/tsr --parent FSR
   doorstop create TST ./reqs/tst --parent TSR
   ```
3. Each command writes a `.doorstop.yml` in its folder. Open one and confirm `settings: prefix:` and `parent:` match the command. Do not hand-edit prefixes afterward; that breaks every existing link.

### Output
Four Doorstop documents under `reqs/`.

### Quality Gate
- `doorstop` (no arguments) runs and prints the tree with SG at the root and TST as a leaf.
- `git status --short reqs` lists four `.doorstop.yml` files.

---

## Phase 2: Add Items and Links

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Add items with `doorstop add SG` (repeat per goal). Each creates `reqs/sg/SG001.yml` and so on. Edit the `text:` field with the goal text. Add custom attributes as extra YAML keys, for example `asil: B` and `safe_state: ...`; Doorstop keeps unknown keys as extended attributes.
2. Add FSR and TSR items the same way. Keep a mapping table from the JSON ids (`FSR-004`) to Doorstop ids (`FSR004`) in the item `ref:` field or a custom `source_id:` key.
3. Link child to parent: `doorstop link FSR004 SG002`, `doorstop link TSR011 FSR004`. Link test items to the TSR they verify: `doorstop link TST003 TSR011`.
4. After all links exist, mark items reviewed so later edits are detected: `doorstop review all` and then `doorstop clear all` to record link fingerprints. Check `doorstop --help` for these subcommands in your installed version before running.
5. Commit: `git add reqs && git commit -m "Add safety requirement tree"`.

### Output
Linked item files committed in Git.

### Quality Gate
- `ls reqs/sg/*.yml | wc -l` equals the number of safety goals; same for FSR and TSR counts.
- No FSR or TSR YAML file has an empty link list: `grep -l "^links: \[\]" reqs/fsr/*.yml reqs/tsr/*.yml` prints nothing.

---

## Phase 3: Validate and Publish

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Run `doorstop 2>&1 | tee doorstop_validation.log`. Read the log lines:

   | Log text contains | Meaning | Action |
   |---|---|---|
   | `no links to parent document` | orphan child item | add the missing link |
   | `no links from child document` | parent item with no children | write the missing child requirement or test |
   | `suspect link` | parent text changed after the link was cleared | re-review the child, then `doorstop clear <child>` |
   | `unreviewed changes` | item edited after review | review it, then `doorstop review <item>` |

2. Fix by editing or linking, never by deleting items or setting `active: false` to silence a warning. `derived: true` is allowed only for a requirement with no parent by design, with a written reason in the item text.
3. Publish HTML: `doorstop publish all ./public`.
4. Fill `doorstop_trace_report` from the log and the counts.

### Output
`doorstop_trace_report`.

### Quality Gate
- `grep -c "no links to parent" doorstop_validation.log` prints 0.
- `grep -c "no links from child" doorstop_validation.log` prints 0 for the SG, FSR and TSR documents.
- `ls public/index.html` succeeds.

---

## Worked Example

Illustrative only.

```
$ doorstop link TSR011 FSR004
linked items: TSR011 (@/reqs/tsr/TSR011.yml) -> FSR004 (@/reqs/fsr/FSR004.yml)
$ doorstop
building tree...
WARNING: FSR: FSR006: no links from child document: TSR
SG
|
FSR
|
TSR
|
TST
```
The warning shows FSR006 has no technical requirement. Phase 3 adds TSR014, links it, reruns `doorstop`, and the warning is gone.

---

## Exit Criteria

DONE when the Doorstop tree validates with no orphan and no childless SG, FSR or TSR item, the HTML is published, and the report lists the counts and the log path.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `doorstop create` fails with a VCS error | **Adjust**: run `git init` in `repo_dir` or move to a Git working copy. |
| Phase 2 | Link command reports unknown item | **Retry**: check the id spelling with `ls reqs/<doc>`. |
| Phase 3 | Many suspect links after a bulk edit | **Adjust**: review each child against the changed parent; do not run `doorstop clear all` without reviewing. |
| Phase 3 | Warning cannot be fixed by linking | **Return**: send the gap back to `fusa-requirements-decomposition`. |

**Do not:** mark items inactive to remove warnings, edit `.doorstop.yml` prefixes after items exist, or report traceability as complete without the validation log.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
