# Dependency Mapper

**One-line description:** Analyze a Python codebase to extract module dependencies, detect circular imports, identify coupling hotspots, and generate decoupling recommendations with a visual dependency graph.

**Execution Pattern:** Phase Pipeline

## Inputs

- `codebase_root` (string, required): Absolute or relative path to the root directory of the Python codebase to analyze.
- `exclude_patterns` (string[], optional): List of glob patterns (POSIX fnmatch syntax) for directories/files to skip (e.g., `["tests/", "venv/", "*.pyc"]`). Default: `["venv/", ".venv/", "__pycache__/", ".git/", "node_modules/"]`.
- `include_stdlib` (boolean, optional): Whether to include Python standard library imports in the graph. Default: `false`.
- `include_third_party` (boolean, optional): Whether to include third-party package imports in the graph. Default: `false`.
- `output_format` (string, optional): Format for graph output: `"dot"`, `"json"`, or `"both"`. Default: `"json"`.
- `coupling_threshold` (number, optional): Minimum number of dependencies to flag a module as high-coupling. Default: `5`.

## Outputs

- `modules_discovered` (number): Total count of Python modules found.
- `import_graph` (object): Adjacency list representation of the dependency graph. Keys are module paths, values are arrays of imported module paths.
- `circular_dependencies` (array of arrays): List of circular dependency chains. Each chain is an array of module paths forming a cycle.
- `coupling_metrics` (object): Per-module metrics with keys as module paths and values as objects containing `in_degree` (dependents), `out_degree` (dependencies), and `coupling_score` (normalized measure).
- `high_coupling_modules` (array): Modules exceeding the coupling threshold, sorted by coupling score (descending).
- `decoupling_recommendations` (array of objects): Refactoring suggestions, each with `modules_involved` (array), `issue_type` ("circular" or "high_coupling"), `description` (string), and `suggested_action` (string).
- `graph_visualization` (string): Dependency graph in the requested format (DOT or JSON).
- `report_summary` (object): Executive summary with `total_modules` (number), `circular_dependency_count` (number), `high_coupling_count` (number), `overall_health_score` (0-100 integer), and `key_findings` (array of objects, each with `finding_type` (string), `description` (string), `affected_modules` (array)).

## Execution Phases

### Phase 1: Discovery and Parsing

**Entry Criteria:**
- `codebase_root` is a valid, readable directory.
- `exclude_patterns` are well-formed POSIX fnmatch glob expressions.

**Actions:**
1. Recursively traverse `codebase_root` and collect all `.py` files, excluding paths matching `exclude_patterns` using fnmatch.
2. For each Python file, attempt to parse the AST (Abstract Syntax Tree) to extract all `import` and `from ... import` statements.
3. Classify each import as: standard library (using `sys.stdlib_module_names` or equivalent), third-party (installed packages), or local (relative or absolute paths within codebase).
4. Build a raw import dictionary: `{module_path: [imported_modules]}`, preserving import type metadata.

**Output:**
- `raw_imports`: Dictionary mapping each module to its direct imports with classification metadata (stdlib/third_party/local).
- `modules_discovered`: Count of unique modules.
- `parse_errors`: List of files with syntax errors (logged but not fatal).

**Quality Gate:**
- All `.py` files in the codebase (excluding patterns) are discovered; verified by comparing file count to directory traversal.
- Import classification accuracy: stdlib imports must match Python's standard library list; local imports must reference files within codebase_root; third-party imports must not match either.
- Parse errors are logged; skill continues with remaining modules.

---

### Phase 2: Normalization and Resolution

**Entry Criteria:**
- `raw_imports` dictionary is populated.
- Package structure (presence of `__init__.py` files) is known.

