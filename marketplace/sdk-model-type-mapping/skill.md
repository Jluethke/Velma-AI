# SDK Model Type Mapping

**One-line description:** Produces the exact OpenAPI-schema-to-language type table for Python, TypeScript or Go (formats, nullable versus optional, int64 precision, dates, enums, oneOf with discriminator, additionalProperties) and the field and method naming rules, so generated and handwritten code map models the same way.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `api_inventory` (object, required): Output of `sdk-spec-inventory`.
- `validated_spec` (string, required): Path to the validated spec; `build/openapi.json` from the inventory is used for queries.
- `stack` (string, required): `python`, `typescript` or `go`.

---

## Outputs

- `type_mapping` (object): For each schema construct found in the spec: the target type, the generator option that produces it, and any construct that needs a manual override. Also the naming rules for fields, models and methods.

---

## Phase 1: Find the Constructs in Use

### Entry Criteria
- `build/openapi.json` exists.

### Actions
1. Count each construct:
   ```bash
   jq '[.. | objects | select(.type? == "integer" and .format? == "int64")] | length' build/openapi.json
   jq '[.. | objects | select(.format? == "date-time")] | length' build/openapi.json
   jq '[.. | objects | select(.format? == "date")] | length' build/openapi.json
   jq '[.. | objects | select(.nullable? == true)] | length' build/openapi.json
   jq '[.. | objects | select((.type? | type) == "array")] | length' build/openapi.json
   jq '[.. | objects | select(has("oneOf") or has("anyOf"))] | length' build/openapi.json
   jq '[.. | objects | select(has("discriminator"))] | length' build/openapi.json
   jq '[.. | objects | select(has("enum"))] | length' build/openapi.json
   jq '[.. | objects | select(.additionalProperties? and .additionalProperties != false)] | length' build/openapi.json
   ```
   The `(.type | type) == "array"` query finds OpenAPI 3.1 type arrays such as `["string","null"]`.
2. Record each count. Constructs with count 0 are left out of the table.

### Output
Construct counts.

### Quality Gate
- Every command above ran and its count is recorded.

---

## Phase 2: Build the Type Table

### Entry Criteria
- Construct counts exist.

### Actions
1. Copy the rows for constructs in use from this reference table into `type_mapping`:

| OpenAPI | Python (pydantic v2) | TypeScript (openapi-typescript) | Go (oapi-codegen) |
|---|---|---|---|
| `integer` / `int32` | `int` | `number` | `int32` |
| `integer` / `int64` | `int` (arbitrary precision) | `number`; values above `Number.MAX_SAFE_INTEGER` (2^53 - 1) lose precision | `int64` |
| `number` / `double` | `float` | `number` | `float64` (`float32` for `format: float`) |
| `string` / `date-time` (RFC 3339) | `datetime.datetime` | `string` (no Date conversion) | `time.Time` |
| `string` / `date` | `datetime.date` | `string` | `openapi_types.Date` |
| `string` / `uuid` | `uuid.UUID` or `str` (check generator output) | `string` | `openapi_types.UUID` |
| `string` / `binary` | `bytes` | `Blob` or `string` (check `--help` options) | `[]byte` or `openapi_types.File` for multipart |
| `enum` of strings | `Enum` subclass or `Literal[...]` | union of string literals; real `enum` only with `--enum` | named string type with constants |
| property not in `required` | `Optional[T] = None` | `prop?: T` | pointer `*T` with `json:",omitempty"` |
| `nullable: true` (3.0) or `type: [T, "null"]` (3.1) | `Optional[T]` | `T \| null` | `*T`, or `nullable.Nullable[T]` when the `nullable-type` output option is on |
| `oneOf` + `discriminator` | `Annotated[Union[A, B], Field(discriminator="kind")]` | `A \| B` union | union struct with `AsA()` / `FromA()` style methods |
| `additionalProperties: {schema}` | `dict[str, T]` | `Record<string, T>` | `map[string]T` |
| `additionalProperties: true` or free-form object | `dict[str, Any]` | `Record<string, unknown>` | `map[string]interface{}` |

