# Field Deprecation and Removal Rollout

**One-line description:** Replaces a breaking change with an additive field plus `@deprecated(reason:)`, tracks usage of the deprecated coordinate through the persisted manifest and resolver telemetry, and removes it only after usage reaches zero across all supported clients.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `breaking_changes` (object[], required): Blocked changes from `gql-schema-breaking-diff`.
- `persisted_manifest` (string, optional): Manifest(s) of supported client versions, used for static usage checks.
- `project_dir` (string, required): Server root.

---

## Outputs

- `deprecation_plan` (object[]): Per coordinate: replacement, deprecation date, usage evidence source, removal condition, status.
- `deprecated_schema` (string): Path to the schema with additive replacements and deprecations applied.

---

## Phase 1: Add the Replacement and Deprecate

### Entry Criteria
- Each `breaking_changes` row is a removal, rename, or nullability tightening of an input or loosening of an output.

### Actions
1. Map each change to an additive form:

| Wanted change | Additive form |
|---|---|
| Rename field `a` to `b` | add `b`, keep `a` resolving the same value, deprecate `a` |
| Change field type | add a new field with the new type, deprecate the old |
| Make argument required | add a new field with the required argument, deprecate the old field |
| Remove an enum value | keep it, deprecate the enum value, stop producing it in outputs only after clients handle its absence |

2. Write the deprecation with a reason naming the replacement: `number: String! @deprecated(reason: "Use displayNumber.")`. The GraphQL spec allows `@deprecated` on field definitions and enum values, and current spec drafts and graphql-js 16 also allow it on arguments and input fields; deprecated arguments and input fields must be optional (nullable or with a default).
3. If the team uses `@graphql-eslint` `require-deprecation-date`, add the date argument the rule expects (`@deprecated(reason: "...")` plus a date in the format the rule documents).
4. For code-first Strawberry: `number: str = strawberry.field(deprecation_reason="Use displayNumber.")`. For gqlgen and SDL stacks the directive goes in the `.graphql` file.
5. Rerun `gql-schema-breaking-diff`: the diff must now show only additions and `Field 'Order.number' is deprecated` lines, with exit 0.

### Output
`deprecated_schema`.

### Quality Gate
- `npx @graphql-inspector/cli diff "git:origin/main:schema.graphql" schema.graphql; echo $?` ends with `0`.
- Every deprecated coordinate has a `reason` naming its replacement (graphql-eslint `require-deprecation-reason` passes).

---

## Phase 2: Measure Usage

### Entry Criteria
- Deprecation deployed.

### Actions
1. Static usage: for every persisted manifest still supported, write the documents to files and run `npx @graphql-inspector/cli validate "<dir>/*.graphql" schema.graphql` with the option that reports deprecated usage (check `npx @graphql-inspector/cli validate --help` for the deprecated-usage flag in your version). Each hit names the operation using the deprecated field.
2. Runtime usage: count resolver calls for the deprecated coordinate with client name and version from request headers (for example `apollographql-client-name` / `apollographql-client-version`, or your own). Emit a metric or log line in the resolver: `deprecated_field_used{coordinate="Order.number",client="ios",version="5.2"}`.
3. Record the evidence source per coordinate in `deprecation_plan`.

### Output
Usage evidence per coordinate.

### Quality Gate
- Every deprecated coordinate has at least one evidence source recorded (manifest check or runtime metric).

---

## Phase 3: Remove When Unused

### Entry Criteria
- Usage evidence collected over the retention window the team defines (user input; record it).

### Actions
1. Removal condition: static check reports zero operations using the coordinate across all supported manifests AND runtime metric shows zero calls over the window. Both, not either.
2. If usage remains, notify the client owners listed by version and keep the field. Update `status` to `waiting` with the remaining clients.
3. When the condition holds, remove the field and its resolver in one pull request, run `gql-schema-breaking-diff`, and record the evidence links in the PR as the sign-off the diff gate requires.
4. Run the full server test suite; delete only tests that exercised the removed field, and list each deleted test in the PR.

### Output
`deprecation_plan`, `deprecated_schema`.

### Quality Gate
- Every removed coordinate has zero static hits and zero runtime calls recorded.
- The test suite exits 0 and the PR lists any deleted test by name.

---

## Worked Example

Illustrative only.

Phase 1 schema:
```graphql
type Order implements Node {
  id: ID!
  displayNumber: String!
  number: String! @deprecated(reason: "Use displayNumber.")
}
```
Diff exit 0. Phase 2: manifest check finds `CustomerOrders` in iOS 5.2 manifest; metric shows `ios 5.2` calls, `web` zero. Plan row status `waiting (ios 5.2)`. After iOS 5.3 adoption and the window passes with zero calls and zero static hits, removal PR shows `✖ Field 'Order.number' was removed` with evidence linked.

---

## Exit Criteria

DONE when every blocked change ships as an additive change with a deprecation, usage is measured from two sources, and removals happen only with zero usage on both.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Deprecating a required argument | **Adjust**: make it optional with a default first; deprecated arguments must be optional. |
| Phase 2 | No client identification headers | **Adjust**: add them to clients now; until then runtime usage is unknown and removal waits. |
| Phase 3 | Window not defined by anyone | **Return**: ask the user for the retention window; do not pick one. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
