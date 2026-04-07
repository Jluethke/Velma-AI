# Patent Claims Drafter

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Drafts patent claims from invention descriptions, source code, and technical documentation. Produces independent claims (system, method, computer-readable medium) and dependent claims following USPTO conventions. Focuses on functional language, avoids implementation specifics, and ensures claims are broad enough for protection while specific enough for novelty.

## Execution Pattern: Phase Pipeline

```
PHASE 1: ANALYZE     --> Understand the invention from all source materials
PHASE 2: IDENTIFY    --> Extract novel elements that distinguish from prior art
PHASE 3: INDEPENDENT --> Draft 3 independent claims (system, method, CRM)
PHASE 4: DEPENDENT   --> Draft dependent claims narrowing each independent
PHASE 5: VALIDATE    --> Check for common patent claim errors
```

## Inputs

- `invention_description`: string -- High-level description of the invention, what it does, what problem it solves
- `source_code_paths`: list[string] -- Paths to implementation files (for extracting claimable features)
- `technical_docs`: string -- Any existing specs, design docs, or provisional drafts
- `prior_art_notes`: string -- Optional notes on what exists already and how this differs
- `domain`: string -- The domain (e.g., "autonomous systems", "distributed computing", "machine learning")

## Outputs

- `independent_claims`: list[object] -- 3 independent claims: system, method, CRM
- `dependent_claims`: list[object] -- Dependent claims with parent references
- `claim_tree`: object -- Visual hierarchy showing claim dependencies
- `novelty_elements`: list[string] -- The key novel elements each claim covers
- `red_flags`: list[string] -- Potential issues (too narrow, implementation language, product names)

---

## Execution

### PHASE 1: ANALYZE — Understand the Invention

**Entry criteria:** At least invention_description or technical_docs provided

**Actions:**
1. Read all provided source materials. Build a mental model of: what the invention does, what inputs it takes, what outputs it produces, what processing steps occur between input and output.
2. Identify the core pipeline or architecture. Patent claims describe a system in terms of modules/components and their relationships — find these.
3. Extract all configurable parameters, thresholds, and modes. These become dependent claims ("wherein the threshold is configurable").
4. Note any domain-specific terminology that must be generalized. Replace product names with functional descriptions. Replace programming language constructs with abstract equivalents.

**Output:** Invention model with components, data flow, processing steps, and configurable elements.

**Quality gate:** The invention model captures every major functional element without referencing specific implementations.

---

### PHASE 2: IDENTIFY — Extract Novel Elements

**Entry criteria:** Invention model complete

**Actions:**
1. List every functional element that could be claimed.
2. Identify which elements are NOVEL — not found in prior art. These become the focus of independent claims.
3. Group novel elements by independence. Elements that stand alone go in independent claims. Elements that narrow or refine go in dependent claims.
4. Rank elements by defensibility. Broad functional claims > specific implementation claims. Process claims > apparatus claims for software.
5. Identify the minimum novel combination — the smallest set of elements that, together, distinguish this invention from everything before it.

**Output:** Ranked list of novel elements with grouping into independent vs. dependent claim candidates.

**Quality gate:** At least 3 distinct novel elements identified. Each can be expressed without implementation language.

---

### PHASE 3: INDEPENDENT — Draft Independent Claims

**Entry criteria:** Novel elements identified and ranked

**Actions:**
1. Draft Claim 1 (System): "A system comprising: [modules/components with functional relationships]". Each element uses functional language ("a module configured to..." not "a Python class that...").
2. Draft Claim N (Method): "A method comprising: [ordered steps corresponding to system claim]". Mirror the system claim structure as process steps.
3. Draft Claim M (Computer-Readable Medium): "A non-transitory computer-readable medium storing instructions that, when executed by a processor, cause the processor to: [steps]".
4. Ensure all three independent claims cover the same core invention from different angles.
5. Use "configured to", "operable to", "adapted to" — never "programmed in", "coded with", "implemented using".
6. Remove ALL product names, library names, language names, framework names.
7. Make all numerical thresholds configurable ("a configurable threshold" not "a threshold of 0.3").

**Output:** Three independent claims with preamble, transitional phrase, and body.

**Quality gate:** Zero implementation language. Zero product names. Each claim is self-contained and readable without the others.

---

### PHASE 4: DEPENDENT — Draft Dependent Claims

**Entry criteria:** Independent claims drafted

**Actions:**
1. For each independent claim, identify features that narrow the scope:
   - Specific configurations of modules
   - Optional sub-components
   - Specific mathematical functions or algorithms (expressed functionally)
   - Specific data formats or structures
   - Specific modes of operation
   - Cross-references to related patent families
2. Draft each dependent claim as: "The [system/method/medium] of claim [N], wherein [narrowing limitation]."
3. Build a claim tree showing which dependent claims hang from which independent claims.
4. Aim for 15-25 total claims (3 independent + 12-22 dependent). More dependent claims = more fallback positions.
5. Include at least one dependent claim for each major configurable parameter.
6. Include cross-reference claims to related patent families where applicable.

**Output:** Complete dependent claim set with parent references and claim tree.

**Quality gate:** Every dependent claim adds meaningful narrowing. No orphan claims. No circular references.

---

### PHASE 5: VALIDATE — Check for Errors

**Entry criteria:** Full claim set drafted

**Actions:**
1. Scan every claim for forbidden language:
   - Product names (e.g., "NeuroPRIN", "TensorFlow", "Python")
   - Implementation language (e.g., "function", "class", "array", "loop")
   - Fixed numerical values without "configurable" qualifier
   - Trademarked terms
2. Verify antecedent basis: every term in a dependent claim must appear in its parent chain or be properly introduced.
3. Verify claim differentiation: no two dependent claims say the same thing differently.
4. Check independent claim breadth: are they broad enough to cover alternative implementations?
5. Verify the 3 independent claims are consistent — they describe the same invention as system/method/CRM.
6. Generate red_flags list for anything that needs human review.

**Output:** Validated claim set with red_flags.

**Quality gate:** Zero forbidden language. All antecedent basis resolved. Red flags documented.

## Exit Criteria

The skill is DONE when:
1. 3 independent claims drafted (system, method, CRM)
2. 12+ dependent claims drafted with proper parent references
3. Zero implementation language or product names in any claim
4. All thresholds expressed as configurable
5. Claim tree generated showing hierarchy
6. Red flags documented for human review

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| ANALYZE | Insufficient source material | **Flag** -- list what's missing, draft claims from available info, note gaps |
| IDENTIFY | No clearly novel elements found | **Escalate** -- report analysis, suggest the invention may need repositioning |
| INDEPENDENT | Claims too narrow or too broad | **Adjust** -- iterate on scope, note trade-offs in red_flags |
| DEPENDENT | Too few narrowing features | **Adjust** -- re-examine source code for additional claimable features |
| VALIDATE | Implementation language found | **Fix** -- replace with functional equivalents, re-validate |

## State Persistence

Between runs, this skill accumulates:
- **Claim patterns**: successful claim structures per domain
- **Forbidden term dictionary**: terms flagged across patent families
- **Cross-reference map**: which families reference which others

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
