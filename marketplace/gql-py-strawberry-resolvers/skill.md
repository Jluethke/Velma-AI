# Strawberry Resolvers Matching an SDL (Python)

**One-line description:** Implements a Strawberry (code-first) schema in Python that reproduces the agreed SDL exactly, proven by exporting the Strawberry schema and diffing it against `schema.graphql`, served through the FastAPI integration.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `validated_schema` (string, required): Path to the lint-clean `schema.graphql` (the contract).
- `project_dir` (string, required): Python project root.

---

## Outputs

- `resolver_code` (string): Path to the Strawberry schema module (for example `app/schema.py`).
- `server_entry` (string): Path to the ASGI app (for example `app/main.py`) and the start command.

---

## Phase 1: Map SDL to Strawberry Types

### Entry Criteria
- Python 3.9 or newer (check the Strawberry release notes for the current minimum): `python --version`.

### Actions
1. In a virtual environment: `pip install "strawberry-graphql[fastapi]" uvicorn`.
2. Translate each SDL type with this table:

| SDL | Strawberry |
|---|---|
| `type Order implements Node` | `@strawberry.type class Order(Node):` where `Node` is a `@strawberry.interface` |
| `id: ID!` | `id: strawberry.ID` |
| `String!` | `str` |
| `String` (nullable) | `str \| None` (or `Optional[str]`) |
| `[Order!]!` | `list[Order]` |
| `[Order]` | `list[Order \| None] \| None` |
| `enum OrderStatus` | `@strawberry.enum class OrderStatus(Enum):` |
| `input CancelOrderInput` | `@strawberry.input class CancelOrderInput:` |
| `scalar DateTime` | `datetime.datetime` (Strawberry ships `DateTime`) |

3. Strawberry converts snake_case Python names to camelCase in the schema by default (`StrawberryConfig(auto_camel_case=True)`). Write `placed_at` in Python to get `placedAt` in the schema.
4. Strawberry also ships a Relay module (`strawberry.relay`) with its own `Node` and `Connection`. Use it only if its generated SDL matches the contract; the diff in Phase 3 decides.

### Output
Type classes in `app/schema.py`.

### Quality Gate
- `python -c "import app.schema"` exits 0.

---

## Phase 2: Write Resolvers

### Entry Criteria
- Types import.

### Actions
1. Root fields: `@strawberry.type class Query:` with methods decorated `@strawberry.field`. Signature `async def order(self, info: strawberry.Info, id: strawberry.ID) -> Order | None:` (`strawberry.Info` in recent versions; older code imports `from strawberry.types import Info`).
2. Read the database and caller from `info.context`, never from a module global.
3. Mutations: `@strawberry.type class Mutation:` with `@strawberry.mutation` methods taking `input: CancelOrderInput` and returning the payload type.
4. Field resolvers that compute a value: `@strawberry.field def total(self) -> Money: ...` on the type.
5. Build `schema = strawberry.Schema(query=Query, mutation=Mutation, types=[Order])`. List concrete types in `types=` when they are only reachable through the `Node` interface, or they will be missing from the schema.
6. Use `async def` resolvers when the database driver is async; mixing sync blocking IO into async resolvers blocks the event loop.

### Output
Resolvers and `schema` object.

### Quality Gate
- `python -c "from app.schema import schema; print(schema.as_str()[:40])"` prints SDL text.

---

## Phase 3: Diff Against the Contract and Serve

### Entry Criteria
- Schema object builds.

### Actions
1. Export: `strawberry export-schema app.schema:schema --output strawberry.graphql` (older versions: redirect stdout `> strawberry.graphql`; check `strawberry export-schema --help`).
2. Diff: `npx @graphql-inspector/cli diff schema.graphql strawberry.graphql`. Every listed change is a mismatch between the contract and the code.
3. Fix the Python side, one type at a time, and re-export. Do NOT edit `schema.graphql` to match the code; the contract changes only through the schema flows.
4. When the diff prints `No changes detected`, create `app/main.py`:
```python
from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter
from app.schema import schema
async def get_context():
    return {"db": db}
app = FastAPI()
app.include_router(GraphQLRouter(schema, context_getter=get_context), prefix="/graphql")
```
5. Start: `uvicorn app.main:app --port 8000`. Smoke: `curl -s -X POST http://localhost:8000/graphql -H 'content-type: application/json' -d '{"query":"{ __typename }"}'`.

### Output
`resolver_code`, `server_entry`.

### Quality Gate
- Inspector diff prints `No changes detected`.
- Smoke curl prints `{"data": {"__typename": "Query"}}` (spacing may differ).

---

## Worked Example

Illustrative only.

Phase 3 first diff:
```
✖  Field 'Order.number' changed type from 'String!' to 'String'
✖  Field 'Order.placedAt' was removed
```
Causes: `number: str | None` should be `number: str`; the field was named `placed` in Python. Fix both, re-export, diff prints `No changes detected`. `uvicorn app.main:app --port 8000` then the curl prints `{"data":{"__typename":"Query"}}`.

---

## Exit Criteria

DONE when the exported Strawberry schema has zero differences from `schema.graphql`, and the FastAPI app answers a smoke query.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `TypeError` about unresolved forward references | **Adjust**: use `strawberry.lazy` or define types in dependency order; recheck the import. |
| Phase 2 | Type reachable only via `Node` missing from export | **Adjust**: add it to `types=[...]` on `strawberry.Schema`. |
| Phase 3 | `export-schema` command not found | **Adjust**: run `python -m strawberry export-schema ...` or print `schema.as_str()` to a file. |
| Phase 3 | Tempted to edit `schema.graphql` to match the code | **Stop**: the SDL is the contract; fix the Python. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
