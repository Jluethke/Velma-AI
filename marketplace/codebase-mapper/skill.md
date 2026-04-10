# Codebase Mapper

Scan a repository's structure, imports, and definitions to produce an architecture map with module boundaries, dependency graphs, coupling/cohesion metrics, and structural drift detection across runs.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Scan directory tree, file types, imports, class/function definitions
REASON  --> Identify modules, dependency clusters, architectural layers, entry points
PLAN    --> Generate architecture map with component relationships and metrics
ACT     --> Output: module diagram, dependency graph, key file index, tech stack summary
     \                                                              /
      +--- Act may reveal unmapped dependencies --- loop to OBSERVE +
```

## Inputs

- `repo_path`: string -- Path to repository root directory
- `language_filter`: string[] (optional) -- Restrict analysis to specific languages (e.g., ["python", "typescript"])
- `depth`: integer (optional) -- Maximum directory depth for module detection (default: 4)
- `previous_map`: object (optional) -- Architecture map from a prior run, used for drift detection

## Outputs

- `architecture_map`: object -- Hierarchical module structure with boundaries, responsibilities, and layer assignments
- `dependency_graph`: object -- Directed graph of inter-module dependencies with edge weights (import count) and direction
- `file_index`: object -- Key files indexed by role (entry points, configs, tests, core logic, utilities)
- `tech_stack_summary`: object -- Detected languages, frameworks, build tools, package managers, and infrastructure
- `drift_report`: object (if previous_map provided) -- Structural changes since last run: new modules, removed modules, changed dependencies, coupling trend

---

## Execution

### OBSERVE: Scan Repository Structure

**Entry criteria:** `repo_path` exists and is accessible. Directory contains at least one source file.

**Actions:**

1. **Directory tree scan:**
   - Walk the directory tree up to `depth` levels, excluding common non-source directories (see Reference: Ignore Patterns)
   - Record every directory with its file count, total line count, and dominant language
   - Identify module boundaries using heuristics (see Reference: Module Boundary Detection)

2. **File classification:**
   - Classify each source file by role: entry point, library/module, test, config, build, documentation, migration, generated code
   - Detection rules per role:
     - Entry points: `main()`, `if __name__`, `bin/`, CLI arg parsing, `@app.route` root
     - Tests: `test_`, `_test`, `spec/`, `__tests__/`, pytest/jest/mocha patterns
     - Config: `.json`, `.yaml`, `.toml`, `.env`, `settings`, `config` in name
     - Generated: `generated/`, `__pycache__/`, `dist/`, `build/`, lock files
   - Record file metadata: path, language, line count, last modified date, role

3. **Import/dependency extraction:**
   - Parse import statements per language (see Reference: Import Parsing by Language)
   - Build raw import graph: file A imports file B
   - Resolve relative imports to absolute paths
   - Identify external dependencies (third-party packages)
   - Record import counts per file (fan-in: how many files import this; fan-out: how many files this imports)

4. **Definition extraction:**
   - Scan for class definitions, function definitions, exported symbols
   - Record public API surface per module (exported classes, functions, constants)
   - Identify inheritance hierarchies and interface implementations

**Output:** Raw scan data: directory tree with metadata, file classifications, import graph, definition index.

**Quality gate:** Every source file is classified. Import graph has no unresolved internal references (external deps are expected to be unresolved). At least one entry point is identified, or the absence is flagged.

---

### REASON: Identify Architecture

**Entry criteria:** Raw scan data is complete.

**Actions:**

1. **Module boundary detection:**
   - Group files into modules using directory structure + import clustering
   - A module is a directory (or set of directories) where internal imports outnumber external imports by at least 2:1
   - Identify the public interface of each module (files imported from outside the module)
   - Detect sub-modules (modules within modules)

2. **Architectural layer assignment:**
   - Classify each module into layers using dependency direction and naming patterns:
     - **Presentation**: routes, views, controllers, handlers, CLI, UI components
     - **Application**: services, use cases, orchestrators, commands
     - **Domain**: models, entities, value objects, domain logic
     - **Infrastructure**: database, external APIs, file I/O, messaging, caching
     - **Cross-cutting**: logging, auth, config, utils, middleware
   - Validate layer assignment: dependencies should flow inward (presentation -> application -> domain <- infrastructure)
   - Flag layer violations (domain importing presentation, infrastructure importing application)

3. **Dependency analysis:**
   - Compute coupling metrics per module pair:
     - **Afferent coupling (Ca)**: number of modules that depend on this module
     - **Efferent coupling (Ce)**: number of modules this depends on
     - **Instability (I)**: Ce / (Ca + Ce) -- ranges from 0 (stable) to 1 (unstable)
   - Detect circular dependencies: find cycles in the module dependency graph using DFS
   - Identify hub modules: modules with both high Ca and high Ce (fragile coupling points)
   - Compute cohesion estimate per module: ratio of intra-module imports to total imports

4. **Dead code identification:**
   - Find files with zero fan-in (nothing imports them) that are not entry points, tests, or configs
   - Find exported symbols never referenced outside their defining file
   - Find modules with no incoming dependencies (orphan modules)
   - Classify dead code confidence: HIGH (zero references + not entry point), MEDIUM (referenced only in tests), LOW (referenced in config/dynamic imports possible)

5. **Framework and tech stack detection:**
   - Detect frameworks from: package manifests (package.json, requirements.txt, Cargo.toml, go.mod), import patterns, config files, directory conventions
   - Detect build tools: Makefile, webpack, vite, cargo, gradle, maven, cmake
   - Detect infrastructure: Docker, Kubernetes, Terraform, CI configs (.github/workflows, .gitlab-ci.yml, Jenkinsfile)
   - Detect databases: ORM imports, migration directories, connection strings in config

**Output:** Module map with layer assignments, dependency graph with coupling metrics, dead code candidates, tech stack inventory, layer violation report.

**Quality gate:** Every source file belongs to exactly one module. Coupling metrics are computed for all module pairs with dependencies. Dead code candidates have confidence levels. Tech stack detection covers package manifest + import evidence.

---

### PLAN: Generate Architecture Map

**Entry criteria:** Module analysis and metrics are complete.

**Actions:**

1. **Compose module diagram:**
   - Arrange modules by architectural layer (top to bottom: presentation -> application -> domain, infrastructure on the side)
   - Show dependency edges with direction and weight (import count)
   - Highlight circular dependencies in red
   - Highlight layer violations in orange
   - Mark hub modules (high coupling both directions) with a warning indicator

2. **Build key file index:**
   - Top entry points with their role (web server, CLI, worker, scheduler)
   - Core domain files (highest fan-in, most imported)
   - Configuration files and their scope
   - Test directories and coverage areas

3. **Compute health metrics:**
   - **Overall coupling score**: average instability across all modules (closer to 0.5 is balanced)
   - **Circular dependency count**: number of cycles in module graph
   - **Layer violation count**: dependencies flowing the wrong direction
   - **Dead code percentage**: dead LOC / total LOC
   - **Test coverage map**: which modules have test directories vs which don't
   - **Module size distribution**: flag modules that are disproportionately large (> 3 standard deviations from mean)

4. **Drift detection (if previous_map provided):**
   - Compare current module list to previous: new modules, removed modules, renamed modules
   - Compare dependency edges: new dependencies, removed dependencies, changed weights
   - Compute coupling trend: is overall coupling increasing or decreasing?
   - Identify structural regressions: new circular dependencies, new layer violations
   - Flag rapid growth modules: modules that grew > 30% in file count since last run

**Output:** Complete architecture map document with module diagram, dependency graph, file index, metrics, and drift report.

**Quality gate:** Module diagram is internally consistent (all referenced modules exist). Metrics are within valid ranges. Drift report (if applicable) has specific file-level evidence for each change.

---

### ACT: Deliver Architecture Map

**Entry criteria:** Architecture map document is composed and validated.

**Actions:**

1. **Format the architecture map:**
   - Module diagram in text-based format (ASCII or Mermaid syntax for rendering)
   - Dependency graph as adjacency list with weights
   - File index organized by role
   - Tech stack as a structured table
   - Metrics as a dashboard summary

2. **Generate actionable findings:**
   - For each circular dependency: suggest which edge to break and how
   - For each layer violation: explain the architectural risk
   - For dead code: recommend removal or investigation per confidence level
   - For hub modules: suggest decomposition strategies
   - For oversized modules: suggest split points

3. **Persist architecture map** for future drift detection:
   - Save module list with file counts and line counts
   - Save dependency graph edges with weights
   - Save coupling metrics per module
   - Timestamp the snapshot

4. **Produce summary:**
   - One-paragraph architecture overview (what this codebase does, how it's structured)
   - Top 3 structural risks
   - Top 3 architectural strengths

**Output:** Final architecture map with all components: diagram, graph, index, metrics, findings, summary.

**Quality gate:** Every structural risk has a specific remediation suggestion. Architecture map is self-contained (no undefined references). Summary accurately reflects the metrics.

---

**Loop condition:** After ACT, if the dependency analysis revealed imports to directories not yet scanned (e.g., symlinked directories, monorepo cross-references, or workspace references), loop back to OBSERVE to scan those directories and merge them into the map.

## Exit Criteria

The skill is DONE when:
- Every source directory within `depth` has been scanned
- Every source file is classified and assigned to a module
- The dependency graph has no unresolved internal references
- Coupling metrics are computed for all module pairs
- Dead code candidates are identified with confidence levels
- The architecture map is internally consistent (no undefined module references)
- The map has been persisted for future drift detection

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Repository path does not exist or is empty | **Abort** -- report invalid input |
| OBSERVE | Binary files or minified code cause parse errors | **Adjust** -- skip unparseable files, log them as excluded |
| OBSERVE | Monorepo with >50,000 files takes too long to scan | **Adjust** -- limit to top-level packages, scan each as separate module |
| OBSERVE | Import resolution fails for dynamic imports (e.g., `importlib`, `require(variable)`) | **Adjust** -- log as unresolved dynamic import, continue without edge |
| REASON | Circular dependency detection exceeds time limit (deeply nested cycles) | **Adjust** -- report cycles found so far, cap DFS depth at 20 |
| REASON | Cannot determine architectural layer for a module | **Adjust** -- assign "uncategorized" layer, flag for human review |
| PLAN | Previous map schema doesn't match current version | **Adjust** -- skip drift detection, generate fresh map |
| ACT | Architecture map exceeds output size limits | **Adjust** -- summarize small modules, detail only top 20 by size |
| ACT | User rejects the architecture map or disputes the layer assignments and coupling findings | **Adjust** -- incorporate specific feedback (e.g., a module is miscategorized, a dependency edge is wrong, dead code findings are incorrect), update the affected module assignments or metrics, and regenerate the impacted sections of the map; do not restart from OBSERVE unless the repository path or scan depth was wrong |

## State Persistence

Between runs, this skill saves:
- **Architecture map snapshot**: module list, dependency graph, coupling metrics, timestamp
- **File classification cache**: previously classified files (skip re-classification if unchanged)
- **Tech stack inventory**: detected frameworks and versions
- **Drift history**: log of structural changes across runs (for trend analysis)

---

## Reference

### Ignore Patterns

Always exclude these directories from scanning:
```
node_modules/      .git/              __pycache__/       .mypy_cache/
.pytest_cache/     .tox/              .venv/             venv/
env/               dist/              build/             target/
.next/             .nuxt/             coverage/          .coverage/
.idea/             .vscode/           .DS_Store          *.egg-info/
```

### Module Boundary Detection

A module boundary exists where:
1. A directory contains an `__init__.py` (Python), `index.ts/js` (JS/TS), `mod.rs` (Rust), or `package.go` (Go)
2. A directory's internal import ratio exceeds 2:1 (files within import each other more than they import outside)
3. A directory has its own package manifest (package.json, Cargo.toml, setup.py)
4. A directory follows a framework convention (e.g., `app/models/`, `src/components/`, `lib/`)

When boundaries conflict, prefer explicit markers (init files, manifests) over heuristic detection.

### Import Parsing by Language

#### Python
```python
# Direct imports
import os                         # -> stdlib (skip)
import numpy                      # -> external dep
from mypackage.module import func # -> internal: resolve to mypackage/module.py
from . import sibling             # -> relative: resolve from current package
from ..parent import thing        # -> relative: resolve from parent package
```

#### JavaScript/TypeScript
```javascript
import React from 'react';           // -> external dep
import { util } from './utils';       // -> internal: resolve ./utils.ts or ./utils/index.ts
import config from '@app/config';     // -> alias: resolve via tsconfig paths / webpack alias
const fs = require('fs');             // -> stdlib (skip)
const mod = require('./mod');         // -> internal
```

#### Rust
```rust
use std::collections::HashMap;   // -> stdlib (skip)
use crate::module::function;     // -> internal: resolve to src/module.rs or src/module/mod.rs
use super::sibling;              // -> relative: parent module
use external_crate::Thing;       // -> external dep (from Cargo.toml)
```

#### Go
```go
import "fmt"                          // -> stdlib (skip)
import "github.com/user/repo/pkg"     // -> external dep
import "myproject/internal/service"   // -> internal: resolve from go.mod module path
```

### Coupling Metrics Reference

```
Afferent Coupling (Ca) = number of modules that depend on this module
  High Ca = many dependents = stable (changing it breaks many things)

