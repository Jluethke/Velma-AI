# Patent Boundary Mapper

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Maps the boundaries between related patent families to ensure claims don't overlap, cross-references are correct, and each family's scope is clearly delineated. Produces a boundary mapping document showing which innovations belong to which family, where families interface, and where potential claim conflicts exist. Essential for multi-family patent portfolios.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INVENTORY   --> Catalog all families and their core claims
PHASE 2: MAP         --> Identify overlaps and interfaces between families
PHASE 3: DELINEATE   --> Draw clear boundaries and resolve conflicts
PHASE 4: CROSSREF    --> Generate cross-reference recommendations
PHASE 5: DOCUMENT    --> Produce boundary mapping document
```

## Inputs

- `families`: list[object] -- Each family: {name, claims_summary, core_innovation, domain}
- `family_claims`: list[object] -- Full claim sets for each family being mapped
- `known_interfaces`: list[object] -- Optional known points where families interact

## Outputs

- `boundary_map`: object -- Visual map showing each family's scope and interfaces
- `conflicts`: list[object] -- Claim overlaps that need resolution
- `cross_references`: list[object] -- Recommended cross-reference statements between families
- `boundary_document`: string -- Complete BoundaryMapping.md document

---

## Execution

### PHASE 1: INVENTORY — Catalog Families

**Entry criteria:** At least 2 patent families provided

**Actions:**
1. For each family, extract:
   - Core innovation in one sentence
   - Key claim elements from independent claims
   - Domain and technical scope
   - What the invention governs/controls/manages
2. Build a family inventory table: Family | Core Innovation | Scope | Key Elements.
3. Identify the "governs X" statement for each family — what aspect of the system does this patent own?

**Output:** Family inventory with scope statements.

**Quality gate:** Every family has a clear, non-overlapping scope statement.

---

### PHASE 2: MAP — Find Overlaps and Interfaces

**Entry criteria:** Family inventory complete

**Actions:**
1. Compare each pair of families. For each pair, ask:
   - Do any claim elements appear in both families?
   - Do the families describe the same component differently?
   - Does one family's output become another family's input?
   - Could a single implementation element be claimed by both?
2. Categorize each relationship:
   - **Interface**: Families connect but don't overlap (A's output feeds B's input)
   - **Overlap**: Both families claim similar elements (needs resolution)
   - **Complement**: Families cover different aspects of the same system
   - **Independent**: No meaningful relationship
3. Map all interfaces: what data, signals, or control flows between families.

**Output:** Pairwise relationship matrix with overlap and interface details.

**Quality gate:** Every family pair is analyzed. All overlaps are identified.

---

### PHASE 3: DELINEATE — Resolve Boundaries

**Entry criteria:** Overlap analysis complete

**Actions:**
1. For each overlap, determine which family should own the claim element:
   - The family where the element is CORE owns it
   - The family where the element is PERIPHERAL references it
2. Draft boundary rules: "[Element X] is claimed in Family [N]. Family [M] references but does not claim [Element X]."
3. Recommend claim modifications to resolve any true conflicts:
   - Remove duplicated claims from the peripheral family
   - Add "wherein" clauses that scope the element to the owning family's context
   - Convert overlapping claims to cross-reference dependent claims
4. Ensure no "orphan" innovations — every claimable element belongs to exactly one family.

**Output:** Boundary rules, claim modification recommendations.

**Quality gate:** Every overlap resolved. Every element assigned to exactly one family.

---

### PHASE 4: CROSSREF — Generate Cross-References

**Entry criteria:** Boundaries delineated

**Actions:**
1. For each interface between families, draft a cross-reference statement:
   - "Related to Family [N] ([Name]): [relationship description]"
2. For each complement relationship, draft language for the specification:
   - "The [element] described herein interfaces with the [other invention] disclosed in [co-pending application]."
3. Recommend which specifications need cross-reference sections updated.

**Output:** Cross-reference statements for each family pair.

**Quality gate:** Every interface has a cross-reference. Language is patent-appropriate.

---

### PHASE 5: DOCUMENT — Produce Boundary Map

**Entry criteria:** All boundaries resolved and cross-references drafted

**Actions:**
1. Generate the BoundaryMapping.md document with:
   - Family inventory table
   - Scope delineation rules
   - Pairwise relationship descriptions
   - Cross-reference recommendations
   - Conflict resolutions applied
   - Visual boundary diagram (ASCII or description)
2. Include a "What belongs where" quick reference table.

**Output:** Complete boundary mapping document.

**Quality gate:** Document is self-contained. A patent attorney can use it to verify claim scope.

## Exit Criteria

The skill is DONE when:
1. Every family pair has been analyzed for overlap
2. All overlaps are resolved with clear ownership
3. Cross-references are drafted for all interfaces
4. Boundary document is complete and self-contained
5. No claim element is claimed by more than one family

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| INVENTORY | Family claims not provided | **Escalate** -- cannot map boundaries without claim sets |
| MAP | Families are too similar to distinguish | **Flag** -- recommend merging families, document rationale |
| DELINEATE | Both families have equal claim to an element | **Flag** -- present options, require human decision |
| CROSSREF | No clear interface between families | **Adjust** -- mark as independent, skip cross-reference |
| DOCUMENT | Too many families for clear visualization | **Adjust** -- group related families, use hierarchical layout |

## State Persistence

Between runs, this skill accumulates:
- **Family registry**: all patent families mapped with current scope
- **Boundary precedents**: how overlaps were resolved in past mappings
- **Cross-reference templates**: reusable language for common relationships

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
