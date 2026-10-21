# Breaking Change Check With GraphQL Inspector Diff

**One-line description:** Compares the proposed schema with the schema on the base branch using `graphql-inspector diff`, classifies every change as BREAKING, DANGEROUS or NON_BREAKING, checks breaking changes against real client operations, and gates the pull request in CI.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `validated_schema` (string, required): Path to the proposed `schema.graphql` (or the exported schema for code-first stacks).
- `project_dir` (string, required): Repository root (a git working tree).
- `base_ref` (string, required): Git ref of the deployed schema, for example `origin/main`.

---

## Outputs

- `schema_change_report` (object[]): Every change with its criticality and message.
- `breaking_changes` (object[]): The BREAKING and DANGEROUS changes, each with the client operations that use the affected coordinate.

---

## Phase 1: Produce Both Schemas

### Entry Criteria
- `git fetch` has been run so `base_ref` is current.

### Actions
1. Schema-first stacks (Apollo, Yoga, gqlgen): the proposed file is `validated_schema`; the base is the same path at `base_ref`.
2. Code-first Strawberry: export both. Current: `strawberry export-schema app.schema:schema --output schema.new.graphql`. Base: `git worktree add /tmp/base base_ref` then export inside it to `schema.base.graphql`. Remove the worktree afterward with `git worktree remove /tmp/base`.
3. Confirm both build with graphql-js `buildSchema`.

### Output
Base and proposed schema files.

### Quality Gate
- Both files build without error.

---

## Phase 2: Diff and Classify

### Entry Criteria
- Both schemas exist.

### Actions
1. Run: `npx @graphql-inspector/cli diff "git:origin/main:schema.graphql" schema.graphql` (the `git:<ref>:<path>` pointer reads the file from git; replace `origin/main` with `base_ref`). For exported files: `npx @graphql-inspector/cli diff schema.base.graphql schema.new.graphql`.
2. Read the output: each line starts with a marker for criticality (`✖` breaking, `⚠` dangerous, `✔` safe) and a message such as `Field 'Order.number' was removed`. The command exits non-zero when any breaking change exists.
3. Record every line in `schema_change_report`.
4. Know the common classifications:

| Change | Class |
|---|---|
| Remove a field, type, enum value or argument | BREAKING |
| Output field nullable to non-null | NON_BREAKING |
| Output field non-null to nullable | BREAKING |
| Add a required argument or required input field | BREAKING |
| Add an optional argument with no default change | NON_BREAKING |
| Add an enum value | DANGEROUS (clients with exhaustive switches break) |
| Add a type to a union or interface implementations | DANGEROUS |
| Change a default value | DANGEROUS |

### Output
`schema_change_report`.

### Quality Gate
- Every inspector output line is in the report with a class.

---

## Phase 3: Check Usage and Gate

### Entry Criteria
- Report complete.

### Actions
1. For each BREAKING or DANGEROUS change, search real client operations for the coordinate: `grep -rln "number" operations/` then confirm the field sits on the affected type by reading the file. Prefer validating directly: `npx @graphql-inspector/cli validate "operations/**/*.graphql" schema.graphql` lists every operation the new schema breaks.
2. If you have usage data (persisted manifest, field-usage metrics from tracing, or Apollo GraphOS), list the client names and versions that sent the coordinate in the retention window the team uses.
3. Decision:

| Situation | Action |
|---|---|
| Breaking change used by any live operation | Block; replace with additive change plus deprecation (`gql-field-deprecation-rollout`) |
| Breaking change, no usage evidence at all, and no usage data source exists | Block; usage is unknown, not zero |
| Breaking change, usage data covers all clients and shows zero use | Allow with a reviewer sign-off recorded in the PR |
| Dangerous only | Allow; notify client owners of new enum values or union members |

4. Add the CI step: `npx @graphql-inspector/cli diff "git:origin/main:schema.graphql" schema.graphql` on pull requests; its non-zero exit fails the build. Overrides go through the recorded sign-off, not by deleting the step.

### Output
`schema_change_report`, `breaking_changes`.

### Quality Gate
- Every breaking change has a usage verdict and an action from the table.
- The CI config contains the diff command (grep the workflow file).

---

## Worked Example

Illustrative only.

```
$ npx @graphql-inspector/cli diff "git:origin/main:schema.graphql" schema.graphql
Detected the following changes (3) between schemas:
✖  Field 'Order.number' was removed
⚠  Enum value 'REFUNDED' was added to enum 'OrderStatus'
✔  Field 'Order.displayNumber' was added
error Detected 1 breaking change
$ echo $?
1
```
Usage: `operations/CustomerOrders.graphql` selects `Order.number`. Action: restore `number` with `@deprecated(reason: "Use displayNumber.")`; rerun shows only dangerous and safe changes; exit 0.

---

## Exit Criteria

DONE when every change is classified, every breaking change is blocked or signed off on usage evidence, and the diff runs in CI.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `git:` pointer fails (shallow clone) | **Adjust**: `git fetch --unshallow` or `git show origin/main:schema.graphql > schema.base.graphql` and diff files. |
| Phase 2 | Inspector reports changes in unrelated order only | **Adjust**: ordering is not a change; if the tool reports none, nothing to do. |
| Phase 3 | Pressure to merge a breaking change with unknown usage | **Stop**: unknown usage blocks; add deprecation first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
