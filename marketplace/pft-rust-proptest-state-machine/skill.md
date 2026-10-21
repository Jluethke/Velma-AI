# proptest State Machine Testing

**One-line description:** Uses the `proptest-state-machine` crate to check a stateful Rust type against a reference state machine: a `ReferenceStateMachine` generates valid transitions from a simple model, a `StateMachineTest` applies them to the real type and checks invariants, and proptest shrinks failing transition sequences.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `property_catalog` (object[], required): Must contain a `model` row with operations, model structure and observables.
- `repo_path` (string, required): Crate root containing `Cargo.toml`.

---

## Outputs

- `rust_state_machine_tests` (object[]): Test file, transition enum, reference state type, preconditions, invariants, sequence length range and its source, and the mutation with its shrunk transition list.

---

## Phase 1: Model and Transitions

### Entry Criteria
- A `model` row exists; `cargo test` passes before changes.

### Actions
1. Add dependencies: `cargo add --dev proptest proptest-state-machine`. Confirm with `cargo tree -e dev -i proptest-state-machine`.
2. Open docs.rs for the exact installed version of `proptest-state-machine` and copy the trait signatures of `ReferenceStateMachine` and `StateMachineTest` from there. Method signatures changed between releases; do not write them from memory.
3. Define the reference state as a plain std type (for example `Vec<u32>` for a queue, `BTreeMap<K, V>` for a map).
4. Define one enum with a variant per operation:

```rust
#[derive(Clone, Debug)]
enum Transition { Push(u32), Pop, Clear }
```

`Debug` is required so failures print the sequence.

### Output
Reference state type and transition enum.

### Quality Gate
- Every catalog operation maps to one enum variant.
- The trait signatures in the notes are copied from docs.rs for the version shown by `cargo tree`.

---

## Phase 2: Implement the Two Traits

### Entry Criteria
- Types defined; signatures copied.

### Actions
1. Implement `ReferenceStateMachine` for a unit struct `RefQueue`:

| Item | Purpose |
|---|---|
| `type State` | the reference model |
| `type Transition` | the enum |
| `init_state()` | strategy for the initial model, often `Just(Vec::new()).boxed()` |
| `transitions(state)` | strategy for the next transition, built with `prop_oneof!`; may depend on the state (no `Pop` when empty) |
| `apply(state, transition)` | returns the new model |
| `preconditions(state, transition)` | returns false for transitions invalid in this state; proptest checks it again during shrinking |

2. Implement `StateMachineTest` for a test struct:

| Item | Purpose |
|---|---|
| `type SystemUnderTest` | the real type |
| `type Reference` | `RefQueue` |
| `init_test(ref_state)` | build a fresh real object matching the initial model |
| `apply(sut, ref_state, transition)` | apply to the real object, assert observable results against the already-updated reference, return the real object |
| `check_invariants(sut, ref_state)` | assertions that must hold after every step (length equality, ordering) |

3. Declare the test with the macro:

```rust
use proptest_state_machine::prop_state_machine;

prop_state_machine! {
    #[test]
    fn queue_matches_model(sequential 1..<user_max> => QueueTest);
}
```

The range is the number of transitions per case; take its upper bound from the user or the catalog. Add `#![proptest_config(...)]` inside the macro only if the docs for your version show it.
4. Run `cargo test queue_matches_model -- --nocapture`.

### Output
Passing state machine test.

### Quality Gate
- `cargo test queue_matches_model` exits 0 on the unmodified target.
- `preconditions` returns false for every transition that is invalid on an empty or full model (check by reading the match arms).

---

## Phase 3: Mutation-Check and Read the Sequence

### Entry Criteria
- Test passes.

### Actions
1. Inject one temporary bug (for example `pop` returns the newest element, or `clear` leaves the length unchanged).
2. Run the test. proptest prints the minimal failing input as the initial state plus the transition list in `Debug` form, for example `minimal failing input: (initial_state, transitions) = ([], [Push(0), Push(1), Pop])`. The exact layout depends on the crate version.
3. Record that sequence; it is the reproduction. A regression seed is written under `proptest-regressions/`.
4. Revert the bug with `git checkout -- <file>`, delete the mutant's regression line, rerun green.

### Output
`rust_state_machine_tests`.

### Quality Gate
- The mutation produced a printed transition list.
- `git diff -- src/` is empty and `proptest-regressions/` holds no mutant seeds.

---

## Worked Example

Illustrative. Target `RingBuffer<u32>` with capacity from the catalog; operations push, pop, len.

Mutation: `pop` uses `self.head` before advancing `self.tail`.

```text
$ cargo test ring_matches_model
---- ring_matches_model stdout ----
thread 'ring_matches_model' panicked at tests/ring_sm.rs:58:9:
assertion `left == right` failed
  left: Some(1)
 right: Some(0)
minimal failing input: (initial_state, transitions) = (
    [],
    [Push(0), Push(1), Pop],
)
```

Read: push 0, push 1, pop must return 0 (FIFO) but returned 1. After revert, `cargo test ring_matches_model` reports `ok`.

---

## Exit Criteria

DONE when the reference state machine test passes on the real type, a recorded mutation yielded a shrunk transition list, and no mutant seed or source change remains.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Trait signatures in examples do not compile | **Adjust**: copy signatures from docs.rs for the installed version; do not guess. |
| Phase 2 | Shrinking produces sequences that violate preconditions | **Adjust**: put every validity rule in `preconditions`, not only in `transitions`. |
| Phase 2 | Real failure on the unmodified type | **Return**: keep the regression seed and record the sequence for `pft-shrinking-reproduction`. |
| Phase 3 | Mutation not detected | **Adjust**: assert return values in `apply` and add an invariant the mutation breaks. |
| Phase 3 | Sequence length bound not provided | **Return**: ask the user; a bound in the macro is required. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
