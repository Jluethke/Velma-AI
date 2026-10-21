# fast-check Model-Based Command Testing

**One-line description:** Writes fast-check model-based tests where each operation on a stateful JavaScript or TypeScript API is a `fc.Command` class with `check`, `run` and `toString`, generates random command sequences with `fc.commands`, runs them with `fc.modelRun` or `fc.asyncModelRun`, and reads the shrunk command list on failure.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `property_catalog` (object[], required): Must contain a `model` row with operations, model structure and observables.
- `repo_path` (string, required): Root containing `package.json` with fast-check installed (see `pft-node-fastcheck-properties` Phase 1).

---

## Outputs

- `node_model_tests` (object[]): Test file, command classes, model type, sync or async runner, the `maxCommands` value and its source, and the mutation with the printed failing command sequence.

---

## Phase 1: Define Model and Commands

### Entry Criteria
- A `model` row exists; `npm ls fast-check` resolves.

### Actions
1. Write the model as a plain object type, for example `type Model = { items: string[] }` for a stack or `Map<string, number>` for a store.
2. For each operation, write one command class. Fields: the generated arguments. Methods:

| Method | Does | Rule |
|---|---|---|
| `check(m: Readonly<Model>)` | returns true if the command is allowed in this model state | pure; no mutation |
| `run(m: Model, r: Real)` | calls the real API, updates the model, asserts the observable matches | the only place assertions go |
| `toString()` | returns a readable call like `push("a")` | needed to read failures |

3. Decide sync or async: if any real method returns a Promise, every command implements `fc.AsyncCommand` and the run uses `fc.asyncModelRun`.

### Output
Command class design.

### Quality Gate
- Every catalog operation has exactly one command class.
- Every `check` is free of side effects (no assignment to `m`).

---

## Phase 2: Write and Run the Test

### Entry Criteria
- Design exists.

### Actions
1. Create `test/property/<target>.model.test.ts`. Template for a bounded stack:

```ts
import fc from 'fast-check';
import { BoundedStack } from '../../src/stack';

type Model = { items: number[]; cap: number };

class PushCommand implements fc.Command<Model, BoundedStack> {
  constructor(readonly v: number) {}
  check = (m: Readonly<Model>) => m.items.length < m.cap;
  run(m: Model, r: BoundedStack) {
    r.push(this.v);
    m.items.push(this.v);
    expect(r.size()).toBe(m.items.length);
  }
  toString = () => `push(${this.v})`;
}

class PopCommand implements fc.Command<Model, BoundedStack> {
  check = (m: Readonly<Model>) => m.items.length > 0;
  run(m: Model, r: BoundedStack) {
    expect(r.pop()).toBe(m.items.pop());
  }
  toString = () => 'pop()';
}

test('stack matches model', () => {
  const cmds = [fc.integer().map((v) => new PushCommand(v)), fc.constant(new PopCommand())];
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 4 }), fc.commands(cmds, { maxCommands: 100 }), (cap, seq) => {
      fc.modelRun(() => ({ model: { items: [], cap }, real: new BoundedStack(cap) }), seq);
    })
  );
});
```

The capacity range and `maxCommands` above are illustrative; take them from the catalog row or the user, or omit `maxCommands` to use the fast-check default.
2. The setup function passed to `modelRun` must build a fresh model and real object every time. A shared object across runs makes shrinking produce nonsense.
3. For race conditions between async operations, use `fc.scheduler()` with `fc.scheduledModelRun(s, setup, cmds)`; check the fast-check docs on "race conditions" for the installed version before using it.
4. Run `npx vitest run test/property/<file>` or `npx jest test/property/<file>`.

### Output
Passing model test.

### Quality Gate
- The model test exits 0 on the unmodified target.
- Each run builds a new real object (grep the setup function for `new` or a factory call).

---

## Phase 3: Mutation-Check and Read the Sequence

### Entry Criteria
- Test passes.

### Actions
1. Inject one temporary bug (for example `push` silently drops values when full instead of throwing, or `pop` returns the bottom element).
2. Run the test. Read the counterexample: fast-check prints the commands using `toString`, for example `Counterexample: [2,push(0),push(1),pop()]`, followed by the `seed`, `path` and a `replayPath` for the command list.
3. Replay with `fc.assert(prop, { seed, path, endOnFailure: true })` and, for commands, pass the printed `replayPath` to `fc.commands(cmds, { replayPath: "..." })`.
4. Revert the bug with `git checkout -- <file>`; confirm green.
5. Record the sequence, seed, path and replayPath in `node_model_tests`.

### Output
`node_model_tests`.

### Quality Gate
- The mutation produced a printed command sequence and the replay failed identically.
- `git diff -- src/` is empty after revert.

---

## Worked Example

Illustrative. Target `BoundedStack`; mutation: `pop()` returns `items.shift()`.

```text
$ npx vitest run test/property/stack.model.test.ts
Property failed after 9 tests
{ seed: 302116577, path: "8:2:1:3", endOnFailure: true }
Counterexample: [2,push(0),push(1),pop() /*replayPath="CCA"*/]
Shrunk 6 time(s)
Got error: expected 0 to be 1
```

Read: capacity 2, push 0 then 1, pop should return 1 but the mutant returned 0. After `git checkout -- src/stack.ts` the test passes.

---

## Exit Criteria

DONE when each stateful JavaScript or TypeScript target has a passing model-based test, a recorded mutation produced a readable shrunk command sequence that replays, and the source is restored.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `model` row in the catalog | **Return**: send the target back to `pft-invariant-discovery` with `has_stateful_api` true. |
| Phase 2 | Failure output shows `[object Object]` | **Adjust**: implement `toString` on every command. |
| Phase 2 | Real failure on the unmodified target | **Return**: record sequence, seed, path, replayPath for `pft-shrinking-reproduction`. |
| Phase 2 | Async test passes instantly with no commands run | **Adjust**: use `fc.asyncModelRun` and `await fc.assert` on an `fc.asyncProperty`. |
| Phase 3 | Shrunk sequence is long and unreadable | **Adjust**: make `check` stricter so invalid commands are dropped, and confirm the setup builds fresh state. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
