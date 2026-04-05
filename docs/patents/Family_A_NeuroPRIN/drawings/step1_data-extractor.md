{
  "extracted_data": {
    "patent_family": "Family A \u2014 NeuroPRIN (Runtime Trust-Based Authority Governor)",
    "total_figures": 9,
    "figures": [
      {
        "figure_number": "FIG. 1",
        "description": "System block diagram showing expectation interface, observation interface, divergence computation, trust inference (with neural component), authority mapping, enforcement adapter, and audit artifact generator",
        "drawing_type_hint": "block_diagram"
      },
      {
        "figure_number": "FIG. 2",
        "description": "Multi-stage trust evaluation pipeline showing stages 1-9 from instantaneous trust through final signal assembly",
        "drawing_type_hint": "pipeline"
      },
      {
        "figure_number": "FIG. 3",
        "description": "Neural trust inference component showing shared encoder and multi-head output architecture",
        "drawing_type_hint": "block_diagram"
      },
      {
        "figure_number": "FIG. 4",
        "description": "Mode state machine (Nominal, Degraded, Failsafe) with recovery hysteresis",
        "drawing_type_hint": "state_machine"
      },
      {
        "figure_number": "FIG. 5",
        "description": "Authority vs Trust curve \u2014 monotonic non-increasing function with configurable thresholds",
        "drawing_type_hint": "graph"
      },
      {
        "figure_number": "FIG. 6",
        "description": "Enforcement adapter showing constraint severity hierarchy and anti-amplification invariant",
        "drawing_type_hint": "block_diagram"
      },
      {
        "figure_number": "FIG. 7",
        "description": "Safety envelope recovery state machine (Inactive, Unsafe, Recovering)",
        "drawing_type_hint": "state_machine"
      },
      {
        "figure_number": "FIG. 8",
        "description": "ODD (Operational Design Domain) boundary detection and violation response",
        "drawing_type_hint": "flowchart"
      },
      {
        "figure_number": "FIG. 9",
        "description": "Audit hash chain across time steps with root hash",
        "drawing_type_hint": "data_flow"
      }
    ]
  },
  "confidence_scores": {
    "patent_family": 0.95,
    "total_figures": 0.95,
    "figures": [
      {
        "figure_number": 0.95,
        "description": 0.95,
        "drawing_type_hint": 0.9
      },
      {
        "figure_number": 0.95,
        "description": 0.95,
        "drawing_type_hint": 0.9
      },
      {
        "figure_number": 0.95,
        "description": 0.95,
        "drawing_type_hint": 0.9
      },
      {
        "figure_number": 0.95,
        "description": 0.95,
        "drawing_type_hint": 0.9
      },
      {
        "figure_number": 0.95,
        "description": 0.95,
        "drawing_type_hint": 0.9
      },
      {
        "figure_number": 0.95,
        "description": 0.95,
        "drawing_type_hint": 0.9
      },
      {
        "figure_number": 0.95,
        "description": 0.95,
        "drawing_type_hint": 0.9
      },
      {
        "figure_number": 0.95,
        "description": 0.95,
        "drawing_type_hint": 0.9
      },
      {
        "figure_number": 0.95,
        "description": 0.95,
        "drawing_type_hint": 0.9
      }
    ]
  },
  "extraction_notes": [
    "All 9 figures extracted successfully from input context.",
    "Patent family name extracted from 'patent_family' field with explicit label match.",
    "Total figure count verified against figures array length (9 matches).",
    "Drawing type hints inferred from figure descriptions using semantic matching: 'block diagram' \u2192 block_diagram, 'pipeline' \u2192 pipeline, 'state machine' \u2192 state_machine, 'curve/graph' \u2192 graph, 'flowchart' \u2192 flowchart, 'hash chain/data flow' \u2192 data_flow.",
    "All figure descriptions extracted verbatim from input context.",
    "No Specification.md or Provisional.md files were directly accessed; extraction performed from pre-processed input context containing structured figure data."
  ],
  "raw_matches": {
    "patent_family": "patent_family field: 'Family A \u2014 NeuroPRIN (Runtime Trust-Based Authority Governor)'",
    "total_figures": "total_figures field: 9",
    "figures": "figures array containing 9 objects with figure_number, description, and drawing_type fields"
  },
  "_skill": "data-extractor",
  "_alias": "extract_figures"
}