Efferent Coupling (Ce) = number of modules this module depends on
  High Ce = many dependencies = unstable (changes elsewhere affect it)

Instability (I) = Ce / (Ca + Ce)
  I = 0: maximally stable (only depended upon, depends on nothing)
  I = 1: maximally unstable (depends on everything, nothing depends on it)
  I = 0.5: balanced

Ideal architecture:
  - Domain/core modules: I close to 0 (stable abstractions)
  - Presentation/UI modules: I close to 1 (unstable, free to change)
  - Application/service modules: I around 0.3-0.5

Abstractness (A) = abstract classes & interfaces / total classes
  A = 1: fully abstract
  A = 0: fully concrete

Main Sequence Distance (D) = |A + I - 1|
  D = 0: on the main sequence (ideal balance)
  D close to 1: either "zone of pain" (stable + concrete) or "zone of uselessness" (unstable + abstract)
```

### Dead Code Confidence Levels

```
HIGH confidence (safe to remove):
  - Zero fan-in (nothing imports it)
  - Not an entry point (no main, no CLI, no route handler)
  - Not a config file
  - Not dynamically imported (no __import__, importlib, require(var))
  - Not referenced in build/deploy configs

MEDIUM confidence (investigate before removing):
  - Only referenced in test files
  - Only referenced in comments or documentation
  - Only referenced via string-based dispatch (e.g., getattr, registry patterns)

