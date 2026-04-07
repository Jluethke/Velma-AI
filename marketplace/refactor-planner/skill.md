# Refactor Planner

Assess code for structural problems, design a safe incremental refactoring strategy with backward compatibility, sequence steps to minimize risk, and generate step-by-step execution instructions with before/after examples and behavioral equivalence verification.

## Execution Pattern: Phase Pipeline

```
PHASE 1: ASSESS    --> Identify code smells, complexity hotspots, coupling issues
PHASE 2: PLAN      --> Design refactoring strategy (incremental, safe, backward-compatible)
PHASE 3: SEQUENCE  --> Order refactoring steps to minimize risk (tests first, then structure)
PHASE 4: EXECUTE   --> Generate refactoring instructions per step with before/after examples
PHASE 5: VERIFY    --> Regression checklist, behavioral equivalence verification
```

## Inputs

- `source_code`: string -- The code to analyze (files, modules, or specific functions/classes)
- `target_area`: string (optional) -- Specific area to focus on (e.g., "the payment module", "the User class")
- `constraints`: object (optional) -- Time budget, backward compatibility requirements, deployment constraints
- `test_coverage_info`: string (optional) -- Current test coverage data, which paths are tested
- `refactoring_history`: object (optional) -- Previous refactoring plans from this skill for tracking progress

## Outputs

- `smell_report`: object -- Detected code smells with severity, location, and category
- `refactoring_plan`: object -- Strategy overview with goals, approach, and expected outcomes
- `step_sequence`: object -- Ordered list of refactoring steps with dependencies
- `execution_instructions`: object -- Per-step instructions with before/after code examples
- `verification_checklist`: object -- Tests to run, behaviors to verify, rollback triggers

---

## Execution

### Phase 1: ASSESS -- Identify Code Smells and Complexity

**Entry criteria:** Source code is provided and readable. At least one file or module to analyze.

**Actions:**

1. **Scan for code smells** (see Reference: Code Smell Taxonomy):
   - **Bloaters**: Long Method (>30 lines), Large Class (>300 lines), Long Parameter List (>4 params), Primitive Obsession, Data Clumps
   - **Object-Orientation Abusers**: Switch Statements (repeated), Refused Bequest, Alternative Classes with Different Interfaces, Temporary Field
   - **Change Preventers**: Divergent Change (one class changed for many reasons), Shotgun Surgery (one change touches many classes), Parallel Inheritance Hierarchies
   - **Dispensables**: Lazy Class, Data Class, Duplicate Code, Dead Code, Speculative Generality
   - **Couplers**: Feature Envy, Inappropriate Intimacy, Message Chains, Middle Man

2. **Compute complexity metrics:**
   - **Cyclomatic complexity** per function: count decision points (if, elif, for, while, and, or, try/except, ternary). Score: 1-5 = low, 6-10 = moderate, 11-20 = high, >20 = very high
   - **Cognitive complexity** per function: count nesting depth contributions (each level of nesting adds to the score, not just branches). A deeply nested 4-branch function is harder to read than a flat 6-branch function
   - **Lines of code** per function and per class
   - **Parameter count** per function
   - **Return point count** per function (multiple returns increase complexity)

3. **Analyze coupling:**
   - **Afferent coupling**: how many other modules depend on this code
   - **Efferent coupling**: how many modules this code depends on
   - **Data coupling** (healthy): modules share only necessary data via parameters
   - **Stamp coupling** (caution): modules share complex data structures when only part is needed
   - **Control coupling** (bad): module A passes a flag that tells module B what to do
   - **Content coupling** (critical): module A directly accesses module B's internals

4. **Rank findings by severity:**
   - **Critical**: Bugs hiding in complexity, untestable code, circular dependencies
   - **High**: Functions with cyclomatic complexity >15, classes with >500 lines
   - **Medium**: Code smells that slow development (duplicate code, feature envy)
   - **Low**: Style issues, minor naming problems, slightly long methods

**Output:** Smell report: list of findings with category, severity, location (file, line, function/class), description, and impact on maintainability.

**Quality gate:** Every finding has a specific location (not "the code has some duplication"). Complexity metrics are computed for all functions with >10 lines. At least the top 5 most complex functions are identified.

---

### Phase 2: PLAN -- Design Refactoring Strategy

**Entry criteria:** Smell report is complete with prioritized findings.

**Actions:**

1. **Group related smells into refactoring goals:**
   - Example: "Long Method + Duplicate Code in payment_service.py" = goal "Extract Payment Processing Pipeline"
   - Each goal should have a clear outcome: "After this refactoring, payment logic will be in 4 small functions instead of 1 large one"

