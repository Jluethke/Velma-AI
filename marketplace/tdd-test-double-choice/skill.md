# TDD Test Double Choice

**One-line description:** Picks the right test double (dummy, stub, spy, mock or fake, per Meszaros) for each collaborator with a decision table, applies "don't mock what you don't own" through adapters, and names the exact library calls for Python, Node, Go, Rust and Java.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `collaborators` (object[], required): From `tdd-outside-in-or-inside-out`: name, role, owned.
- `stack` (string, required): `python`, `node`, `go`, `rust` or `java`.
- `boundaries` (string[], optional): Boundary kinds the feature touches: any of `time`, `randomness`, `filesystem`, `environment`, `http`. Used by later steps to decide which boundary flows run. When absent, derived from collaborator roles.

---

## Outputs

- `double_plan` (object[]): One row per collaborator: name, double type, reason (table row), library call to create it, what the test asserts, and the adapter to write when the collaborator is not owned. Also a `boundaries` list.

---

## Phase 1: Choose the Double Type

### Entry Criteria
- `collaborators` is present (an empty list means no doubles are needed; emit an empty plan).

### Actions
1. Apply the first matching row for each collaborator:

| # | Collaborator role or situation | Double | Test asserts |
|---|---|---|---|
| 1 | Passed in but not used by this behavior | dummy (any placeholder value, `None`, `nil`) | nothing about it |
| 2 | query (returns data, no side effect) | stub returning fixed data | the unit's output, never that the stub was called |
| 3 | stateful store (repository, cache, queue) | fake: a small in-memory working version | state read back through the fake |
| 4 | clock, random source, filesystem, environment, HTTP API | a boundary seam; hand off to the matching boundary flow | per that flow |
| 5 | command whose side effect IS the behavior (send email, charge card, publish event) | mock or spy that records calls | the call happened once with the right arguments |
| 6 | Value object, data class, collection | the real thing | never doubled |

2. Rule for row 5 versus row 2: if removing the call would make the behavior wrong in a way a user could notice, verify the call (mock/spy). If the call only fetches data, stub it and assert on output. Verifying a query's call ties the test to implementation and breaks on refactor.
3. Never double the unit under test itself or one of its private methods.

### Output
Double type per collaborator.

### Quality Gate
- Every collaborator has a row number from the table.
- No row-2 (query) collaborator has a "was called" assertion planned.

---

## Phase 2: Wrap What You Do Not Own

### Entry Criteria
- Double types chosen.

### Actions
1. For every collaborator with `owned: false` (SDK client, ORM session, cloud library), do NOT mock the library directly (Freeman and Pryce, "Growing Object-Oriented Software, Guided by Tests"). Instead:
   - Define a small interface in your code named after your need (`PaymentGateway.charge(amount, token)`), with only the methods the behavior uses.
   - The unit under test depends on that interface. Double the interface.
   - The real adapter that calls the SDK gets a few integration tests against the real service or its official local emulator, run separately.
2. Record the adapter name and method signatures in `double_plan`.

### Output
Adapter list.

### Quality Gate
- No planned test imports a third-party SDK only to mock it (check the plan's library calls).
- Every adapter interface lists only methods used by a behavior row.

---

## Phase 3: Name the Library Calls

### Entry Criteria
- Adapters defined.

### Actions
1. Fill the library call for each double from this table:

| stack | Stub | Mock / spy | Fake |
|---|---|---|---|
| python | `create_autospec(Repo, instance=True)` then `repo.get.return_value = x` | `create_autospec(Mailer, instance=True)` then `mailer.send.assert_called_once_with(...)` | hand-written class `InMemoryRepo` |
| node (Jest) | `jest.fn().mockReturnValue(x)` | `jest.fn()` + `expect(fn).toHaveBeenCalledWith(...)`; `jest.spyOn(obj, 'm')` | hand-written object or class |
| node (Vitest) | `vi.fn().mockReturnValue(x)` | `vi.fn()` / `vi.spyOn(obj, 'm')` + `toHaveBeenCalledWith` | hand-written object or class |
| go | struct implementing the interface with fixed return fields | struct that appends calls to a slice; or `go.uber.org/mock` (`mockgen`) | struct backed by a `map` |
| rust | struct implementing the trait | `mockall` with `#[automock]` on the trait and `.expect_send().times(1).with(...)` | struct backed by a `HashMap` |
| java | Mockito `when(repo.find(id)).thenReturn(x)` | Mockito `verify(mailer).send(expected)` | hand-written class implementing the interface |

2. Python patching rule: `patch("app.orders.Mailer")` patches the name where it is LOOKED UP (the module under test), not where it is defined. Prefer passing the double in through the constructor over `patch`.
3. Always use spec-checked doubles where the library offers them: `create_autospec` or `spec_set=True` (Python), typed `vi.fn<...>()` / `jest.fn<...>()` with TypeScript, Mockito strict stubs via `@ExtendWith(MockitoExtension.class)` (reports `UnnecessaryStubbingException` for unused stubs). A plain `Mock()` accepts any misspelled method and hides bugs.
4. Jest and Vitest hoist `jest.mock(...)` / `vi.mock(...)` to the top of the file. Variables used inside the factory must be prefixed `mock` (Jest) or created with `vi.hoisted` (Vitest).
5. Compute `boundaries`: use the input if given, otherwise collect roles clock to `time`, random source to `randomness`, filesystem to `filesystem`, environment to `environment`, HTTP API to `http`.

### Output
`double_plan`.

### Quality Gate
- Every row in `double_plan` names a call that exists in the table for `stack` (no invented APIs).
- `double_plan.boundaries` is present (empty list allowed).

---

## Worked Example

Illustrative only. `stack` = `python`. Collaborators: OrderRepository (stateful store, owned), Clock (clock, owned), StripeClient (command, owned: false).

Phase 1: OrderRepository row 3 (fake), Clock row 4 (time boundary), StripeClient row 5 (mock).
Phase 2: StripeClient wrapped as `PaymentGateway` with `charge(amount_cents: int, token: str) -> ChargeResult`.
Phase 3:

| name | double | call |
|---|---|---|
| OrderRepository | fake | `InMemoryOrderRepository()` with `add` and `get` |
| PaymentGateway | mock | `gw = create_autospec(PaymentGateway, instance=True)`; `gw.charge.assert_called_once_with(1999, "tok_visa")` |
| Clock | seam | handed to `tdd-time-boundary` |

`boundaries` = ["time"].

---

## Exit Criteria

DONE when every collaborator has a table-chosen double, third-party code is behind an owned interface, and every double has a real library call for the stack.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Collaborator role missing | **Return**: send back to `tdd-outside-in-or-inside-out` for a role. |
| Phase 2 | Unit constructs the SDK client internally (no seam) | **Adjust**: add a constructor parameter for the adapter as the first refactor, under existing green tests. |
| Phase 3 | Stack library not installed (`mockall`, `mockito`, `go.uber.org/mock`) | **Adjust**: use the hand-written column, which needs no library. |
| Phase 3 | A mock would need to return another mock | **Stop**: the design has a train-wreck call chain; introduce one interface that returns the needed data. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
