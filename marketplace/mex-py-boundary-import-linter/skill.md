# Python Boundary Enforcement with import-linter

**One-line description:** Encodes the new module boundary as import-linter contracts (forbidden imports into the candidate's internals, independence between sibling modules) in `pyproject.toml` or `.importlinter`, runs `lint-imports` locally and in CI, and keeps any not-yet-fixed edges in an explicit, shrinking `ignore_imports` list.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Monolith working tree.
- `module_interface` (object, required): From `mex-interface-boundary-contract`; names the interface module that outsiders may import.

---

## Outputs

- `py_boundary_rules` (object): Config file and section, each contract's name and type, the `ignore_imports` entries with the reason for each, the `lint-imports` summary line, and the CI job name that runs it.

---

## Phase 1: Write the Contracts

### Entry Criteria
- `stack` is `python`.
- `module_interface` names a module such as `app.billing.api`.

### Actions
1. Install into the dev environment: `pip install import-linter`. Confirm: `lint-imports --help` prints usage.
2. Choose the config location: if `pyproject.toml` exists use a `[tool.importlinter]` table; otherwise create `.importlinter` with an `[importlinter]` section. Do not create both.
3. Write the root package and contracts. Example for `pyproject.toml` (contract key names are from the import-linter docs; confirm them against the docs for the installed version):
   ```toml
   [tool.importlinter]
   root_package = "app"

   [[tool.importlinter.contracts]]
   name = "Only billing.api is public"
   type = "forbidden"
   source_modules = ["app.orders", "app.admin", "app.catalog"]
   forbidden_modules = ["app.billing.models", "app.billing.services", "app.billing.store", "app.billing.tasks"]

   [[tool.importlinter.contracts]]
   name = "Billing does not import other domains"
   type = "forbidden"
   source_modules = ["app.billing"]
   forbidden_modules = ["app.orders", "app.admin", "app.catalog"]
   ```
4. List the candidate's internal subpackages with `ls app/billing` and put every one except the interface module in `forbidden_modules`. Do not use wildcards unless the installed version's docs list wildcard support.
5. If the project has an `independence` relationship between several domain packages, add an `independence` contract with `modules = [...]`; it fails if any listed package imports another.

### Output
Contracts in the config file.

### Quality Gate
- `lint-imports` runs and prints a `Contracts:` summary line (pass or fail is decided in Phase 2).

---

## Phase 2: Run, Then Pin Existing Violations

### Entry Criteria
- Contracts written.

### Actions
1. Run `lint-imports`. Each broken contract prints the import chains that break it, for example `app.orders.reports -> app.billing.models (l.12)`.
2. Rule: every broken chain is either fixed now (by routing the call through `app.billing.api`, one file per commit, tests run after each) or added to `ignore_imports` in that contract with a comment naming the ticket that will remove it:
   ```toml
   ignore_imports = [
       "app.orders.reports -> app.billing.models",  # TICKET-412 move to billing.api.list_invoices
   ]
   ```
3. Do not delete a contract, weaken `forbidden_modules`, or remove the CI job to get a green run. A contract that only passes because everything is ignored is reported as such.
4. Re-run `lint-imports` until it prints that all contracts are kept.

### Output
A passing `lint-imports` run with each remaining exception justified.

### Quality Gate
- `lint-imports` exit code is 0 and its summary line reads `0 broken`.
- Every `ignore_imports` entry has a comment with a ticket or owner.

---

## Phase 3: Wire into CI and Prove It Bites

### Entry Criteria
- Local run passes.

### Actions
1. Add a step to the existing CI workflow file next to the test step, for example in GitHub Actions: `- run: lint-imports`. Edit only that one workflow file.
2. Mutation check: add `from app.billing.models import Invoice` to one outside module on a scratch branch, run `lint-imports`, confirm it fails naming that line, then delete the branch.
3. Record the summary line and the CI job name in `py_boundary_rules`.

### Output
`py_boundary_rules`.

### Quality Gate
- The mutation run exited non-zero and printed the added import.
- The CI workflow file contains `lint-imports`: `rg -n "lint-imports" .github/workflows` (or the repo's CI path) returns a line.

---

## Worked Example

Illustrative.

```
$ lint-imports
=============
Import Linter
=============
---------
Contracts
---------
Analyzed 418 files, 2210 dependencies.
Only billing.api is public BROKEN
Billing does not import other domains KEPT
Contracts: 1 kept, 1 broken.
...
app.admin.reports -> app.billing.models (l.9)
app.orders.checkout -> app.billing.store (l.4)
```
`app.orders.checkout` fixed in one commit (route to `billing.api.create_invoice`). `app.admin.reports` added to `ignore_imports` with `# TICKET-412`. Re-run: `Contracts: 2 kept, 0 broken.`

---

## Exit Criteria

DONE when `lint-imports` passes locally and in CI, a deliberate violation fails it, and every ignored import has a ticket.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `root_package` not importable | **Adjust**: set `PYTHONPATH` (for example `src`) in the CI step and locally; check the docs for multiple `root_packages` if the code spans several roots. |
| Phase 1 | Unknown config key error | **Stop**: open the import-linter docs for the installed version (`pip show import-linter`) and use its key names; do not guess. |
| Phase 2 | Hundreds of broken chains | **Adjust**: pin them all in `ignore_imports` with one ticket, merge, then remove entries over time; the contract still blocks new violations. |
| Phase 3 | CI uses a different Python environment where `lint-imports` is missing | **Adjust**: add `import-linter` to the dev requirements file the CI installs. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
