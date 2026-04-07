# Patent Drawing Generator

Generate USPTO-compliant patent drawings from textual figure descriptions found in patent specifications and provisional applications.

## Execution Pattern: Phase Pipeline

```
PHASE 1: PARSE       --> Extract figure requirements from description
PHASE 2: CLASSIFY    --> Determine diagram type and USPTO requirements
PHASE 3: DESIGN      --> Create reference numeral scheme and layout
PHASE 4: RENDER      --> Generate Mermaid diagram code
PHASE 5: IMAGE       --> Render Mermaid to PNG and SVG images
PHASE 6: COMPLY      --> Verify USPTO 37 CFR 1.84 compliance
```

## Inputs
- figure_description: string -- The textual description of the figure from the patent specification (e.g., "System block diagram showing expectation interface, observation interface, divergence computation...")
- figure_number: string -- The figure number (e.g., "FIG. 1", "FIG. 7")
- patent_family: string -- Which patent family this belongs to (e.g., "Family A — NeuroPRIN")
- drawing_type: string (optional) -- Override auto-detection: "block_diagram", "flowchart", "state_machine", "sequence_diagram", "data_flow", "graph", "pipeline"

## Outputs
- mermaid_code: string -- Mermaid.js diagram code
- png_path: string -- File path to rendered PNG image
- svg_path: string -- File path to rendered SVG image
- drawing_specification: object -- Structured spec with layout, components, connections, labels
- compliance_notes: list -- USPTO 37 CFR 1.84 compliance checklist results
- reference_numerals: object -- Map of reference numeral numbers to component names (e.g., {100: "trust computation module", 102: "divergence monitor"})

## Execution

### PHASE 1: PARSE — Extract Figure Requirements

**Entry criteria:** Figure description text provided
**Actions:**
1. Parse the figure description to identify:
   - All named components/modules/blocks
   - All connections/flows/relationships between components
   - Any data labels on connections
   - Hierarchical grouping (subsystems containing sub-components)
   - Any numerical values, thresholds, or parameters shown
2. Identify the PRIMARY element (what the figure is fundamentally showing)
3. Identify SECONDARY elements (supporting context)
4. Note any cross-references to other figures

**Output:** Structured component list with relationships
**Quality gate:** Every named component in the description appears in the parsed output

### PHASE 2: CLASSIFY — Determine Diagram Type

**Entry criteria:** Parsed components and relationships
**Actions:**
1. Auto-classify the diagram type:
   - **Block diagram**: Components connected by arrows showing data/control flow (most common for system architecture)
   - **Flowchart**: Decision points with yes/no branches, sequential steps
   - **State machine**: Named states with labeled transitions between them
   - **Sequence diagram**: Multiple actors exchanging messages over time
   - **Data flow diagram**: Data transformations with labeled inputs/outputs
   - **Pipeline diagram**: Linear sequence of processing stages
   - **Graph/curve**: Mathematical relationship (e.g., trust vs authority)
2. Determine USPTO drawing requirements for this type:
   - Block diagrams: Rectangular boxes with text, arrows with labels
   - Flowcharts: Decision diamonds, process rectangles, start/end ovals
   - State machines: Circles/rounded rectangles for states, labeled arrows
   - Graphs: Axes labeled, curves clearly distinguishable

**Output:** Diagram type classification with USPTO format requirements
**Quality gate:** Classification matches the description intent

### PHASE 3: DESIGN — Reference Numerals and Layout

**Entry criteria:** Classified diagram type, parsed components
**Actions:**
1. Assign reference numerals following USPTO conventions:
   - Use 3-digit numbers starting from 100
   - Group related components: 100-series for first major subsystem, 200-series for second, etc.
   - Sub-components get sequential numbers within their group
   - Connections/flows don't get numerals unless they carry named data
2. Design layout:
   - Top-to-bottom for hierarchical systems
   - Left-to-right for pipelines and flows
   - Circular for feedback loops
   - Keep crossing lines to minimum
3. Generate reference numeral table mapping numbers to component names

**Output:** Reference numeral assignments, layout specification
**Quality gate:** Every component has a unique numeral; no numeral gaps; layout minimizes line crossings

### PHASE 4: RENDER — Generate Mermaid Code