**Actions:**
1. Resolve all relative imports (e.g., `from . import foo`, `from ..utils import bar`) to absolute module paths using the package hierarchy and file system structure.
2. Normalize module paths: convert file paths to module dotted notation (e.g., `/src/myapp/utils.py` → `myapp.utils`). Handle namespace packages (directories without `__init__.py`) by treating them as packages.
3. Filter imports based on `include_stdlib` and `include_third_party` flags; remove filtered imports from the graph.
4. Remove duplicate imports and self-references (a module importing itself).
5. Identify imports that reference non-existent local modules and log them as unresolved (do not halt processing).

**Output:**
- `normalized_imports`: Dictionary with all imports resolved to absolute module paths.
- `unresolved_imports`: List of imports referencing non-existent local modules (e.g., `{module: "myapp.utils", attempted_import: "myapp.missing_module"}`).

**Quality Gate:**
- All relative imports are correctly resolved to absolute paths; verified by checking that all resolved paths exist in the codebase or are external.
- Module paths are consistent (no duplicates with different naming conventions); verified by checking for path collisions.
- Unresolved imports are identified and logged; they do not prevent phase completion.

---

### Phase 3: Graph Construction and Cycle Detection

**Entry Criteria:**
- `normalized_imports` is complete and validated.

**Actions:**
1. Build a directed graph from the normalized imports: nodes are modules, edges are import relationships (directed from importer to importee).
2. Apply Tarjan's strongly connected components algorithm to identify all circular dependencies (cycles are strongly connected components with size > 1).
3. For each cycle, extract the chain of modules involved in topological order.
4. Calculate per-module metrics: in-degree (number of modules that import this module), out-degree (number of modules this module imports), and coupling score using the formula `(in_degree + out_degree) / (2 * total_modules)` (range 0-1).
5. Identify high-coupling modules where `coupling_score > (coupling_threshold / (2 * total_modules))`.

**Output:**
- `import_graph`: Adjacency list representation of the dependency graph (dict of lists).
- `circular_dependencies`: List of cycles, each as an ordered array of module paths forming a cycle.
- `coupling_metrics`: Per-module in-degree, out-degree, and coupling score (0-1 range).
- `high_coupling_modules`: Sorted list of modules exceeding the threshold, with their coupling scores.

**Quality Gate:**
- All cycles are detected using Tarjan's algorithm (no false negatives); verified by checking that no module in a cycle can reach another without traversing the cycle.
- Metrics are mathematically consistent: sum of all in-degrees equals sum of all out-degrees equals total edges in graph.
- High-coupling modules are correctly identified: all modules in output have `coupling_score > threshold_normalized`.

---

### Phase 4: Analysis and Recommendations

**Entry Criteria:**
- `import_graph`, `circular_dependencies`, and `coupling_metrics` are complete.

**Actions:**
1. For each circular dependency, generate a decoupling recommendation:
   - Analyze the cycle structure and suggest a breaking point (e.g., "break edge from module_a to module_b").
   - Recommend a specific strategy: dependency injection, interface extraction, mediator pattern, or module reorganization.
   - Estimate effort (low/medium/high) based on cycle length and module complexity.
2. For each high-coupling module, recommend strategies:
   - If out-degree is high: suggest extracting a new module to reduce dependencies.
   - If in-degree is high: suggest introducing a facade or mediator to decouple consumers.
   - If both are high: suggest consolidating related functionality or splitting the module.
3. Calculate overall health score: `100 - (10 * circular_count) - (5 * high_coupling_count / total_modules) - (2 * avg_coupling_score * 100)`, clamped to 0-100.
4. Compile key findings: list of finding objects with type ("circular_dependency", "high_coupling", "unresolved_import"), description, and affected modules.

**Output:**
- `decoupling_recommendations`: Array of objects with `modules_involved`, `issue_type`, `description`, `suggested_action`, and `estimated_effort`.
- `report_summary`: Object with `total_modules`, `circular_dependency_count`, `high_coupling_count`, `overall_health_score` (0-100), and `key_findings` (array of finding objects).

