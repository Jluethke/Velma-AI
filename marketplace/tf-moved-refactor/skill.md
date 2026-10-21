# Refactor Addresses with moved Blocks

**One-line description:** Renames resources, moves them into or out of modules, and converts `count` to `for_each` using `moved` blocks so the plan shows "has moved to" and zero destroys, with rules for when moved blocks may later be deleted.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root module whose state is affected (one at a time).
- `refactor_map` (object[], required): Each: old address and new address, for example `aws_instance.web` to `module.app.aws_instance.this`.

---

## Outputs

- `moved_blocks` (object[]): Each moved block written and the file it lives in.
- `refactor_plan_summary` (string): Plan summary after the refactor, which must show 0 to add and 0 to destroy.

---

## Phase 1: Classify Each Move

### Entry Criteria
- `terraform version` is 1.1 or later (moved blocks). The current plan is clean (`terraform plan -detailed-exitcode` exits 0).

### Actions
1. Capture current addresses: `terraform state list > before.txt`.
2. For each `refactor_map` row, pick the mechanism:

| Change | Mechanism |
|---|---|
| Rename within the same module | `moved` block |
| Move into or out of a child module in the same state | `moved` block with `module.` prefix |
| `count` to `for_each` (index to key) | One `moved` block per instance: `from = aws_subnet.private[0]` `to = aws_subnet.private["a"]` |
| Rename a whole module call | `moved { from = module.old  to = module.new }` |
| Change resource type (for example `aws_x` to `aws_y`) | Only if the provider documents cross-type move support (Terraform 1.8+); otherwise `removed` plus `import` via `tf-state-surgery` and `tf-import-existing` |
| Move to a different state (another root module) | Not possible with `moved`; use `tf-state-surgery` |

### Output
Classified move list.

### Quality Gate
- Every row has a mechanism from the table; rows needing surgery are handed off, not forced into `moved`.

---

## Phase 2: Write Moved Blocks

### Entry Criteria
- Classified list exists.

### Actions
1. Change the code (rename the block, move it into the module) AND add the moved block in the same commit:
```
moved {
  from = aws_instance.web
  to   = module.app.aws_instance.this
}
```
2. Put moved blocks in the module where the `from` address was declared, conventionally a `moved.tf` file. For moves into a child module, write them in the calling module.
3. For `count` to `for_each`, write one block per existing index; take indexes from `before.txt`, not from memory.
4. Run `terraform validate`.

### Output
Code change plus `moved.tf`.

### Quality Gate
- `terraform validate` prints "Success!".
- The number of moved blocks equals the number of `refactor_map` rows handled here (count expanded instances individually).

---

## Phase 3: Prove a Zero-Destroy Plan

### Entry Criteria
- Validate passes.

### Actions
1. `terraform plan -input=false -out=tfplan`.
2. Each move appears as `# aws_instance.web has moved to module.app.aws_instance.this`. The summary must be `Plan: 0 to add, 0 to change, 0 to destroy.` (an in-place change is acceptable only if the code also changed an argument on purpose).
3. Machine check: `terraform show -json tfplan | jq '[.resource_changes[] | select(.change.actions | index("delete"))] | length'` prints 0.
4. Apply: `terraform apply tfplan`. Then `terraform state list > after.txt` and confirm the new addresses.
5. Removal rule for moved blocks:

| Where | When it may be deleted |
|---|---|
| Root module with one state | After every environment's state has applied it |
| Reusable module consumed by others | Keep it; consumers on old versions still need it. Remove only in a major version with release notes |

### Output
`moved_blocks`, `refactor_plan_summary`.

### Quality Gate
- jq delete count is 0 before apply.
- `diff before.txt after.txt` shows only the mapped address changes.

---

## Worked Example

Illustrative. `live/prod/network`: subnets use `count = 3`; refactor to `for_each` keyed by AZ.

- Phase 1: `before.txt` lists `aws_subnet.private[0]`, `[1]`, `[2]`. Mechanism: three moved blocks.
- Phase 2: `moved.tf`: `from = aws_subnet.private[0]` `to = aws_subnet.private["us-east-1a"]`, and so on for 1b and 1c, matching each index's actual AZ from `terraform state show 'aws_subnet.private[0]'`.
- Phase 3: plan prints three "has moved to" lines and `Plan: 0 to add, 0 to change, 0 to destroy.` jq prints 0. Applied.

---

## Exit Criteria

DONE when all mapped addresses moved with zero destroys, state shows the new addresses, and a removal rule is recorded for each moved block.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Baseline plan not clean | **Stop**: resolve pending changes first. |
| Phase 3 | Plan shows destroy and create instead of moved | **Adjust**: the `from` address does not match state; compare with `before.txt` exactly (quotes, index type). |
| Phase 3 | Index mapped to the wrong key (AZ mismatch) | **Adjust**: plan shows in-place AZ change or replacement; fix the mapping using `terraform state show` per index. |
| Phase 3 | "Moved object still exists" | **Adjust**: the old resource block is still in code; remove it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