2. **Select refactoring approach:**
   - **Incremental** (default): small, safe changes that each leave the code working. Each step is independently deployable.
   - **Strangler Fig** (for large modules): build new implementation alongside old, redirect traffic incrementally, remove old when 100% migrated. Best when rewriting >500 lines.
   - **Branch by Abstraction** (for shared dependencies): introduce an abstraction layer, migrate consumers one at a time, remove old implementation when all consumers migrated.

3. **Check backward compatibility constraints:**
   - Public API changes: any function/method signature changes that affect callers?
   - Database schema changes: any migrations needed?
   - Configuration changes: any new env vars or config keys?
   - For each breaking change: design a migration path (deprecation, adapter, versioning)

4. **Estimate effort per goal:**
   - XS: < 30 minutes (rename, extract method)
   - S: 30 min - 2 hours (extract class, introduce parameter object)
   - M: 2-8 hours (decompose large module, replace conditional with polymorphism)
   - L: 1-3 days (strangler fig migration, major interface redesign)
   - XL: > 3 days (architectural overhaul -- consider splitting into multiple plans)

5. **Define success criteria per goal:**
   - Quantitative: cyclomatic complexity reduced from X to Y, class size reduced from X to Y lines
   - Qualitative: code is now testable in isolation, responsibilities are clear
   - Behavioral: all existing tests still pass, no change in API behavior

**Output:** Refactoring plan: list of goals with approach, effort estimate, backward compatibility notes, and success criteria.

**Quality gate:** Every goal addresses at least one finding from the smell report. No goal is estimated as XL without a justification for why it can't be split. Backward compatibility impact is assessed for every goal.

---

### Phase 3: SEQUENCE -- Order Steps to Minimize Risk

**Entry criteria:** Refactoring plan with goals is complete.

**Actions:**

1. **Identify dependencies between steps:**
   - Step B depends on Step A if: B modifies code that A also modifies, or B relies on structure that A creates
   - Create a directed acyclic graph of step dependencies

2. **Apply sequencing rules:**
   - **Rule 1: Tests first.** Before any structural change, ensure tests exist for the behavior being preserved. If tests are missing, the first step is always "write characterization tests."
   - **Rule 2: Extract before restructure.** Extract methods/classes first (safe, adds no behavior). Then restructure the extracted code (riskier, changes structure).
   - **Rule 3: Rename before move.** Rename to match the target name/convention first. Then move to the target location. This makes git history cleaner.
   - **Rule 4: One responsibility per step.** Each step should do exactly one refactoring operation. Never combine "extract method" with "change its parameters" in the same step.
   - **Rule 5: Smallest blast radius first.** Start with changes that affect the fewest files. Build confidence before touching widely-imported code.
   - **Rule 6: Verify after every step.** After each step, run the full test suite. If tests fail, revert the step.

3. **Create the step sequence:**
   - For each step: name, refactoring type (from catalog), files affected, estimated time
   - Mark verification points: "run tests after this step"
   - Mark rollback points: "if this step fails, revert to commit X"

4. **Identify parallelizable steps:**
   - Steps that touch different files with no shared dependencies can be done in parallel (by different developers or in parallel branches)

**Output:** Ordered step sequence with dependencies, verification points, rollback points, and parallelization opportunities.

**Quality gate:** No step depends on a later step (DAG is valid). Every step that changes behavior has a "run tests" verification point. The first step is either "write tests" or "verify existing tests cover the target code."

---

### Phase 4: EXECUTE -- Generate Instructions Per Step

**Entry criteria:** Step sequence is defined and ordered.

**Actions:**

1. **For each step, generate:**

   a. **What to do** (plain language):
      - "Extract the shipping calculation logic (lines 47-89) from `place_order()` into a new function `calculate_shipping()`"

   b. **Before/after code example:**
      ```python
      # BEFORE
      def place_order(user, cart):
          # ... 20 lines of order setup ...
          # Shipping calculation (lines 47-89)
          weight = sum(item.weight for item in cart.items)
          if weight < 5:
              shipping = 5.99
          elif weight < 20:
              shipping = 12.99
          else:
              shipping = 24.99 + (weight - 20) * 0.50
          if user.is_premium:
              shipping = 0
          # ... 30 more lines ...

      # AFTER
      def calculate_shipping(items, is_premium):
          """Calculate shipping cost based on total weight and membership."""
          weight = sum(item.weight for item in items)
          if is_premium:
              return 0
          if weight < 5:
              return 5.99
          if weight < 20:
              return 12.99
          return 24.99 + (weight - 20) * 0.50

      def place_order(user, cart):
          # ... 20 lines of order setup ...
          shipping = calculate_shipping(cart.items, user.is_premium)
          # ... 30 more lines ...
      ```

   c. **Verification command:**
      - "Run `pytest tests/test_orders.py -v` -- all tests should pass with no changes"

   d. **Rollback instruction:**
      - "If tests fail: `git checkout -- services/order_service.py`"

   e. **Commit message:**
      - "Refactor: extract calculate_shipping from place_order"