**Quality Gate:**
- Every circular dependency has at least one recommendation; verified by checking count.
- Every recommendation is specific and actionable (contains module names and concrete action, not generic advice).
- Health score is consistent with analysis: increases when cycles/coupling decrease, decreases when they increase.
- All key findings reference modules that exist in the graph.

---

### Phase 5: Visualization and Reporting

**Entry Criteria:**
- All analysis is complete.
- `output_format` is one of: "dot", "json", or "both".

**Actions:**
1. Render the dependency graph in the requested format:
   - **DOT format**: Generate Graphviz-compatible output with nodes colored by coupling level (green: low <0.05, yellow: medium 0.05-0.1, red: high >0.1). Highlight cycle edges in red with label "cycle". Include node attributes: label (module name), in_degree, out_degree.
   - **JSON format**: Structured representation with `nodes` (array of {id, label, in_degree, out_degree, coupling_score, is_high_coupling}), `edges` (array of {source, target, is_cycle}), and `metadata` (total_modules, total_edges, cycle_count).
2. Generate a comprehensive report including:
   - Overview section: total modules, total imports, circular dependency count, high-coupling module count.
   - Detailed findings section: list each circular dependency with modules involved; list each high-coupling module with metrics.
   - Recommendations section: prioritized by impact (cycles first, then high-coupling by score).
   - Metrics summary: average in-degree, average out-degree, average coupling score.
3. Validate output format: ensure DOT is syntactically valid (can be parsed by Graphviz); ensure JSON is valid and parseable.

**Output:**
- `graph_visualization`: String in DOT or JSON format (or both, as separate strings if format is "both").
- `report_summary`: Structured report object (same as Phase 4 output).

**Quality Gate:**
- Graph visualization is syntactically valid and renderable (DOT can be parsed by Graphviz; JSON is valid JSON).
- Report is complete: contains all sections (overview, findings, recommendations, metrics).
- All analysis results are represented in the output: every cycle, every high-coupling module, every recommendation appears in visualization or report.

---

## Exit Criteria

The skill is complete when:
1. All Python modules in the codebase are discovered and parsed (or logged as unparseable).
2. All imports are normalized and resolved to absolute module paths; unresolved imports are logged.
3. The dependency graph is constructed and all cycles are detected using Tarjan's algorithm.
4. Coupling metrics are calculated for every module and verified for mathematical consistency.
5. Decoupling recommendations are generated for all circular dependencies and high-coupling modules.
6. Graph visualization is produced in the requested format and validated for syntactic correctness.
7. Summary report is produced with all sections (overview, findings, recommendations, metrics).
8. Parse errors and unresolved imports are logged but do not prevent completion.

## Error Handling

| Phase | Failure Mode | Response |
|-------|--------------|----------|
| Discovery | `codebase_root` does not exist or is not readable | **Abort** -- return error message: "codebase_root '{path}' does not exist or is not readable." |
| Discovery | `exclude_patterns` contains invalid glob syntax (e.g., unclosed bracket) | **Abort** -- return error message: "exclude_patterns contains invalid glob syntax: '{pattern}'." |
| Discovery | Python file has syntax errors (unparseable AST) | **Adjust** -- log the file path and error message; skip it; continue with other files. |
| Normalization | Relative import cannot be resolved (missing `__init__.py` in parent) | **Adjust** -- log as unresolved import; treat as external dependency; continue. |
| Normalization | Circular reference in package structure (e.g., `__init__.py` imports from submodule that imports from parent) | **Adjust** -- resolve using file-based hierarchy; document in unresolved_imports; continue. |
| Graph Construction | Graph has >1000 nodes | **Adjust** -- continue processing; add warning to report_summary: "Graph is large (>1000 nodes); visualization may be dense." |
| Cycle Detection | Cycle detection algorithm times out (very large graph, >10000 edges) | **Adjust** -- use a faster approximate algorithm (DFS with depth limit); add warning to report: "Cycle detection was approximate due to graph size." |
| Recommendations | No decoupling strategy is obvious for a cycle | **Adjust** -- provide generic recommendation: "Consider architectural review to break this cycle; options include dependency injection, interface extraction, or module reorganization." Flag for manual inspection. |
| Visualization | Requested format is unsupported (not "dot", "json", or "both") | **Abort** -- return error message: "output_format must be 'dot', 'json', or 'both'; got '{format}'." |
| Visualization | DOT output is syntactically invalid | **Adjust** -- log error; return JSON format instead; add warning to report. |