2. Mark these known hazards in `type_mapping` when the construct is present:
   - int64 in TypeScript: if any int64 field is an ID or money amount, record that the API must send it as a string, or the SDK must parse JSON with a bigint-aware parser. Do NOT silently keep `number`.
   - Optional versus nullable on PATCH bodies: a field can be absent (do not change), `null` (clear), or a value. Python needs `model_dump(exclude_unset=True)`; Go needs `nullable.Nullable[T]` or a custom type; TypeScript uses `prop?: T | null`. Record which PATCH operations need this.
   - Enums and forward compatibility: a closed enum makes the SDK reject a value the server adds later. Record whether the SDK keeps an open fallback (Python `str` plus constants, Go named string type, TypeScript `(string & {})` in a union).
3. Do NOT use `float` or `number` for money if the spec uses `string` with a decimal format; map to `decimal.Decimal` (Python), `string` (TypeScript), `string` or a decimal library type (Go).

### Output
Type table with hazards.

### Quality Gate
- Every construct with a non-zero count has a row.
- Every hazard in Action 2 is either marked not present or has a stated resolution.

---

## Phase 3: Naming Rules

### Entry Criteria
- Type table exists.

### Actions
1. Fill the naming rules for the stack:

| Item | Python | TypeScript | Go |
|---|---|---|---|
| Method from operationId `listUsers` | `list_users` | `listUsers` | `ListUsers` |
| Resource grouping | `client.users.list()` by tag | `client.users.list()` or path-keyed `client.GET("/v1/users")` (openapi-fetch) | `client.ListUsers(ctx, params)` |
| Field `created_at` on the wire | `created_at` | `created_at` (openapi-typescript keeps wire names) | `CreatedAt` with tag `json:"created_at"` |
| Field `userId` on the wire | `user_id` with `Field(alias="userId")` and `populate_by_name=True` | `userId` | `UserId` (oapi-codegen default; the Go-style acronym form `UserID` only when the matching output option is enabled; check the oapi-codegen config schema) |
| Reserved words (`from`, `type`, `class`) | `from_` with alias `from` | unchanged (valid property names) | `From` |

2. Record reserved-word collisions found: `jq -r '.. | objects | .properties? // empty | keys[]' build/openapi.json | sort -u | grep -xE "from|class|type|import|def|global|lambda|async|await|default|func|interface|range|package|map|chan"`.

### Output
`type_mapping`.

### Quality Gate
- The reserved-word command was run and every hit has a mapped name.
- The method naming rule for the stack is written with one example.

---

## Worked Example

Illustrative only. `stack = typescript`.

```
$ jq '[.. | objects | select(.type? == "integer" and .format? == "int64")] | length' build/openapi.json
4
$ jq -r '.. | objects | select(.type? == "integer" and .format? == "int64") | .description? // "no description"' build/openapi.json
Account balance in minor units
...
```
Phase 2 records: int64 `balance_minor` can exceed 2^53 - 1 in theory; resolution: ask the API owner whether values can exceed `Number.MAX_SAFE_INTEGER`; until answered, the SDK documents the limit. `PATCH /v1/users/{id}` needs tri-state fields. Phase 3: reserved-word hit `type` is a valid TypeScript property; no rename.

---

## Exit Criteria

DONE when `type_mapping` covers every construct in the spec, every hazard has a resolution, and naming rules are fixed for the stack.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | jq query errors on a construct | **Adjust**: run the query on `.components.schemas` only and record the narrower scope. |
| Phase 2 | Generator maps a construct differently than the table | **Adjust**: the generator output wins for generated code; record the difference and the option that changes it, if any. |
| Phase 2 | int64 IDs in TypeScript with no owner answer | **Return**: list it as an open question; do not pick a representation silently. |
| Phase 3 | Two wire names map to the same SDK name | **Stop**: record the collision; rename via an explicit alias in the mapping. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
