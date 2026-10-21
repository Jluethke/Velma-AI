# JSON Schema Request Contracts With Ajv or python-jsonschema

**One-line description:** Writes closed JSON Schema (draft 2020-12) contracts for message and request payloads that cross a language boundary, enforces them at runtime with Ajv in Node.js or `jsonschema` in Python with format checking turned on, and checks the schemas themselves and sample payloads in CI with `check-jsonschema`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `node` (Ajv) or `python` (`jsonschema`).
- `entry_point_inventory` (object[], required): Output of `ival-entry-point-inventory`. This flow targets rows whose payload is shared with another service (webhooks, queue messages, public API bodies documented in OpenAPI).

---

## Outputs

- `jsonschema_changes` (object): `schemas` (paths under `schemas/`), `validator_module`, `samples` (valid and invalid payload files), `ci_command`, and `test_run`.

---

## Phase 1: Write Closed Schemas

### Entry Criteria
- At least one inventory row carries a cross-service payload.

### Actions
1. Create one file per payload: `schemas/<name>.schema.json`. Template:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.invalid/schemas/order-created.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["order_id", "amount_cents", "currency"],
  "properties": {
    "order_id": { "type": "string", "format": "uuid" },
    "amount_cents": { "type": "integer", "minimum": 0 },
    "currency": { "enum": ["USD", "EUR"] },
    "callback_url": { "type": "string", "format": "uri", "maxLength": 2048 }
  }
}
```

2. Closing rules (each is a known way schemas fail open):

| Situation | Keyword |
|---|---|
| Plain object | `"additionalProperties": false` |
| Object built with `allOf`, `$ref` or `if/then` | `"unevaluatedProperties": false` at the top level, because `additionalProperties` cannot see properties declared inside subschemas |
| Array | `"items"` with a schema, plus `"maxItems"` from `field_rules` or the consumer's documented limit |
| String | `"maxLength"` from a cited source; otherwise list it as an open question |
| Numeric field that must be whole | `"type": "integer"`, not `"number"` |

3. Bounds come from the consumer's documented limits, the database column, or a named standard. Do NOT write a number with no source; the `maxLength` 2048 above is only valid if your source says so.
4. `format` (`uuid`, `uri`, `email`, `date-time`) is an annotation only in draft 2020-12 unless the validator enables format assertion. Phase 2 turns it on.

### Output
Schema files.

### Quality Gate
- `pipx run check-jsonschema --check-metaschema schemas/*.schema.json` (or `check-jsonschema --check-metaschema ...` if installed) exits 0.
- `rg -c "additionalProperties\": false|unevaluatedProperties\": false" schemas` reports a count for every schema file.

---

## Phase 2: Enforce at Runtime

### Entry Criteria
- Schemas pass the metaschema check.

### Actions
1. Node (Ajv 8):

```bash
npm install ajv ajv-formats
```
```ts
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import orderCreated from "../schemas/order-created.schema.json";

const ajv = new Ajv2020({ strict: true, allErrors: false });
addFormats(ajv);
export const validateOrderCreated = ajv.compile(orderCreated);
// usage: if (!validateOrderCreated(payload)) reject(validateOrderCreated.errors)
```
   - Import from `ajv/dist/2020`. The default `ajv` export targets draft-07 and rejects `$schema` 2020-12.
   - Keep `allErrors: false` on untrusted input. Ajv's security documentation warns that `allErrors: true` lets a crafted payload make validation do much more work.
   - Compile once at startup, not per request.
   - Without `addFormats`, Ajv in strict mode throws on unknown formats at compile time; that error is expected and is the reason to add it.
2. Python:

```bash
pip install "jsonschema[format]"
```
```python
import json
from jsonschema import Draft202012Validator

SCHEMA = json.load(open("schemas/order-created.schema.json"))
Draft202012Validator.check_schema(SCHEMA)
VALIDATOR = Draft202012Validator(SCHEMA, format_checker=Draft202012Validator.FORMAT_CHECKER)

def validate_order_created(payload: dict) -> list[str]:
    return [f"{'/'.join(map(str, e.absolute_path))}: {e.validator}" for e in VALIDATOR.iter_errors(payload)]
```
   - Without `format_checker=...`, `"format": "uuid"` checks nothing.
   - The `[format]` extra installs the optional libraries some formats need; formats whose library is missing are skipped silently. List what is checked with `print(Draft202012Validator.FORMAT_CHECKER.checkers.keys())`.
   - The error message string contains the rejected value; return the path and validator keyword only.
3. Call the validator at the entry point before any other code reads the payload. On failure: HTTP 400 for requests; dead-letter (no retry) for queue messages.

### Output
`validator_module` wired at each targeted entry point.

### Quality Gate
- A process restart compiles every schema without error (Node: app start log; Python: import of the validator module succeeds).
- `rg -n "allErrors:\s*true" src` prints nothing.

---

## Phase 3: Sample Payload Tests and CI Check

### Entry Criteria
- Validators wired.

### Actions
1. For each schema create `schemas/samples/<name>.valid.json` and `schemas/samples/<name>.invalid-<reason>.json` for: extra key, missing required key, wrong type, bad format, out-of-range number.
2. Check samples on the command line:
   `check-jsonschema --schemafile schemas/order-created.schema.json schemas/samples/order-created.valid.json` must print `ok -- validation done`; each invalid sample must exit non-zero.
3. Write a unit test that loads every sample and asserts valid files pass and invalid files fail through the runtime validator from Phase 2, so the runtime and the CLI agree.
4. Add the Phase 1 metaschema check and the step 2 valid-sample check to CI.

### Output
`jsonschema_changes`.

### Quality Gate
- Unit test summary shows 0 failed, with one case per sample file.
- Every `invalid-*` sample exits non-zero under `check-jsonschema`.

---

## Worked Example

Illustrative. `stack` = `node`. Webhook `POST /hooks/order-created` (EP-007) is consumed by a Python billing service too, so a shared JSON Schema is the contract.

Phase 1: `schemas/order-created.schema.json` as in the template, `maxLength` for `callback_url` taken from the billing team's API doc.

Phase 3:
```
$ check-jsonschema --schemafile schemas/order-created.schema.json schemas/samples/order-created.invalid-extra-key.json
Schema validation errors were encountered.
  schemas/samples/order-created.invalid-extra-key.json::$: Additional properties are not allowed ('is_test' was unexpected)
$ echo $?
1
```

---

## Exit Criteria

DONE when every cross-service payload has a closed draft 2020-12 schema, runtime validation enforces formats, and valid and invalid samples behave as labeled in both CLI and unit tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Existing OpenAPI 3.0 document holds the schemas | **Adjust**: OpenAPI 3.0 uses a JSON Schema subset (draft-04 style, `nullable`); keep 3.0 schemas in the 3.0 dialect or migrate the document to OpenAPI 3.1, which uses draft 2020-12. Do not mix dialects in one file. |
| Phase 2 | Ajv throws `strict mode: unknown keyword` | **Adjust**: fix the schema typo; do not set `strict: false`. |
| Phase 2 | Producers send keys not in the schema | **Return**: list the keys to the owner; do not remove `additionalProperties: false`. |
| Phase 3 | An invalid sample passes | **Stop**: the schema is open somewhere; check composition keywords for missing `unevaluatedProperties`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