2. **Apply the correct refactoring pattern** from the catalog (see Reference: Refactoring Catalog):
   - Each instruction references the specific named refactoring being applied
   - Include any mechanical steps that are easy to miss (update imports, adjust tests, rename references)

**Output:** Per-step execution instructions with before/after examples, verification commands, rollback instructions, and commit messages.

**Quality gate:** Every step has a before/after code example. Every step has a verification command. Before/after examples are syntactically correct. No step skips the rollback instruction.

---

### Phase 5: VERIFY -- Behavioral Equivalence

**Entry criteria:** All execution instructions are generated.

**Actions:**

1. **Generate regression checklist:**
   - List every public-facing behavior that must be preserved
   - For each behavior: how to test it (automated test name, manual test steps, or API call)
   - Flag behaviors that are NOT covered by existing tests (test gap)

2. **Define behavioral equivalence tests:**
   - For each refactored function/class: same inputs must produce same outputs
   - For stateful changes: same sequence of operations must produce same state
   - For performance-sensitive code: timing assertions or benchmarks

3. **Create a smoke test sequence:**
   - The minimal set of end-to-end tests that prove the system still works
   - Run after the final step, not just after individual steps
   - Include: the most common user workflow, the most critical business operation, the highest-risk code path

4. **Define rollback triggers:**
   - What specific test failures or production signals should trigger a full rollback?
   - "If any test in `test_orders.py` fails: revert all refactoring commits"
   - "If error rate exceeds 1% in production after deploy: revert"

5. **Measure improvement:**
   - Compare complexity metrics before and after (expected improvement)
   - Compare code smell count before and after
   - Track technical debt reduction if `refactoring_history` is provided

**Output:** Regression checklist, behavioral equivalence tests, smoke test sequence, rollback triggers, improvement metrics.

**Quality gate:** Every public behavior is listed in the regression checklist. At least one behavioral equivalence test exists per refactored function. Rollback triggers are specific and measurable.

---

## Exit Criteria

The skill is DONE when:
- All code smells are identified and prioritized
- A refactoring plan with goals, approach, and effort estimates is produced
- Steps are sequenced with dependencies and verification points
- Every step has before/after code examples and rollback instructions
- Behavioral equivalence verification covers all public behaviors
- Improvement metrics are defined (expected complexity reduction)

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| ASSESS | Code is too large to analyze completely (>10,000 lines) | **Adjust** -- focus on `target_area` if provided, otherwise analyze only the top 20 files by complexity |
| ASSESS | Language not recognized (cannot parse for metrics) | **Adjust** -- skip automated metrics, perform manual smell detection based on structure and naming |
| PLAN | No tests exist for the target code | **Adjust** -- make "write characterization tests" the mandatory first goal before any refactoring |
| PLAN | Backward compatibility cannot be maintained | **Escalate** -- document the breaking changes and recommend a versioned migration path |
| SEQUENCE | Circular dependency between steps | **Adjust** -- merge the circular steps into a single larger step with a combined verification |
| EXECUTE | Before/after example is ambiguous (multiple valid interpretations) | **Adjust** -- provide the full file context, not just the changed function |
| VERIFY | No tests exist to verify behavioral equivalence | **Adjust** -- generate the tests as part of the plan (Phase 3 Rule 1: tests first) |

## State Persistence

Between runs, this skill saves:
- **Refactoring log**: completed refactorings with before/after metrics
- **Technical debt score**: complexity and smell metrics tracked over time
- **Recurring smells**: smells that re-appear after refactoring (indicates deeper structural issue)
- **Effort actuals**: actual time vs estimated time for calibrating future estimates

---

## Reference

### Code Smell Taxonomy

#### Bloaters (code that has grown too large)
```
Long Method:           >30 lines, does multiple things, hard to name
Large Class:           >300 lines, has multiple responsibilities
Long Parameter List:   >4 parameters, especially if many are the same type
Primitive Obsession:   Using strings/ints where a domain type would be clearer
                       (e.g., status = "active" instead of Status.ACTIVE)
Data Clumps:           Same group of fields appears in multiple places
                       (e.g., street + city + zip always together -> Address)
```

#### Change Preventers (code that makes changes hard)
```
Divergent Change:      One class modified for many different reasons
                       (UserService handles auth AND profiles AND billing)
Shotgun Surgery:       One change requires modifying many classes
                       (changing the date format requires updating 15 files)
Parallel Inheritance:  Adding a subclass in one hierarchy requires adding
                       one in another (Red flag: XFoo, XBar, YFoo, YBar)
```

