# Hypothesis Stateful Rule-Based Machine

**One-line description:** Builds a `hypothesis.stateful.RuleBasedStateMachine` that runs random sequences of operations against a stateful Python object and a plain in-memory model side by side, checks invariants after every step, and reads the shrunk step list Hypothesis prints when the two disagree.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `property_catalog` (object[], required): Must contain a model row (pattern `model`) listing operations, the model structure and observables.
- `hypothesis_config` (object, required): Profiles from `pft-py-hypothesis-setup`.
- `repo_path` (string, required): Project root.

---

## Outputs

- `py_state_machine_tests` (object[]): Machine class name, test file, rules, preconditions, invariants, the `stateful_step_count` used, and the mutation that proved the machine can fail.

---

## Phase 1: Design the Model

### Entry Criteria
- A `model` row exists in `property_catalog` for the target class.

### Actions
1. List the operations from the model row. For each operation write: arguments, what it does to the model, what it returns, and when it is allowed (precondition).
2. Pick the simplest model data structure that has the same observable behavior:

| Real system | Model |
|---|---|
| Key-value store, cache without eviction | `dict` |
| LRU cache with capacity | `collections.OrderedDict` with `move_to_end` and `popitem(last=False)` |
| FIFO queue | `collections.deque` |
| Priority queue | sorted `list` |
| Counter, account balance | `int` |
| Set-like index | `set` |

3. Decide which values must be reused across steps (keys inserted earlier, handles returned by `open`). Each becomes a `Bundle`.
4. Write invariants that must hold after every step (size equality, `len(real) == len(model)`, balance never negative if documented).

### Output
A model design table.

### Quality Gate
- Every operation has a model effect and a precondition (or "always allowed").
- Every value reused across steps is mapped to a named `Bundle`.

---

## Phase 2: Write the Machine

### Entry Criteria
- Model design table exists.

### Actions
1. Create `tests/property/test_<target>_stateful.py`. Use only these names from `hypothesis.stateful`: `RuleBasedStateMachine`, `Bundle`, `rule`, `initialize`, `invariant`, `precondition`, `consumes`, `multiple`.
2. Template for an LRU cache:

```python
from collections import OrderedDict
from hypothesis import settings, strategies as st
from hypothesis.stateful import RuleBasedStateMachine, Bundle, rule, invariant, initialize, precondition
from mypkg.cache import LRUCache

class LRUMachine(RuleBasedStateMachine):
    keys = Bundle("keys")

    @initialize(capacity=st.integers(min_value=1, max_value=8))   # bounds from the catalog row
    def setup(self, capacity):
        self.cap = capacity
        self.real = LRUCache(capacity)
        self.model = OrderedDict()

    @rule(target=keys, k=st.text(max_size=3), v=st.integers())
    def put(self, k, v):
        self.real.put(k, v)
        self.model[k] = v
        self.model.move_to_end(k)
        if len(self.model) > self.cap:
            self.model.popitem(last=False)
        return k

    @rule(k=keys)
    def get_known(self, k):
        expected = self.model.get(k)
        if k in self.model:
            self.model.move_to_end(k)
        assert self.real.get(k) == expected

    @invariant()
    def sizes_match(self):
        assert len(self.real) == len(self.model)

TestLRU = LRUMachine.TestCase
TestLRU.settings = settings(stateful_step_count=50)   # 50 is the documented default
```

3. Use `@precondition(lambda self: ...)` on rules that are only valid in some states (for example `pop` only when the model is non-empty). Do not put an `if` that silently returns inside the rule body instead; that wastes steps and hides coverage.
4. Use `consumes(keys)` when an operation destroys the value (`delete`, `close`), so later steps cannot reuse a dead handle unless that is the behavior being tested.
5. Keep strategy bounds from the catalog. Small key alphabets (like `max_size=3` above) increase collisions, which is what exposes eviction bugs; record that choice as a design decision, and get the bound from the user if it matters.
6. Run: `python -m pytest tests/property/test_<target>_stateful.py -q --hypothesis-show-statistics`.

### Output
Machine test file that passes.

### Quality Gate
- The test exits 0 under the `dev` profile.
- The statistics block reports passing examples; invalid examples are not the majority (a majority means preconditions are too strict).

---

## Phase 3: Prove the Machine Can Fail and Read the Output

### Entry Criteria
- Machine passes.

### Actions
1. Introduce one temporary bug in the target (for example evict the most recently used item instead of the least).
2. Run the test. Hypothesis prints a reproducible program. Read it top to bottom; each line is one rule call:

```text
state = LRUMachine()
state.setup(capacity=1)
keys_0 = state.put(k='', v=0)
keys_1 = state.put(k='0', v=0)
state.get_known(k=keys_1)
state.teardown()
```

3. Copy this program into the work notes; it is the minimal failing sequence. Paste it into a plain pytest function if you need a debugger on it.
4. Revert the bug: `git checkout -- <target file>`; confirm `git diff` is empty for that file.
5. Record the rules, invariants, step count and mutation in `py_state_machine_tests`.

### Output
`py_state_machine_tests`.

### Quality Gate
- The mutation produced a printed step program ending in a failing assertion.
- The target file is unchanged after revert (`git diff --quiet -- <file>` exits 0).

---

## Worked Example

Illustrative. Target `mypkg.cache.LRUCache`, model row M1: operations put, get; observable get result and size.

Mutation: `popitem(last=True)` in the real class.

```text
$ python -m pytest tests/property/test_cache_stateful.py -q
F
AssertionError: assert 0 == None
Falsifying example:
state = LRUMachine()
state.setup(capacity=1)
keys_0 = state.put(k='', v=0)
keys_1 = state.put(k='0', v=0)
state.get_known(k=keys_0)
state.teardown()
```

Read: capacity 1, two puts, reading the first key should miss (model returns None) but the buggy real cache evicted the new key and still returned 0. After revert, the test passes.

---

## Exit Criteria

DONE when the machine passes on the unmodified target, a recorded mutation produced a shrunk step program, and the target is restored.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No model row in the catalog | **Return**: send the target back to `pft-invariant-discovery` with `has_stateful_api` true. |
| Phase 2 | `Flaky` raised | **Adjust**: the target depends on time, randomness or shared state across machine runs; inject it or reset it in `@initialize` and `teardown`. |
| Phase 2 | Real failure before any mutation | **Return**: record the printed program for `pft-shrinking-reproduction`; it is a target bug. |
| Phase 2 | Health check `filter_too_much` | **Adjust**: loosen preconditions or draw valid arguments from bundles. |
| Phase 3 | Mutation not detected | **Adjust**: add an invariant or compare a return value the mutation changes, then rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
