# Patent Specification Writer

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Writes a complete patent specification document from claims, invention descriptions, and source code. Produces all required sections: Title, Field, Background, Summary, Detailed Description, and Abstract. Ensures the specification enables the claims (enablement requirement), describes the best mode, and differentiates from prior art. Outputs USPTO-ready markdown.

## Execution Pattern: Phase Pipeline

```
PHASE 1: SCAFFOLD    --> Build document skeleton, plan figure set
PHASE 2: BACKGROUND  --> Write problem statement and prior art differentiation
PHASE 3: DESCRIPTION --> Write detailed description enabling every claim element
PHASE 4: SUMMARY     --> Write summary and abstract from completed description
PHASE 5: CROSSREF    --> Add cross-references to related patent families
PHASE 6: FIGURES     --> Generate complete drawing descriptions for downstream pipeline
PHASE 7: REVIEW      --> Verify enablement, consistency, and completeness
```

## Inputs

- `claims`: list[object] -- The claim set (from patent-claims-drafter or existing Claims.md)
- `invention_description`: string -- High-level description of what the invention does
- `source_code_paths`: list[string] -- Implementation files for enablement details
- `prior_art`: list[object] -- Known prior art with names and descriptions of how this invention differs
- `related_families`: list[object] -- Related patent families for cross-references (e.g., [{name: "Family B — ALG", relationship: "complementary governance layer"}])
- `domain`: string -- Technical domain for appropriate terminology

## Outputs

- `specification`: string -- Complete specification document in markdown
- `abstract`: string -- Abstract under 150 words
- `figure_descriptions`: list[object] -- Formal figure descriptions for the drawing pipeline. Each: {figure_number, title, drawing_type_hint, description, components}. CRITICAL: these must be complete enough for a patent drawing generator to produce USPTO-compliant drawings without any other input.
- `enablement_map`: object -- Maps each claim element to where it's described in the specification
- `completeness_report`: object -- Sections present/missing, word counts, enablement coverage

---

## Execution

### PHASE 1: SCAFFOLD — Build Document Structure

**Entry criteria:** Claims provided

**Actions:**
1. Create document skeleton with sections in USPTO order:
   - Title of the Invention
   - Cross-Reference to Related Applications
   - Field of the Invention
   - Background of the Invention (Problem Statement + Distinction from Prior Art)
   - Summary of the Invention
   - Brief Description of the Drawings
   - Detailed Description of Preferred Embodiments
   - Claims (reference to separate claims document)
   - Abstract
2. Extract every unique term from the claims. Each must be defined in the specification.
3. Determine which claim elements need detailed enablement (complex or non-obvious elements).
4. Plan the drawing set: determine how many figures are needed to illustrate the invention. At minimum:
   - FIG. 1: System architecture block diagram (all major components from independent system claim)
   - FIG. 2: Method flowchart (steps from independent method claim)
   - FIG. 3+: Additional figures for subsystem detail, state machines, data flow, mathematical relationships
5. For each planned figure, create a structured description: figure_number, title, drawing_type_hint (block_diagram/flowchart/state_machine/sequence_diagram/data_flow/graph), narrative description listing every component and connection, and component list.

**Output:** Document skeleton with section headers, term list, and planned figure set.

**Quality gate:** All required sections present. Every claim term cataloged. At least 3 figures planned with complete descriptions.

---

### PHASE 2: BACKGROUND — Problem and Prior Art

**Entry criteria:** Document skeleton and prior art inputs

**Actions:**
1. Write Field of the Invention: one paragraph situating the invention in its technical domain.
2. Write Background / Problem Statement: describe the problem that existing approaches fail to solve. Focus on what's missing, not what exists.
3. Write Distinction from Prior Art subsection: for each prior art reference, explicitly state:
   - What the prior art does
   - What the prior art does NOT do
   - How the present invention differs on each point
4. Use specific, technical language. Name the prior art systems. Explain the gap clearly.

**Output:** Completed Background section with prior art differentiation.

**Quality gate:** Every prior art reference has explicit differentiation. The gap between prior art and invention is clear.

---

### PHASE 3: DESCRIPTION — Detailed Enablement

**Entry criteria:** Claims analyzed, source code available

**Actions:**
1. Write System Architecture section: describe the major components from the independent system claim. Explain how they connect, what data flows between them, and the overall processing pipeline.
2. For EACH claim element (independent and dependent), write a subsection explaining:
   - What the element does
   - How it works (enough detail that a skilled practitioner could implement it)
   - Why it matters (what goes wrong without it)
   - Example values or configurations (as embodiments, not limitations)