LOW confidence (likely alive despite no static references):
  - Plugin architecture (loaded by convention/config)
  - CLI subcommands (registered dynamically)
  - Event handlers (registered at runtime)
  - Template files (referenced from templates, not code)
  - Migrations (executed by migration runner, not imported)
```

### Framework Detection Signatures

| Framework | Detection Signals |
|---|---|
| React | `package.json` has `react`, JSX/TSX files, `useState`/`useEffect` imports |
| Next.js | `next.config.js`, `pages/` or `app/` directory, `next` in package.json |
| Django | `manage.py`, `settings.py`, `urls.py`, `django` in requirements |
| Flask | `flask` in requirements, `@app.route` patterns, `Flask(__name__)` |
| FastAPI | `fastapi` in requirements, `@app.get`/`@app.post`, `Depends()` |
| Express | `express` in package.json, `app.get()`/`app.post()` patterns |
| Spring Boot | `@SpringBootApplication`, `pom.xml` or `build.gradle` with spring-boot |
| Rails | `Gemfile` with `rails`, `config/routes.rb`, `app/controllers/` |
| Rust/Actix | `actix-web` in Cargo.toml, `#[actix_web::main]` |
| Go/Gin | `github.com/gin-gonic/gin` in go.mod, `gin.Default()` |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
