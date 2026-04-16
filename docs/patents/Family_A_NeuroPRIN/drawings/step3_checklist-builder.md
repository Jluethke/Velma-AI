{
  "checklist": {
    "goal": "Prepare patent drawing filing package for Family A — NeuroPRIN (Runtime Trust-Based Authority Governor) with 9 figures, ensuring USPTO 37 CFR 1.84 compliance, reference numeral consistency, and production-ready PNG/PDF outputs",
    "deadline": "2024-12-27",
    "total_items": 47,
    "estimated_total_effort_hours": 32,
    "experience_level": "first_time",
    "categories": [
      {
        "category_name": "Figure Inventory & Mermaid Code Validation",
        "category_id": "CAT_001",
        "items": [
          {
            "item_id": "001_001",
            "task": "Audit all 9 figures for Mermaid code completeness and syntax correctness",
            "deadline": "2024-12-13",
            "effort": "medium",
            "critical_path": true,
            "dependencies": [],
            "notes": "FIG. 1-9 must have valid Mermaid syntax; test rendering in Mermaid Live Editor"
          },
          {
            "item_id": "001_002",
            "task": "Verify FIG. 5 (Authority vs Trust curve) Mermaid code is complete (appears truncated in input)",
            "deadline": "2024-12-13",
            "effort": "medium",
            "critical_path": true,
            "dependencies": [],
            "notes": "Input shows incomplete xychart-beta code; complete with all threshold markers and legend"
          },
          {
            "item_id": "001_003",
            "task": "Verify FIG. 6, 7, 8, 9 Mermaid code is present and complete",
            "deadline": "2024-12-13",
            "effort": "medium",
            "critical_path": true,
            "dependencies": [],
            "notes": "Input context shows only FIG. 1-5 with full code; FIG. 6-9 descriptions exist but Mermaid code missing"
          },
          {
            "item_id": "001_004",
            "task": "Create Mermaid code for FIG. 6 (Enforcement adapter with constraint severity hierarchy)",
            "deadline": "2024-12-13",
            "effort": "large",
            "critical_path": true,
            "dependencies": [],
            "notes": "Block diagram showing constraint severity levels and anti-amplification invariant"
          },
          {
            "item_id": "001_005",
            "task": "Create Mermaid code for FIG. 7 (Safety envelope recovery state machine)",
            "deadline": "2024-12-13",
            "effort": "medium",
            "critical_path": true,
            "dependencies": [],
            "notes": "State machine with Inactive, Unsafe, Recovering states"
          },
          {
            "item_id": "001_006",
            "task": "Create Mermaid code for FIG. 8 (ODD boundary detection and violation response)",
            "deadline": "2024-12-13",
            "effort": "large",
            "critical_path": true,
            "dependencies": [],
            "notes": "Flowchart showing ODD boundary detection logic and response paths"
          },
          {
            "item_id": "001_007",
            "task": "Create Mermaid code for FIG. 9 (Audit hash chain across time steps)",
            "deadline": "2024-12-13",
            "effort": "medium",
            "critical_path": true,
            "dependencies": [],
            "notes": "Data flow diagram showing hash chain structure with root hash"
          },
          {
            "item_id": "001_008",
            "task": "CHECKPOINT: Verify all 9 figures have syntactically valid Mermaid code",
            "deadline": "2024-12-13",
            "effort": "quick",
            "critical_path": true,
            "dependencies": ["001_001", "001_002", "001_003", "001_004", "001_005", "001_006", "001_007"],
            "notes": "Stop and test each figure in Mermaid Live Editor before proceeding"
          }
        ]
      },
      {
        "category_name": "Reference Numeral Consistency & Mapping",
        "category_id": "CAT_002",
        "items": [
          {
            "item_id": "002_001",
            "task": "Create master reference numeral registry mapping all components across all 9 figures",
            "deadline": "2024-12-14",
            "effort": "large",
            "critical_path": true,
            "dependencies": ["001_008"],
            "notes": "Spreadsheet with: component name, reference numeral, figures where used, definition per 37 CFR 1.84(a)(2)"
          },
          {
            "item_id": "002_002",
            "task": "Identify cross-figure numeral conflicts (same numeral used for different components)",
            "deadline": "2024-12-14",
            "effort": "medium",
            "critical_path": true,
            "dependencies": ["002_001"],
            "notes": "Example: if '100' is used in FIG. 1 and FIG. 2 for different components, flag and resolve"
          },
          {
            "item_id": "002_003",
            "task": "Resolve numeral conflicts by reassigning numerals to maintain uniqueness or establish hierarchy",
            "deadline": "2024-12-14",
            "effort": "medium",
            "critical_path": true,
            "dependencies": ["002_002"],
            "notes": "Option A: unique numerals per component across all figures; Option B: hierarchical (100s for FIG. 1, 200s for FIG. 2, etc.)"
          },
          {
            "item_id": "002_004",
            "task": "Verify all reference numerals are even numbers (USPTO convention for clarity)",
            "deadline": "2024-12-14",
            "effort": "quick",
            "critical_path": false,
            "dependencies": ["002_003"],
            "notes": "37 CFR 1.84(a)(1) recommends even numerals; odd numerals acceptable but less conventional"
          },
          {
            "item_id": "002_005",
            "task": "Update all Mermaid code with final reference numerals",
            "deadline": "2024-12-14",
            "effort": "large",
            "critical_path": true,
            "dependencies": ["002_003"],
            "notes": "Regenerate all 9 figures with corrected numerals; test rendering again"
          },
          {
            "item_id": "002_006",
            "task": "Create reference numeral legend document for patent specification",
            "deadline": "2024-12-14",
            "effort": "medium",
            "critical_path": false,
            "dependencies": ["002_005"],
            "notes": "Format: '100 — Expectation Interface' per 37 CFR 1.84(a)(2)"
          },
          {
            "item_id": "002_007",
            "task": "CHECKPOINT: Cross-reference specification.md and provisional.md for numeral consistency",
            "deadline": "2024-12-14",
            "effort": "medium",
            "critical_path": true,
            "dependencies": ["002_006"],
            "notes": "Ensure numerals in drawings match numerals in written specification"
          }
        ]
      },
      {
        "category_name": "USPTO 37 CFR 1.84 Compliance per Figure",
        "category_id": "CAT_003",
        "items": [
          {
            "item_id": "003_001",
            "task": "Verify FIG. 1 compliance: black/white only, legible at 2/3 scale, no color",
            "deadline": "2024-12-15",
            "effort": "quick",
            "critical_path": false,
            "dependencies": ["002_005"],
            "notes": "37 CFR 1.84(a)(1): 'Black and white only; no color'"
          },
          {
            "item_id": "003_002",
            "task": "Verify FIG. 2 compliance: uniform line weight, no shading, clear connections",
            "deadline": "2024-12-15",
            "effort": "quick",
            "critical_path": false,
            "dependencies": ["002_005"],
            "notes": "37 CFR 1.84(a)(1): 'Lines must be uniform weight and clearly visible'"
          },
          {
            "item_id": "003_003",
            "task": "Verify FIG. 3 compliance: hierarchical grouping legible, no overlapping text",
            "deadline": "2024-12-15",
            "effort": "quick",
            "critical_path": false,
            "dependencies": ["002_005"],
            "notes": "37 CFR 1.84(a)(1): 'All text must be legible and non-overlapping'"
          },
          {
            "item_id": "003_004",
            "task": "Verify FIG. 4 compliance: state machine format, clear transitions, labels on all arrows",
            "deadline": "2024-12-15",
            "effort": "quick",
            "critical_path": false,
            "dependencies": ["002_005"],
            "notes": "37 CFR 1.84(a)(1): 'All connections must be labeled or clearly indicated'"
          },
          {
            "item_id": "003_005",
            "task": "Verify FIG. 5 compliance: axes labeled, scale clear, thresholds marked",
            "deadline": "2024-12-15",
            "effort": "quick",
            "critical_path": false,
            "dependencies": ["002_005"],
            "notes": "37 CFR 1.84(a)(1): 'Graphs must have labeled axes and clear scale'"
          },
          {
            "item_id": "003_006",
            "task": "Verify FIG. 6 compliance: block diagram, constraint hierarchy visible, anti-amplification invariant labeled",
            "deadline": "2024-12-15",
            "effort": "quick",
            "critical_path": false,
            "dependencies": ["002_005"],
            "notes": "37 CFR 1.84(a)(1): 'All functional elements must be distinct and labeled'"
          },
          {
            "item_id": "003_007",
            "task": "Verify FIG. 7 compliance: state machine, three states distinct, transitions clear",
            "deadline": "2024-12-15",
            "effort": "quick",
            "critical_path": false,
            "dependencies": ["002_005"],
            "notes": "37 CFR 1.84(a)(1): 'State machines must show all states and transitions'"
          },
          {
            "item_id": "003_008",
            "task": "Verify FIG. 8 compliance: flowchart, decision points clear, all paths labeled",
            "deadline": "2024-12-15",
            "effort": "quick",
            "critical_path": false,
            "dependencies": ["002_005"],
            "notes": "37 CFR 1.84(a)(1): 'Flowcharts must show all decision branches and outcomes'"
          },
          {
            "item_id": "003_009",
            "task": "Verify FIG. 9 compliance: data flow, hash chain structure clear, root hash identified",
            "deadline": "2024-12-15",
            "effort": "quick",
            "critical_path": false,
            "dependencies": ["002_005"],
            "notes": "37 CFR 1.84(a)(1): 'Data flow diagrams must show all data elements and transformations'"
          },
          {
            "item_id": "003_010",
            "task": "Verify all figures have figure numbers (FIG. 1 through FIG. 9) in title or caption",
            "deadline": "2024-12-15",
            "effort": "quick",
            "critical_path": false,
            "dependencies": ["002_005"],
            "notes": "37 CFR 1.84(a)(1): 'Each figure must be numbered and titled'"
          },
          {
            "item_id": "003_011",
            "task": "Verify all text in figures is in English (no symbols or abbreviations without definition)",
            "deadline": "2024-12-15",
            "effort": "quick",
            "critical_path": false,
            "dependencies": ["002_005"],
            "notes": "37 CFR 1.84(a)(1): 'All text must be in English; abbreviations must be defined'"
          },
          {
            "item_id": "003_012",
            "task": "Verify no trademarks, product names, or proprietary references in figures",
            "deadline": "2024-12-15",
            "effort": "quick",
            "critical_path": false,
            "dependencies": ["002_005"],
            "notes": "37 CFR 1.84(a)(1): 'Figures must not contain trademarks or proprietary information'"
          },
          {
            "item_id": "003_013",
            "task": "CHECKPOINT: All 9 figures pass 37 CFR 1.84 compliance checklist",
            "deadline": "2024-12-15",
            "effort": "medium",
            "critical_path": true,
            "dependencies": ["003_001", "003_002", "003_003", "003_004", "003_005", "003_006", "003_007", "003_008", "003_009", "003_010", "003_011", "003_012"],
            "notes": "Create compliance matrix; sign off on each figure"
          }
        ]
      },
      {
        "category_name": "Cross-Figure Numeral Conflict Resolution",
        "category_id": "CAT_004",
        "items": [
          {
            "item_id": "004_001",
            "task": "Document all numerals used in FIG. 1-5 (already provided in input)",
            "deadline": "2024-12-16",
            "effort": "quick",
            "critical_path": false,
            "dependencies": ["002_007"],
            "notes": "FIG. 1: 100-112; FIG. 2: 200-216; FIG. 3: 300-314; FIG. 4: 400-404; FIG. 5: 500-512"
          },
          {
            "item_id": "004_002",
            "task": "Assign numeral ranges for FIG. 6-9 (e.g., 600-699, 700-799, 800-899, 900-999)",
            "deadline": "2024-12-16",
            "effort": "quick",
            "critical_path": true,
            "dependencies": ["004_001"],
            "notes": "Hierarchical scheme: figure number × 100 + component offset"
          },
          {
            "item_id": "004_003",
            "task": "Identify shared components across figures (e.g., 'Trust Score' appears in FIG. 2, 3, 5)",
            "deadline": "2024-12-16",
            "effort": "medium",
            "critical_path": true,
            "dependencies": ["004_002"],
            "notes": "Create cross-reference table: component → numerals in each figure"
          },
          {
            "item_id": "004_004",
            "task": "Decide: use same numeral for same component across figures, or unique numerals per figure?",
            "deadline": "2024-12-16",
            "effort": "quick",
            "critical_path": true,
            "dependencies": ["004_003"],
            "notes": "Recommendation: unique numerals per figure (cleaner for USPTO); if same component appears, use same numeral + figure context"
          },
          {
            "item_id": "004_005",
            "task": "Create conflict resolution log documenting all decisions and rationale",
            "deadline": "