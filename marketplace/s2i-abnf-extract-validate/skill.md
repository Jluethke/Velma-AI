# ABNF Extract and Validate

**One-line description:** Extracts every ABNF rule from the spec (and the rules it imports from other RFCs), applies RFC 5234 core rules and RFC 7405 case-sensitivity, expands spec-specific extensions such as the HTTP `#rule` list syntax, and validates the result with `bap` or the IETF author tools until no rule is undefined.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `spec_bundle` (object, required): From `s2i-spec-acquire-pin`.
- `errata_log` (object[], required): From `s2i-errata-check`. ABNF errata are common; apply them.
- `project_dir` (string, required): Repository root; the grammar is written to `project_dir/spec/grammar.abnf`.

---

## Outputs

- `grammar_file` (string): Path to the single self-contained, validated ABNF file.
- `grammar_report` (object): `{ "rules": N, "imported": [{"rule","from"}], "case_sensitive_literals": [], "extensions_expanded": [], "errata_applied": [], "validator": "bap|author-tools", "validator_output" }`.

---

## Phase 1: Extract Rules

### Entry Criteria
- Spec text or RFCXML v3 file present.

### Actions
1. Prefer a "Collected ABNF" appendix if the spec has one (for example RFC 9110 Appendix A, RFC 9112 Appendix A, RFC 3986 Appendix A). It is already assembled and has list rules expanded.
2. With an RFCXML v3 file, extract the tagged blocks: `xmllint --xpath '//sourcecode[@type="abnf"]/text()' spec/rfcNNNN.xml > spec/grammar.raw.abnf`. Older v2 XML uses `<artwork type="abnf">`.
3. With only text, use `aex` from the bap distribution (`https://github.com/fenner/bap`, build with `./configure && make`): `aex spec/rfc3986.txt > spec/grammar.raw.abnf`.
4. Apply every `errata_log` row with `action` `APPLY` whose section contains ABNF. Record each in `errata_applied`.

### Output
`spec/grammar.raw.abnf`.

### Quality Gate
- File is non-empty: `wc -l spec/grammar.raw.abnf`.
- The number of rule definitions (`grep -cE '^[A-Za-z][A-Za-z0-9-]*[ ]*=' spec/grammar.raw.abnf`) equals the count of rule names listed in the spec's collected ABNF or index, when one exists.

---

## Phase 2: Resolve Imports and Extensions

### Entry Criteria
- Raw grammar.

### Actions
1. Run the validator once to list undefined rules: `bap spec/grammar.raw.abnf`. Read its output for "undefined" and "unused" rule messages. Confirm option names with `bap -h`; do not guess flags.
2. Resolve each undefined rule with this table:

   | Undefined rule | Source |
   |---|---|
   | ALPHA, BIT, CHAR, CR, CRLF, CTL, DIGIT, DQUOTE, HEXDIG, HTAB, LF, LWSP, OCTET, SP, VCHAR, WSP | RFC 5234 Appendix B.1 core rules; append them verbatim |
   | Rule the spec says is "defined in [RFCxxxx]" | copy it from that RFC (for example `URI-reference` from RFC 3986, `token` from RFC 9110 Section 5.6.2); record in `imported` |
   | Rule defined only in prose | write it as ABNF from the prose and mark it with a `; derived from prose, Section X` comment; add to the ambiguity log |

3. Expand non-standard syntax. RFC 9110 Section 5.6.1 defines `#element` lists; standard ABNF tools do not accept `#`. Replace `1#element` with `element *( OWS "," OWS element )` and `#element` with `[ element *( OWS "," OWS element ) ]` as RFC 9110 Section 5.6.1.1 shows for senders. Recipients must also accept empty list elements per Section 5.6.1.2; note that in `extensions_expanded`.
4. Case sensitivity: RFC 5234 quoted strings are case-insensitive. RFC 7405 adds `%s"..."` (case-sensitive) and `%i"..."` (insensitive). List every literal that the spec text says is case-sensitive in `case_sensitive_literals` and rewrite it as `%s"..."` or as `%x` codes.
5. Write the self-contained result to `spec/grammar.abnf`.

### Output
`spec/grammar.abnf`.

### Quality Gate
- `bap spec/grammar.abnf` reports zero undefined rules.
- `grep -c '#' spec/grammar.abnf` counts only comment uses of `#` (none in rule bodies).

---

## Phase 3: Cross-Validate

### Entry Criteria
- `spec/grammar.abnf` passes `bap`.

### Actions
1. Validate with a second tool: paste the file into the IETF author tools ABNF checker at `https://author-tools.ietf.org/abnf` (or its API if available) and save the output to `spec/grammar.check.txt`.
2. Resolve any difference between the two validators by reading RFC 5234 Section 4 (ABNF definition of ABNF).
3. Record the start rule(s) a parser will use (for example `URI-reference` for RFC 3986).
4. Write `grammar_report`.

### Output
`grammar_file`, `grammar_report`.

### Quality Gate
- Both validators report zero errors, with outputs saved.
- `grammar_report.imported` lists the source RFC section for every imported rule.

---

## Worked Example

Illustrative. RFC 3986 (URI generic syntax).

Phase 1: RFC 3986 Appendix A is the collected ABNF. `aex spec/rfc3986.txt > spec/grammar.raw.abnf` extracts the rules.

Phase 2:
```
$ bap spec/grammar.raw.abnf
... ALPHA ... undefined
... DIGIT ... undefined
... HEXDIG ... undefined
```
Append RFC 5234 core rules. Rerun: zero undefined. Scheme names are case-insensitive (RFC 3986 Section 3.1) so no `%s` rewrite is needed.

Phase 3: author-tools reports no errors. Start rule `URI-reference`.

---

## Exit Criteria

DONE when `grammar_file` is one self-contained ABNF file that passes two validators with zero undefined rules, and every import, extension expansion, case-sensitivity rewrite and erratum is listed in `grammar_report`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `aex` picks up non-ABNF artwork | **Adjust**: delete the non-rule lines by hand and recount rules against the spec. |
| Phase 2 | Imported rule conflicts with a local rule of the same name | **Adjust**: prefix the imported one (`rfc3986-host`) and update references. |
| Phase 2 | Prose-only rule | **Adjust**: write it, comment it, and log it in the ambiguity log. |
| Phase 3 | Validators disagree | **Adjust**: RFC 5234 Section 4 decides; record the decision in `grammar_report`. |
| Phase 3 | `bap` will not build | **Retry** with author-tools only and record that one validator was used. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
