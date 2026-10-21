# SDK Python openapi-generator Client

**One-line description:** Generates a Python client package with openapi-generator's `python` generator from a pinned version and a checked-in config file, protects handwritten files with `.openapi-generator-ignore`, and proves the package imports, type-checks and round-trips one model.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `validated_spec` (string, required): Path to the spec that passed lint and readiness.
- `generation_plan` (object, required): Output of `sdk-generator-decision`; `approach` must be `generated` or `hybrid` with generator `python`.
- `type_mapping` (object, required): Output of `sdk-model-type-mapping`.
- `project_dir` (string, required): SDK repository root.

---

## Outputs

- `py_client_package` (object): Package name, generated directory, generator version, config path, list of generated files (from `.openapi-generator/FILES`), and the results of the import, mypy and round-trip checks.

---

## Phase 1: Pin and Configure

### Entry Criteria
- `generation_plan.approach` is `generated` or `hybrid`.
- Java 11 or later is installed (`java -version`); the npm wrapper downloads and runs the Java JAR.

### Actions
1. In `project_dir`, install the wrapper: `npm install --save-dev @openapitools/openapi-generator-cli`.
2. Pin the generator: `npx openapi-generator-cli version-manager set <version from generation_plan>`. This writes `openapitools.json`. Commit it.
3. List the generator's real options: `npx openapi-generator-cli config-help -g python`. Only use option names printed by this command.
4. Create `codegen/python.yaml`:
   ```yaml
   generatorName: python
   inputSpec: api/openapi.yaml
   outputDir: .
   additionalProperties:
     packageName: acme_client
     projectName: acme-client
     packageVersion: 0.1.0
   ```
   Replace names and paths with the real ones. Add `library` only if `config-help` lists it and the plan names it.
5. Create `.openapi-generator-ignore` in `outputDir` listing every file you will write by hand, one glob per line, for example `acme_client/_retry.py`, `acme_client/_errors.py`, `README.md`, `tests/**`. Generation overwrites any unlisted file.

### Output
Pinned `openapitools.json`, `codegen/python.yaml`, `.openapi-generator-ignore`.

### Quality Gate
- `openapitools.json` contains an exact version string (no `latest`).
- Every option key in `codegen/python.yaml` appears in `config-help -g python` output.

---

## Phase 2: Generate

### Entry Criteria
- Config files exist.

### Actions
1. Run: `npx openapi-generator-cli generate -c codegen/python.yaml`. Do NOT add `--skip-validate-spec`; a validation failure means the spec must be fixed upstream in the chain.
2. Read the console. Record every line starting with `[main] WARN`. Typical warnings name schemas generated as inline objects or unsupported features.
3. Read `.openapi-generator/FILES` for the exact list of generated files. Record it in `py_client_package`.
4. Confirm the ignore file worked: `git status --porcelain` must show no changes to files listed in `.openapi-generator-ignore`.

### Output
Generated package.

### Quality Gate
- `generate` exits 0.
- `.openapi-generator/FILES` exists and lists `acme_client/api_client.py` (or the package's equivalent).
- No handwritten file appears modified in `git status --porcelain`.

---

## Phase 3: Prove It Works

### Entry Criteria
- Package generated.

### Actions
1. Create a virtual environment and install: `python -m venv .venv`, activate it, `pip install -e .`.
2. Import check: `python -c "import acme_client; print(acme_client.__version__)"`.
3. Type check the generated package: `pip install mypy` then `mypy acme_client`. Record the error count. Do NOT add `# type: ignore` to generated files; they are overwritten on the next run.
4. Round-trip one model that has a `date-time` field and an optional field:
   ```python
   from acme_client.models.user import User
   raw = '{"id": "u_1", "email": "a@example.com", "created_at": "2026-01-02T03:04:05Z"}'
   u = User.from_json(raw)
   assert u.created_at.tzinfo is not None
   assert User.from_json(u.to_json()) == u
   ```
   Generated pydantic models expose `from_json`, `to_json`, `from_dict` and `to_dict`; confirm the names exist in the generated model file before calling them.
5. Compare against `type_mapping`: open one model per hazard (int64, nullable, enum) and record whether the generated type matches.
6. Check unknown enum handling: call `from_dict` with an enum value not in the spec. If it raises a validation error, record a forward-compatibility defect for the hybrid layer to handle.

### Output
`py_client_package`.

### Quality Gate
- The import command prints the package version.
- The round-trip script exits 0.
- The mypy error count and the unknown-enum result are recorded.

---

## Worked Example

Illustrative only. Package `acme_client`, generator 7.x.

```
$ npx openapi-generator-cli generate -c codegen/python.yaml
[main] WARN  o.o.codegen.DefaultCodegen - Generation using 3.1.0 specs is in development and is not officially supported yet.
[main] INFO  o.o.codegen.TemplateManager - writing file ./acme_client/models/user.py
...
$ python -c "import acme_client; print(acme_client.__version__)"
0.1.0
$ python roundtrip.py && echo ROUNDTRIP_OK
ROUNDTRIP_OK
$ python -c "from acme_client.models.user import User; User.from_dict({'id':'u','email':'a@b.c','created_at':'2026-01-01T00:00:00Z','status':'archived'})"
pydantic_core._pydantic_core.ValidationError: 1 validation error for User
status
  Value error, must be one of enum values ('active', 'disabled')
```
The 3.1 warning and the closed-enum failure are recorded in `py_client_package`.

---

## Exit Criteria

DONE when the package generates from a pinned version, handwritten files are untouched, and import, round-trip and type checks have recorded results.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Java missing | **Stop**: install a JDK 11 or later, or use the official Docker image `openapitools/openapi-generator-cli` with the same pinned tag. |
| Phase 2 | Spec validation fails | **Return**: send back to `sdk-spec-spectral-lint` with the generator's message. |
| Phase 2 | A handwritten file was overwritten | **Adjust**: restore it with `git checkout -- <file>`, add it to `.openapi-generator-ignore`, regenerate. |
| Phase 3 | Round-trip fails on date-time | **Adjust**: record the generated type and add a mapping override in the hybrid layer; do not edit generated files. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