## Reference Section

### Domain Knowledge: Coupling Metrics

**In-Degree:** Number of modules that import this module. High in-degree indicates the module is a core dependency; changes affect many consumers. A module with in-degree >5 is a "hub" and should be stable and well-tested.

**Out-Degree:** Number of modules this module imports. High out-degree indicates the module has many dependencies; it is fragile to changes in its dependencies. A module with out-degree >5 is "high-dependency" and may benefit from decoupling.

**Coupling Score:** Normalized metric combining in-degree and out-degree. Formula: `(in_degree + out_degree) / (2 * total_modules)`. Ranges 0-1. Interpretation: <0.05 is low coupling (good), 0.05-0.1 is medium coupling (acceptable), >0.1 is high coupling (consider refactoring).

### Decoupling Strategies

1. **Dependency Injection:** Pass dependencies as parameters or via constructor instead of importing directly. Breaks hard import links. Effort: low. Best for: high out-degree modules.
2. **Interface Extraction:** Define an abstract interface (ABC or protocol) that both modules depend on, instead of depending on each other. Breaks circular imports. Effort: medium. Best for: circular dependencies.
3. **Mediator Pattern:** Introduce a third module that coordinates between two coupled modules, breaking the direct import. Effort: medium. Best for: circular dependencies with 2-3 modules.
4. **Module Reorganization:** Move shared code to a new, lower-level module that both high-level modules import. Effort: high. Best for: high-coupling modules with shared functionality.
5. **Lazy Imports:** Use `importlib` to defer imports until runtime, breaking static import cycles. Effort: low. Best for: circular dependencies that are not on critical path.

### Checklist for Interpreting Results

- [ ] Review all circular dependencies; prioritize breaking cycles (they prevent refactoring and indicate architectural issues).
- [ ] Examine high-coupling modules (coupling_score >0.1); consider if they should be split or consolidated.
- [ ] Check for "hub" modules (in-degree >5); ensure they are stable, well-tested, and have clear responsibility.
- [ ] Check for "high-dependency" modules (out-degree >5); consider if dependencies can be reduced via dependency injection or interface extraction.
- [ ] Verify that external (third-party) imports are intentional and not accidental (check unresolved_imports).
- [ ] Confirm that the codebase structure matches the intended architecture (review key_findings).
- [ ] Track health_score over time; aim for score >80 (fewer than 2 cycles, low average coupling).

### Example Circular Dependency

```
module_a.py imports from module_b
module_b.py imports from module_c
module_c.py imports from module_a
```

Cycle detected: `[module_a, module_b, module_c]`

Resolution options:
1. **Dependency Injection:** Have module_c accept module_a as a parameter instead of importing it.
2. **Interface Extraction:** Create `module_interface.py` with an abstract base class; have all three import from it.
3. **Lazy Import:** In module_c, use `importlib.import_module('module_a')` at runtime instead of static import.

---

**State Persistence:** This skill does not require state persistence between runs. Each execution is independent. However, storing previous analysis results (import_graph, coupling_metrics, health_score) enables trend tracking (e.g., "coupling improved by 15% since last month"). Recommended: save report_summary to a JSON file after each run for historical comparison.

**Composition:** This skill can be composed with downstream skills: code refactoring automation (apply decoupling recommendations), test generation for decoupled modules, architecture documentation generation, or continuous monitoring (run periodically and alert on health_score decline).