3. Include mathematical descriptions where claims reference functions or computations (e.g., "exponential decay", "monotonic non-increasing function"). Write equations inline.
4. Describe at least 2-3 example embodiments showing the invention applied in different domains.
5. Include a Data Flow section walking through a complete processing cycle.
6. Write all descriptions in present tense, third person, passive voice where possible ("the trust value is computed by...").
7. Never use product names, library names, or language names. Describe functionally.

**Output:** Complete Detailed Description section.

**Quality gate:** Every claim element has a corresponding description. A skilled practitioner could implement the invention from this description alone.

---

### PHASE 4: SUMMARY — Abstract and Summary

**Entry criteria:** Detailed Description complete

**Actions:**
1. Write Summary of the Invention: 2-3 paragraphs summarizing what the invention provides. Mirror the independent claims in prose form.
2. Write Abstract: under 150 words. One paragraph. Describes the technical disclosure without legal language. No "claim" or "wherein" language in abstract.
3. Write Title: concise but descriptive. Under 15 words. No product names.

**Output:** Title, Summary, and Abstract.

**Quality gate:** Abstract under 150 words. Title under 15 words. Neither contains product names.

---

### PHASE 5: CROSSREF — Cross-References

**Entry criteria:** Related families provided

**Actions:**
1. Write Cross-Reference to Related Applications section listing each related patent family.
2. For each related family, add a brief description of the relationship (e.g., "complementary governance layer", "coordination subsystem").
3. Add inline cross-references in the Detailed Description wherever the invention interfaces with or complements a related family's invention.

**Output:** Cross-reference section and inline references.

**Quality gate:** All related families referenced. Relationships clearly described.

---

### PHASE 6: FIGURES — Generate Drawing Descriptions

**Entry criteria:** Detailed Description and claims are complete

**Actions:**
1. For each figure planned in Phase 1, write a complete formal description:
   - Figure number (FIG. 1, FIG. 2, etc.)
   - Title (e.g., "System Architecture Block Diagram", "Trust Computation Flowchart")
   - Drawing type hint: one of block_diagram, flowchart, state_machine, sequence_diagram, data_flow, graph
   - Narrative description: a paragraph describing EVERY component shown, EVERY connection between components, and EVERY data label on connections. Use EXACT claim terminology for all component names.
   - Components list: array of {name, reference_numeral_hint, description} for each element in the figure
2. Write the "Brief Description of the Drawings" specification section using these descriptions:
   - "FIG. 1 is a block diagram illustrating [description]."
   - "FIG. 2 is a flowchart illustrating [description]."
3. Output the figure_descriptions as a structured list (separate from the specification string) so downstream drawing skills can consume them directly.
4. Ensure every component named in an independent claim appears in at least one figure.
5. Ensure every figure is referenced in the Detailed Description.

**Output:** figure_descriptions list, Brief Description of the Drawings section added to specification.

**Quality gate:** Every independent claim element appears in at least one figure. Every figure has a complete component list. Drawing type hints are valid.

---

### PHASE 7: REVIEW — Verify Completeness

**Entry criteria:** All sections drafted

**Actions:**
1. Build enablement map: for each claim element, record which specification section describes it.
2. Check for gaps: any claim element without a corresponding specification description is a filing risk.
3. Verify no implementation language leaked into the specification (product names, language names).
4. Verify prior art differentiation is explicit and specific.
5. Verify abstract is under 150 words.
6. Generate completeness report with section word counts and coverage percentages.

**Output:** Enablement map, completeness report, final specification.

**Quality gate:** 100% claim element coverage. Zero implementation language. Abstract under limit.

## Exit Criteria

The skill is DONE when:
1. All required specification sections are written
2. Every claim element is described in the Detailed Description
3. Prior art differentiation is explicit for each reference
4. Abstract is under 150 words
5. Zero product names or implementation language
6. Cross-references to related families included
7. Enablement map shows 100% coverage
8. figure_descriptions output contains at least 3 figures with complete component lists
9. Every independent claim element appears in at least one figure description
10. Brief Description of the Drawings section is written (not placeholder)

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| SCAFFOLD | Claims not provided | **Escalate** -- cannot write specification without claims |
| BACKGROUND | No prior art provided | **Adjust** -- write background without differentiation, flag for human review |
| DESCRIPTION | Source code unavailable for a claim element | **Flag** -- write description from claims alone, note reduced enablement |
| DESCRIPTION | Claim element too abstract to describe | **Flag** -- describe at highest level possible, note that element may need narrowing |
| SUMMARY | Abstract exceeds 150 words | **Fix** -- compress until under limit |
| REVIEW | Claim element not covered in specification | **Fix** -- add description, re-review |

## State Persistence

Between runs, this skill accumulates:
- **Section templates**: effective specification structures per domain
- **Prior art database**: prior art references with differentiation language
- **Term glossary**: functional equivalents for common implementation terms

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
