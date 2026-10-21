# Interface Boundary and Contract Test Suite

**One-line description:** Writes the candidate's facade as an explicit interface of plain data types (no ORM objects, no framework types), moves every caller onto it one file per commit, and writes a single contract test suite that runs against any implementation of that interface, so the same tests later prove an HTTP or gRPC client behaves exactly like the in-process module.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `seam_map` (object, required): From `mex-seam-identification`; supplies `public_api`, `order_of_work` and edges marked `route_via_facade`.
- `table_ownership` (object[], required): From `mex-table-ownership-map`.
- `boundary_violations` (object[], required): From `mex-seam-identification`.
- `stack` (string, required): `python`, `node`, `go` or `java`.

---

## Outputs

- `module_interface` (object): Interface file path, every operation with request and response types, error types, idempotency rule per write operation, and the version string.
- `interface_contract_tests` (object): Test file path, the parameterized fixture or factory that selects the implementation, the run command, and the pass count against the in-process implementation.

---

## Phase 1: Write the Interface

### Entry Criteria
- `seam_map.public_api` is non-empty.

### Actions
1. Create one interface file in the candidate. Use the stack's native abstraction:

   | Stack | Interface form | Data types |
   |---|---|---|
   | python | `typing.Protocol` class in `billing/api.py` | `@dataclass(frozen=True)` or Pydantic models |
   | node | TypeScript `interface BillingApi` in `src/billing/api.ts` | `type` or `interface` with only JSON-safe fields |
   | go | `type API interface` in `internal/billing/api.go` | structs with exported fields, no pointers to store types |
   | java | `public interface BillingApi` in `com.acme.billing.api` | Java `record` types |

2. Rules for every operation, all mandatory:
   - Arguments and results are plain values that can be serialized to JSON (or protobuf) without custom code: IDs as strings or integers, money as integer minor units plus currency code, timestamps as UTC ISO 8601 strings or epoch values. Never pass an ORM entity, query set, session, HTTP request or framework context across.
   - Every write operation takes an `idempotency_key` (or a natural key) so a retried call after a timeout does not double-write. This matters as soon as the call goes over a network.
   - Errors are a small closed set defined in the interface file (`NotFound`, `Conflict`, `ValidationFailed`, `Unavailable`). Do not let database exceptions escape.
   - No operation returns more data than its callers in `seam_map` use (check the call shapes recorded there).
   - Batch reads exist where callers loop (a caller calling `get_invoice` inside a `for` loop gets `get_invoices(ids)`), because each call becomes a network round trip later.
3. Write the in-process implementation class that satisfies the interface by calling the existing candidate code. Do not rewrite logic.
4. Run the compiler or type checker: python `mypy billing/api.py` (or `pyright`), node `npx tsc --noEmit`, go `go vet ./internal/billing/...`, java `./mvnw -q compile`.

### Output
Interface file and in-process implementation.

### Quality Gate
- The type check command exits 0.
- `rg -n "models\.|Entity|QuerySet|\*sql\.|Session" <interface file>` returns nothing (no persistence types in signatures).

---

## Phase 2: Write the Contract Test Suite

### Entry Criteria
- Interface compiles.

### Actions
1. Write tests against the interface type only. The implementation is supplied by a fixture or factory:
   - python: `@pytest.fixture(params=["inprocess"])` returning the implementation; add `"http"` later.
   - node: `describe.each([["inprocess", makeInProcess]])("BillingApi %s", (_, make) => { ... })`.
   - go: `func RunContract(t *testing.T, newAPI func(t *testing.T) billing.API)` in `billingtest/contract.go`, called from `TestInProcess`.
   - java: abstract JUnit 5 class `BillingApiContract` with `abstract BillingApi api();`, subclass `InProcessBillingApiContractTest`.
2. Cover per operation: one success, each declared error, idempotent retry (same key twice gives one effect and the same result), and batch read with a missing ID.
3. Do not mock the implementation inside contract tests; mocks make the suite prove nothing about the real code.
4. Run the suite. All tests must pass against the in-process implementation.

### Output
`interface_contract_tests` with its run command and pass count.

### Quality Gate
- The contract suite command exits 0 and prints its pass count.
- `rg -n "mock|Mock|stub|jest.fn|patch\(" <contract test file>` returns nothing.

---

## Phase 3: Move Callers onto the Interface

### Entry Criteria
- Contract tests pass.

### Actions
1. Walk `seam_map.order_of_work` steps of type `route_via_facade`. For each step: edit only the one named file, replace the internal import with the interface, run `extraction_brief.test_command` scoped to both modules plus the characterization suite, and commit.
2. Never edit more than one caller file per commit. If a caller needs a new operation, add it to the interface, its implementation and the contract suite first, in its own commit.
3. After the last caller moves, re-run the stack's graph flow and confirm the inbound edges now land only on the interface file.
4. Bump `module_interface.version` only when an operation's signature changes after callers use it.

### Output
`module_interface` with all callers migrated.

### Quality Gate
- Every entry in `boundary_violations` is fixed: re-running the graph flow shows zero inbound edges to internal symbols.
- The characterization suite passes with no snapshot updates.

---

## Worked Example

Illustrative. Go candidate `internal/billing`.

```go
// internal/billing/api.go
type CreateInvoiceRequest struct { OrderID string; Lines []Line; IdempotencyKey string }
type Invoice struct { ID, OrderID, Currency, Status string; TotalMinor int64; IssuedAt time.Time }
var ErrNotFound = errors.New("billing: not found")
type API interface {
    CreateInvoice(ctx context.Context, r CreateInvoiceRequest) (Invoice, error)
    GetInvoices(ctx context.Context, ids []string) (map[string]Invoice, error)
}
```
```
$ go test ./internal/billing/billingtest/... -run TestInProcess -v
--- PASS: TestInProcess/CreateInvoice/idempotent_retry (0.02s)
ok   example.com/shop/internal/billing/billingtest  0.61s
```
Caller move: `internal/orders/checkout.go` switched from `store.InsertInvoice` to `api.CreateInvoice`; `go test ./internal/orders/... ./internal/billing/...` passes; committed.

---

## Exit Criteria

DONE when the interface uses only plain data types, every write is idempotent by key, the contract suite passes against the in-process implementation with no mocks, and every former boundary violation goes through the interface.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A caller needs lazy-loaded ORM relations | **Adjust**: add an explicit field or a batch read; do not return the entity. |
| Phase 1 | Caller and candidate share a database transaction | **Return**: record it as a blocker for `mex-in-process-or-service-decision`; a network call cannot join that transaction. |
| Phase 2 | A test fails against the in-process implementation | **Stop**: the interface misdescribes current behavior; fix the interface or test to match the characterization snapshots, never the reverse. |
| Phase 3 | Caller move breaks unrelated tests | **Retry**: revert that one commit with `git revert`, inspect, and redo smaller. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
