# Spec Errata Check

**One-line description:** Pulls every erratum filed against the pinned spec and its updating documents, classifies each one by status and type with a fixed decision table, and produces an errata log stating which corrected text the implementation must follow instead of the published text.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `spec_bundle` (object, required): From `s2i-spec-acquire-pin`. Supplies the spec ID, publisher, and the updating documents.

---

## Outputs

- `errata_log` (object[]): One row per erratum: `{ "errata_id", "doc", "section", "type", "status", "original_text", "corrected_text", "action" }` where `action` is one of `APPLY`, `APPLY_AND_LOG`, `LOG_ONLY`, `IGNORE`.

---

## Phase 1: Collect Errata

### Entry Criteria
- `spec_bundle` exists and lists at least one document.

### Actions
1. Pick the errata source by publisher:

   | Publisher | Errata source |
   |---|---|
   | IETF RFC | `https://www.rfc-editor.org/errata/rfcNNNN` (one page per RFC). Also check `https://www.rfc-editor.org/errata_search.php?rfc=NNNN` if the first URL redirects. |
   | IETF Internet-Draft | No errata; check the draft's GitHub repository issues named in the draft's "Note to Readers", if any. |
   | W3C | The "Errata" link in the spec header; for most current specs this is the GitHub issue list with an `errata` label. |
   | WHATWG | No errata; living standards are fixed in place. Compare your pinned commit snapshot to `main` with the GitHub compare view `https://github.com/whatwg/<std>/compare/<sha>...main`. |
   | ISO / IEC | Published corrigenda (ISO "Cor" documents) and amendments ("Amd") listed on the standard's iso.org page. |

2. Fetch the errata page for the main spec and for every document in `spec_bundle.updated_by`: `curl -fsSL -o spec/errata-rfc6455.html https://www.rfc-editor.org/errata/rfc6455`.
3. For each erratum, copy: ID number, section, type (Technical or Editorial), status, "Original Text", and "Corrected Text". Copy text exactly; do not paraphrase.

### Output
Raw errata list.

### Quality Gate
- One errata file per document in `spec_bundle.files` that has an errata source.
- Count of copied errata equals the count shown on each errata page.

---

## Phase 2: Classify

### Entry Criteria
- Raw errata list.

### Actions
1. Set `action` from status and type with this table. RFC Editor status names are used; map W3C/ISO equivalents as noted.

   | Status | Type | `action` | Meaning for the implementer |
   |---|---|---|---|
   | Verified | Technical | `APPLY` | Follow the corrected text. It is the agreed meaning. |
   | Verified | Editorial | `APPLY` | Follow the corrected text; usually no behavior change. |
   | Held for Document Update | Technical | `APPLY_AND_LOG` | The fix is accepted for the next revision but not verified as the current meaning. Follow it only if it does not contradict other normative text; send it to the ambiguity log either way. |
   | Held for Document Update | Editorial | `LOG_ONLY` | Record; no behavior change. |
   | Reported | any | `LOG_ONLY` | Not reviewed. Never implement from a Reported erratum alone; send Technical ones to the ambiguity log. |
   | Rejected | any | `IGNORE` | Keep the published text. Record the rejection rationale; it often explains a confusing passage. |
   | ISO corrigendum or amendment published | any | `APPLY` | Part of the standard as amended. |
   | W3C issue labeled errata, closed with a spec change | any | `APPLY` | The spec text was changed. |

2. For every `APPLY` row, check whether a later updating RFC already contains the fix. If so, cite that RFC section instead; it is normative, the erratum is not.
3. Write `errata_log` to `spec/errata_log.json`.

### Output
`errata_log`.

### Quality Gate
- Every row has exactly one `action` from the table.
- Zero rows with status Reported have `action` `APPLY`.
- `python -m json.tool spec/errata_log.json` exits 0.

---

## Worked Example

Illustrative. `spec_bundle.id` = "RFC 6455".

Phase 1: `curl -fsSL -o spec/errata-rfc6455.html https://www.rfc-editor.org/errata/rfc6455`. The page lists errata with mixed statuses. One Verified Technical erratum corrects a detail of the handshake text; several Reported ones propose rewording.

Phase 2 output excerpt:
```
[{"errata_id":"<id>","doc":"RFC 6455","section":"4.2.1","type":"Technical",
  "status":"Verified","original_text":"...","corrected_text":"...","action":"APPLY"},
 {"errata_id":"<id>","doc":"RFC 6455","section":"5.5.1","type":"Technical",
  "status":"Reported","original_text":"...","corrected_text":"...","action":"LOG_ONLY"}]
```
The Reported 5.5.1 row is forwarded to the ambiguity log; the implementation keeps the published 5.5.1 behavior.

---

## Exit Criteria

DONE when every erratum for every document in the bundle is in `errata_log` with an `action`, and every `APPLY` row cites the corrected text the implementation follows.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Errata page returns "no errata" | **Return** an empty `errata_log` and record the check date; empty is a valid result. |
| Phase 1 | Errata page unreachable | **Retry** once; then **Stop** and report. Do not continue as if there were no errata. |
| Phase 2 | Two Verified errata conflict | **Adjust**: apply the later-dated one and add both to the ambiguity log. |
| Phase 2 | Corrected text contradicts an updating RFC | **Adjust**: the updating RFC wins (it is normative); set `action` to `LOG_ONLY` and record why. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
