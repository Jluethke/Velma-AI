# SDK Endpoint Coverage Audit

**One-line description:** Diffs the spec's operationIds against the SDK's public methods with a reproducible script per stack, reports missing, extra and renamed endpoints, and fails until every exposed operation has exactly one method.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `api_inventory` (object, required): Output of `sdk-spec-inventory`; `operations` is the source list.
- `stack` (string, required): `python`, `typescript` or `go`.
- `project_dir` (string, required): SDK repository root after generation or handwritten mapping.

---

## Outputs

- `coverage_report` (object): `expected` count, `found` count, `missing` (operationIds with no method), `extra` (methods with no operation), `excluded` (operations deliberately not exposed, each with a reason), and the commands used.

---

## Phase 1: Build the Expected List

### Entry Criteria
- `build/openapi.json` from the inventory exists.

### Actions
1. Write the expected list:
   ```bash
   jq -r '.paths[] | to_entries[] | select(.key | IN("get","put","post","delete","patch","head","options","trace")) | .value.operationId' build/openapi.json | sort -u > build/expected-ops.txt
   wc -l build/expected-ops.txt
   ```
2. Remove deliberately excluded operations (for example internal or deprecated ones the user chose to skip) into `build/excluded-ops.txt`, each with a reason line. Excluding needs a reason; "hard to implement" is not one.
3. Convert names to the SDK naming rule so the lists compare: python snake_case, go PascalCase, typescript unchanged. Example for python:
   `sed -E 's/([a-z0-9])([A-Z])/\1_\2/g' build/expected-ops.txt | tr 'A-Z' 'a-z' > build/expected-py.txt`

### Output
Expected list in SDK naming.

### Quality Gate
- `build/expected-ops.txt` line count equals `api_inventory.operation_count` minus excluded count, or the difference is explained.

---

## Phase 2: Extract the SDK Surface

### Entry Criteria
- Expected list exists.

### Actions
1. Extract public method names per stack and approach:

| Stack and approach | Command |
|---|---|
| python, openapi-generator | `grep -rhoE "^    def [a-z_0-9]+\(" acme_client/api/ \| sed -E 's/    def ([a-z_0-9]+)\(/\1/' \| grep -vE "_with_http_info$\|_without_preload_content$\|^_" \| sort -u` |
| python, handwritten | `python -c "import inspect, acme_client.resources as r; [print(n) for _, m in inspect.getmembers(r, inspect.ismodule) for c in vars(m).values() if inspect.isclass(c) for n, _ in inspect.getmembers(c, inspect.isfunction) if not n.startswith('_')]" \| sort -u` |
| typescript, openapi-fetch | Coverage is by path, not method: `grep -oE '^    "/[^"]+"' src/generated/schema.d.ts \| sort -u` compared against spec paths; every spec path is present by construction, so audit the facade only |
| typescript, handwritten | `grep -rhoE "^\s+(async )?[a-z][A-Za-z0-9]*\(" src/resources/ \| sed -E 's/^\s+(async )?([A-Za-z0-9]+)\(/\2/' \| sort -u` |
| go, oapi-codegen | `go doc -all ./acme \| grep -oE "^func \(c \*ClientWithResponses\) [A-Z][A-Za-z0-9]*WithResponse\(" \| sed -E 's/.* ([A-Za-z0-9]+)WithResponse\(/\1/' \| sort -u` |
| go, handwritten | `go doc -all ./acme \| grep -oE "^func \(s \*[A-Za-z]+Service\) [A-Z][A-Za-z0-9]*" \| awk '{print $NF}' \| sort -u` |

2. Save output to `build/found.txt`.
3. These regular expressions are starting points. Open `build/found.txt` and confirm it contains known method names; if it is empty or contains private helpers, fix the expression before comparing. Do NOT report 100 percent coverage from an empty file.
4. For openapi-generator python, the `*_with_http_info` and `*_without_preload_content` variants are expected duplicates and are filtered out by the command above.

### Output
`build/found.txt`.

### Quality Gate
- `build/found.txt` has at least one line, and a spot check of three expected names finds each (`grep -x list_users build/found.txt`).

---

## Phase 3: Compare and Gate

### Entry Criteria
- Both lists exist.

### Actions
1. Compare: `comm -23 build/expected-<stack>.txt build/found.txt > build/missing.txt` and `comm -13 build/expected-<stack>.txt build/found.txt > build/extra.txt`. For handwritten resource methods (`users.list`), map each row of `endpoint_map` back to its operationId first and compare operationIds instead.
2. Classify each `extra` entry: a documented facade (allowed, listed in `endpoint_map`), a renamed operation (pair it with its `missing` entry), or a method with no spec operation (defect).
3. Fill `coverage_report`.
4. Gate rule: if `missing` minus renamed pairs is non-empty, the audit fails. Return the missing list to the generation or mapping flow.

### Output
`coverage_report`.

### Quality Gate
- `build/missing.txt` is empty after renamed pairs are resolved (`test ! -s build/missing.txt`).
- Every `extra` entry is classified.

---

## Worked Example

Illustrative only. `stack = go`, oapi-codegen.

```
$ wc -l < build/expected-ops.txt
42
$ go doc -all ./acme | grep -oE "^func \(c \*ClientWithResponses\) [A-Z][A-Za-z0-9]*WithResponse\(" | sed ... | sort -u > build/found.txt
$ wc -l < build/found.txt
43
$ comm -23 build/expected-go.txt build/found.txt
$ comm -13 build/expected-go.txt build/found.txt
CreateUploadWithBody
```
`CreateUploadWithBody` is the oapi-codegen variant for a raw body alongside `CreateUpload`; classified as a generator variant. `coverage_report = { expected: 42, found: 42, missing: [], extra: ["CreateUploadWithBody (generator variant)"] }`.

---

## Exit Criteria

DONE when every non-excluded operation maps to exactly one SDK method, every extra method is classified, and the commands are recorded so CI can rerun them.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Count differs from inventory | **Adjust**: rerun the inventory jq query; operations without operationId produce `null` lines; return those to readiness rules. |
| Phase 2 | Extraction prints nothing | **Adjust**: print the first 40 lines of a generated API file and rewrite the expression against the real layout. |
| Phase 3 | Missing operations remain | **Return**: send `build/missing.txt` to `sdk-handwritten-endpoint-map` or the generator flow. |
| Phase 3 | Extra method with no spec operation | **Stop**: remove it or document it as a facade; the SDK must not call undocumented endpoints. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