**Entry criteria:** Design specification with numerals and layout
**Actions:**
1. Generate Mermaid.js diagram code based on classified type:
   - `graph TD` for top-down block diagrams
   - `graph LR` for left-right pipelines
   - `flowchart TD` for flowcharts with decisions
   - `stateDiagram-v2` for state machines
   - `sequenceDiagram` for sequence diagrams
   - `xychart-beta` for graphs/curves
2. Apply patent drawing style:
   - Use rectangle nodes with reference numerals in labels: `A100["100 — Trust Module"]`
   - Label all arrows/connections with data names
   - Use subgraph blocks for subsystem grouping
   - Keep text concise (patent drawings use brief labels, not sentences)
3. Add title as comment: `%% FIG. X — [Description]`

**Output:** Complete Mermaid code block
**Quality gate:** Code renders without syntax errors; all components from Phase 1 are represented

### PHASE 5: IMAGE — Render to PNG and SVG

**Entry criteria:** Valid Mermaid code from Phase 4
**Actions:**
1. Save each figure's Mermaid code to a temporary `.mmd` file
2. Run the rendering script to produce images:
   ```
   python scripts/render_drawings.py --input drawings.json --output ./drawings/ --format both
   ```
   This uses `mermaid-py` (pip install mermaid-py) which calls the Mermaid.ink API to render.
3. For each figure, generate:
   - **PNG**: `fig_XX.png` — raster image for filing and printing
   - **SVG**: `fig_XX.svg` — vector image for scaling and professional redraw
4. Verify each image rendered successfully (file exists, size > 0)
5. Generate a render report with file paths and sizes

**Output:** PNG and SVG files for each figure, render report
**Quality gate:** All figures render without errors; PNG files > 1KB each

**Dependencies:** `pip install mermaid-py` (uses Mermaid.ink rendering API)

**Fallback:** If mermaid-py fails (network issues), save the .mmd files and note that rendering must be done manually at https://mermaid.live or via `npx @mermaid-js/mermaid-cli`

---

### PHASE 6: COMPLY — USPTO 37 CFR 1.84 Verification

**Entry criteria:** Rendered Mermaid code
**Actions:**
1. Verify against USPTO drawing requirements (37 CFR 1.84):
   - [ ] Black and white only (no color unless petition filed)
   - [ ] Sufficiently clear and legible when reproduced at 2/3 scale
   - [ ] Reference numerals match specification text
   - [ ] No trademarks or product names in drawings
   - [ ] Figure number clearly labeled
   - [ ] All text in English
   - [ ] Lines are clean and uniform weight
   - [ ] Shading used only for cross-sections or 3D effect
2. Flag any compliance issues
3. Generate compliance report

**Output:** Compliance checklist with pass/fail for each requirement
**Quality gate:** All mandatory requirements pass; advisory items noted

## Exit Criteria

Done when:
- Mermaid code is syntactically valid
- All components from the figure description are represented
- Reference numerals are assigned and tabulated
- USPTO compliance checklist is completed
- No blocking compliance issues remain

## Error Handling

| Phase | Failure Mode | Response |
|-------|-------------|----------|
| PARSE | Ambiguous description | Flag ambiguity, make best-effort interpretation, note assumption |
| CLASSIFY | Doesn't fit standard types | Default to block diagram; note in compliance_notes |
| DESIGN | Too many components for clear layout | Split into sub-figures (FIG. Xa, FIG. Xb) |
| RENDER | Mermaid syntax limitation | Simplify diagram; note what couldn't be represented |
| IMAGE | mermaid-py not installed | Save .mmd files; instruct user to pip install mermaid-py |
| IMAGE | Mermaid.ink API unreachable | Save .mmd files; instruct user to render at mermaid.live |
| IMAGE | Rendered image too small/corrupt | Increase scale factor; retry with simplified diagram |
| COMPLY | Color required for clarity | Note petition needed for color drawings (37 CFR 1.84(a)(2)) |

## USPTO Drawing Standards Reference (37 CFR 1.84)

- **Size**: 21.6 cm × 27.9 cm (8.5 × 11 inches) or A4
- **Margins**: Top 2.5cm, Left 2.5cm, Right 1.5cm, Bottom 1.0cm
- **Lines**: Black, sufficiently dense and dark, uniformly thick
- **Numbers/Letters**: At least 0.32 cm (1/8 inch) in height
- **Reference Characters**: Same reference numeral must be used for same part throughout all views
- **Lead Lines**: Fine lines between reference characters and details referred to
- **Shading**: May be used to indicate surfaces or cross-sections
- **Symbols**: Standard symbols may be used where conventional
