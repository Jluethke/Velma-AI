# Patent Specification Aligner

Ensures consistency between patent claims, specification text, and drawings by validating reference numerals, generating proper "Detailed Description of the Drawings" sections, and flagging mismatches.

## Execution Pattern: Phase Pipeline

```
PHASE 1: EXTRACT    --> Parse claims for key terms, spec for figure refs, drawings for numerals
PHASE 2: MAP        --> Build claim-term-to-numeral-to-figure cross-reference table
PHASE 3: VALIDATE   --> Find mismatches: terms in claims missing from drawings, numerals not in spec
PHASE 4: GENERATE   --> Write "Detailed Description of the Drawings" with inline numerals
PHASE 5: RECONCILE  --> Update figure description section to match drawing labels exactly
```

## Inputs
- claims_text: string -- Full text of patent claims (independent + dependent)
- specification_text: string -- Full text of patent specification
- drawings_json: object -- Drawings data with reference_numerals per figure
- patent_family: string -- Patent family identifier

## Outputs
- detailed_description_section: string -- Complete "Detailed Description of the Drawings" section ready to insert into specification, with inline reference numerals in parentheses
- alignment_report: object -- Cross-reference table showing claim term -> reference numeral -> figure number
- updated_figure_descriptions: string -- Updated "Brief Description of the Drawings" section with numeral references
- consistency_violations: list -- Any mismatches found between claims, spec, and drawings

## Execution

### PHASE 1: EXTRACT -- Parse All Three Documents

**Entry criteria:** Claims, specification, and drawings JSON provided
**Actions:**
1. From CLAIMS: Extract every noun phrase that names a component, module, interface, or system element. Track which claim number introduces each term.
2. From SPECIFICATION: Find all existing figure references ("FIG. X"), extract what each figure is described as showing. Find any existing inline reference numerals.
3. From DRAWINGS JSON: Extract all reference numerals and their labels from every figure. Build a master numeral table.

**Output:** Three extracted term lists (claims terms, spec figure descriptions, drawing numerals)
**Quality gate:** Every independent claim term is captured. Every figure is accounted for.

### PHASE 2: MAP -- Build Cross-Reference Table

**Entry criteria:** Extracted terms from all three documents
**Actions:**
1. For each claim term, find the matching reference numeral in the drawings
2. For each reference numeral, identify which figure(s) it appears in
3. Build a master cross-reference table:

| Claim Term | Claim # | Ref Numeral | Figure(s) | Drawing Label | Match? |
|-----------|---------|-------------|-----------|---------------|--------|
| expectation interface | 1a | 100 | FIG. 1 | Expectation Interface | YES |

4. Flag any claim terms that have NO matching numeral in any drawing
5. Flag any drawing numerals that don't correspond to any claim term

**Output:** Cross-reference table with match status
**Quality gate:** Every independent claim element has a corresponding numeral and figure

### PHASE 3: VALIDATE -- Find Consistency Violations

**Entry criteria:** Cross-reference table
**Actions:**
1. Check: Every term in an independent claim appears in at least one drawing with a reference numeral
2. Check: Every reference numeral in a drawing uses the same label text as the claim term (not a paraphrase)
3. Check: The specification's figure description section lists the same figures as the drawings
4. Check: No two different components share the same reference numeral
5. Check: Reference numerals are consistent across figures (same component = same numeral everywhere)
6. Categorize violations:
   - CRITICAL: Claim term missing from all drawings
   - CRITICAL: Drawing numeral contradicts claim term
   - WARNING: Dependent claim term not in drawings (acceptable but suboptimal)
   - INFO: Drawing shows element not in any claim (acceptable for context)

**Output:** Violation list with severity
**Quality gate:** Zero CRITICAL violations (or explicit remediation for each)

### PHASE 4: GENERATE -- Write Detailed Description of the Drawings

**Entry criteria:** Cross-reference table, violations resolved
**Actions:**
1. For each figure (in order), write a paragraph that:
   - Opens with "Referring to FIG. X, ..." or "FIG. X illustrates ..."
   - Names every labeled component with its reference numeral in parentheses on first mention
   - Describes the connections/flows shown in the drawing
   - Uses the EXACT same terms as the claims (not paraphrases)
   - Cross-references other figures where components appear in multiple drawings
2. Follow USPTO Detailed Description conventions:
   - First mention of a numeral: "the expectation interface (100)"
   - Subsequent mentions: "the expectation interface (100)" or just "(100)" if context is clear
   - Each paragraph covers one figure
   - Use present tense: "comprises," "receives," "computes," "produces"

**Output:** Complete "Detailed Description of the Drawings" section
**Quality gate:** Every reference numeral appears at least once. Every claim term is used with its numeral.

### PHASE 5: RECONCILE -- Update Figure Description Section

**Entry criteria:** Detailed description generated
**Actions:**
1. Rewrite the "Brief Description of the Drawings" (the short figure list) to match:
   - Use claim-aligned terminology
   - Reference key numerals
   - Example: "FIG. 1 is a system block diagram of a system for runtime governance showing the expectation interface (100), observation interface (102), divergence computation module (104), trust inference module (106) including neural trust inference component (108), authority mapping module (110), enforcement adapter (114), and audit artifact generator (116)."
2. Produce final updated figure descriptions section

**Output:** Updated brief figure descriptions with numerals
**Quality gate:** Every figure description uses claim terms and key numerals

## Exit Criteria

Done when:
- Cross-reference table is complete with all claim terms mapped
- Zero CRITICAL consistency violations remain
- Detailed Description of Drawings section is generated with inline numerals
- Brief Description of Drawings is updated with claim terms and numerals
- All three documents (claims, spec, drawings) use consistent terminology

## Error Handling

| Phase | Failure Mode | Response |
|-------|-------------|----------|
| EXTRACT | Claim term is ambiguous | Flag for human review with both interpretations |
| MAP | Claim term has no drawing numeral | CRITICAL violation -- drawing must be updated |
| MAP | Drawing numeral has no claim term | INFO -- acceptable for context elements |
| VALIDATE | Same numeral used for different components | CRITICAL -- renumber one component |
| GENERATE | Figure too complex for single paragraph | Split into sub-paragraphs (FIG. Xa, Xb) |