#### Dispensables (code that serves no purpose)
```
Lazy Class:            A class that does too little to justify its existence
Data Class:            A class with only getters/setters and no behavior
Duplicate Code:        Same logic in multiple places (even if slightly different)
Dead Code:             Unreachable code, unused variables, commented-out blocks
Speculative Generality: Abstractions built for future needs that never came
```

#### Couplers (code with excessive dependencies)
```
Feature Envy:          A method uses another class's data more than its own
                       (order.calculate_tax uses product fields extensively)
Inappropriate Intimacy: Two classes access each other's private fields
Message Chains:        a.getB().getC().getD().doThing() -- fragile chain
Middle Man:            A class that only delegates to another class
```

### Refactoring Catalog (Fowler)

#### Composing Methods
```
Extract Method:          Pull code into a new function with a descriptive name
Inline Method:           Replace a trivial function call with its body
Extract Variable:        Replace a complex expression with a named variable
Replace Temp with Query: Replace a temporary variable with a method call
```

#### Moving Features
```
Move Method:             Move a method to the class that uses its data most
Move Field:              Move a field to the class that uses it most
Extract Class:           Split a class doing two things into two classes
Inline Class:            Merge a class that does too little into its user
Hide Delegate:           Encapsulate a chain: a.getB().doX() -> a.doX()
```

#### Organizing Data
```
Replace Data Value with Object:    "john@example.com" -> Email("john@example.com")
Replace Type Code with Subclasses: status=1/2/3 -> Active, Inactive, Suspended
Introduce Parameter Object:        (x, y, w, h) -> Rectangle(x, y, w, h)
Encapsulate Collection:            Don't expose internal list; return unmodifiable view
```

#### Simplifying Conditionals
```
Decompose Conditional:             if/elif/else -> named methods for each branch
Consolidate Conditional:           Multiple ifs with same result -> single if with OR
Replace Conditional with Polymorphism: switch(type) -> type.doThing()
Introduce Null Object:             if (x != null) checks -> NullX that does nothing
Replace Nested Conditional with Guard Clauses: Flatten deep nesting with early returns
```

#### Dealing with Generalization
```
Pull Up Method:          Move identical method from subclasses to superclass
Push Down Method:        Move method from superclass to the subclass that needs it
Extract Superclass:      Two classes share behavior -> create common parent
Extract Interface:       Define the contract a class fulfills
Replace Inheritance with Delegation: "Is-a" that should be "has-a"
```

### Strangler Fig Pattern

For large-scale refactoring where rewriting isn't safe:

```
Step 1: IDENTIFY the boundary
  - Define the API surface of the code to be replaced
  - All callers interact through this boundary

Step 2: BUILD the new implementation
  - Write the new code alongside the old
  - New code implements the same boundary/interface
  - New code has full test coverage from day one

Step 3: REDIRECT incrementally
  - Route one caller at a time to the new implementation
  - Feature flags or routing logic control which implementation handles each request
  - Monitor both old and new for correctness

Step 4: REMOVE the old code
  - When 100% of traffic uses the new implementation
  - Remove the old code, the routing logic, and the feature flags
  - The strangler vine has fully replaced the tree
```

### Complexity Metrics Reference

#### Cyclomatic Complexity (McCabe)
```
Count the decision points:
  +1 for each: if, elif, for, while, and, or, except, case, ternary (? :)
  +1 base (the function itself)

Example:
  def process(items):           # base: 1
      for item in items:        # +1 = 2
          if item.is_valid():   # +1 = 3
              if item.price > 0:# +1 = 4
                  save(item)
              else:
                  log(item)
          elif item.is_retry(): # +1 = 5
              retry(item)
      return True
  # Cyclomatic complexity: 5

Interpretation:
  1-5:    Simple, low risk
  6-10:   Moderate, consider simplifying
  11-20:  Complex, hard to test all paths
  21+:    Very complex, refactor immediately
```

#### Cognitive Complexity (Sonar)
```
Adds a nesting penalty that cyclomatic complexity misses:

  def process(items):
      for item in items:              # +1 (nesting 0)
          if item.is_valid():         # +2 (1 for if + 1 for nesting level 1)
              if item.price > 0:      # +3 (1 for if + 2 for nesting level 2)
                  save(item)
  # Cognitive complexity: 6

Same branching, but flat:

  def process(items):
      valid = [i for i in items if i.is_valid()]  # +1
      priced = [i for i in valid if i.price > 0]  # +1
      for item in priced:                          # +1
          save(item)
  # Cognitive complexity: 3

The flat version is easier to understand despite similar logic.
```

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
