# BCP 14 Keyword Scan

**One-line description:** Determines which requirement-keyword convention the spec uses (RFC 2119 only, RFC 2119 plus RFC 8174, WHATWG Infra lowercase, ISO "shall"), then locates every normative keyword occurrence with an exact grep or XPath, excluding non-normative sections, so no requirement is missed or invented.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `spec_bundle` (object, required): From `s2i-spec-acquire-pin`.
- `errata_log` (object[], required): From `s2i-errata-check`. Rows with `action` `APPLY` replace the published sentence.

---

## Outputs

- `keyword_hits` (object[]): One row per keyword occurrence: `{ "doc", "section", "line", "keyword", "sentence", "normative": true|false, "reason" }`.
- `keyword_convention` (string): One of `BCP14_8174`, `RFC2119_ONLY`, `WHATWG_INFRA`, `ISO_DIRECTIVES`, `NONE_DECLARED`.

---

## Phase 1: Determine the Convention

### Entry Criteria
- Spec text file listed in `spec_bundle.files`.

### Actions
1. Search for the boilerplate: `grep -n -A4 'key words' spec/rfcNNNN.txt`.
2. Set `keyword_convention` from this table:

   | Boilerplate found | `keyword_convention` | How to read keywords |
   |---|---|---|
   | Cites "BCP 14", RFC 2119 and RFC 8174, "when, and only when, they appear in all capitals" | `BCP14_8174` | Only ALL-CAPS words are keywords. Lowercase "must" is plain English and is NOT a requirement. |
   | Cites RFC 2119 only | `RFC2119_ONLY` | ALL-CAPS words are keywords. Lowercase "must"/"should" is ambiguous; RFC 8174 was written because of this. Record each lowercase occurrence as a candidate for the ambiguity log. |
   | WHATWG standard referencing the Infra Standard | `WHATWG_INFRA` | Lowercase "must", "should", "may" are normative (RFC 2119 meaning) outside sections marked non-normative. |
   | ISO/IEC document | `ISO_DIRECTIVES` | ISO/IEC Directives Part 2 verbal forms: "shall"/"shall not" = requirement, "should"/"should not" = recommendation, "may" = permission, "can" = possibility (not a requirement). |
   | None of the above | `NONE_DECLARED` | **Return** to the user: no keyword convention, so every requirement must be extracted by reading, and the table will carry a "derived" flag. |

3. Note the RFC 8174 rule: keywords keep their meaning only when capitalized; "NOT RECOMMENDED" is one keyword, not "NOT" plus "RECOMMENDED".

### Output
`keyword_convention`.

### Quality Gate
- The boilerplate paragraph (or its absence) is quoted with its line number.
- Exactly one table row is chosen.

---

## Phase 2: Locate Every Occurrence

### Entry Criteria
- `keyword_convention` set.

### Actions
1. If an RFCXML v3 file (`.xml`) is in the bundle, use it; it marks keywords explicitly:
   `xmllint --xpath 'count(//bcp14)' spec/rfc9113.xml` gives the total, and
   `xmllint --xpath '//bcp14/text()' spec/rfc9113.xml | sort | uniq -c` gives counts per keyword.
2. Otherwise grep the text. For `BCP14_8174` and `RFC2119_ONLY` (case-sensitive, longest forms first):
   `grep -nE '\b(MUST NOT|SHALL NOT|SHOULD NOT|NOT RECOMMENDED|MUST|SHALL|SHOULD|REQUIRED|RECOMMENDED|MAY|OPTIONAL)\b' spec/rfc6455.txt`
3. For `RFC2119_ONLY`, also run the lowercase scan and keep the hits as ambiguity candidates:
   `grep -nwE '(must|shall|should|required|recommended|may|optional)' spec/rfc6455.txt`
4. For `WHATWG_INFRA`, run the lowercase scan as the main scan. For `ISO_DIRECTIVES`, scan `-w` for `shall|shall not|should|should not|may`.
5. RFC text files wrap sentences across lines and across page breaks (form feed, page header and footer lines). For each hit, rebuild the whole sentence by reading the lines above and below; drop page header/footer lines (lines matching `^RFC [0-9]+ ` or `\[Page [0-9]+\]$`).
6. Apply errata: for each `errata_log` row with `action` `APPLY`, replace the hit's sentence with the corrected text and set `reason` to the erratum ID.

### Output
Raw hit list with full sentences.

### Quality Gate
- With XML available, the number of hits equals `count(//bcp14)`.
- Without XML, the number of hits equals `grep -cE '<same pattern>'` (lines) or more when one line holds two keywords.
- Every hit has a full sentence, not a line fragment.

---

## Phase 3: Exclude Non-Normative Text

### Entry Criteria
- Raw hit list.

### Actions
1. Set `normative` to false, with `reason`, for hits in these places:
   - The keyword boilerplate paragraph itself.
   - Sections titled or marked "Informative References", "Acknowledgements", "Changes from", "Examples", "Appendix ... (Informative)", or containing "This section is non-normative".
   - Notes and examples that the document says are non-normative (W3C and WHATWG mark them with "Note" or "Example" boxes).
   - Quoted text from another document.
   - "Security Considerations" and "IANA Considerations" are NOT automatically non-normative; keep their hits unless the section says otherwise.
2. All other hits get `normative` true.
3. Write `keyword_hits` to `spec/keyword_hits.json`.

### Output
`keyword_hits`, `keyword_convention`.

### Quality Gate
- Every `normative: false` row has a `reason` naming the section.
- `python -m json.tool spec/keyword_hits.json` exits 0.

---

## Worked Example

Illustrative. RFC 6455 (published 2011, before RFC 8174).

Phase 1: `grep -n -A4 'key words' spec/rfc6455.txt` shows the RFC 2119 boilerplate in Section 2.1. `keyword_convention` = `RFC2119_ONLY`.

Phase 2:
```
$ grep -nE '\b(MUST NOT|...|OPTIONAL)\b' spec/rfc6455.txt | wc -l
<N>
$ grep -nE '\bMUST\b' spec/rfc6455.txt | head -3
...: a client MUST mask all frames that it sends to the server ...
```
Rebuilt sentence (Section 5.1): "To avoid confusing network intermediaries ... a client MUST mask all frames that it sends to the server (see Section 5.3 for further details)."

Lowercase scan adds candidates such as sentences with "must be" in descriptive prose; they are marked for the ambiguity log, not the requirements table.

Phase 3: The hit inside Section 2.1 (the boilerplate) gets `normative: false`.

---

## Exit Criteria

DONE when `keyword_convention` is set and every keyword occurrence in every bundle document is in `keyword_hits` with its full sentence and a normative flag.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Boilerplate missing from an IETF document | **Adjust**: set `RFC2119_ONLY` if RFC 2119 is in Normative References, else `NONE_DECLARED`, and say which in the output. |
| Phase 2 | XML count and text grep count differ | **Adjust**: trust the XML; the text grep missed hits split across lines. |
| Phase 2 | Hit sentence spans a page break | **Adjust**: remove the header and footer lines and join the halves. |
| Phase 3 | Unsure whether a section is normative | **Return** the hit as normative and add the question to the ambiguity log; never drop a possible requirement. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
