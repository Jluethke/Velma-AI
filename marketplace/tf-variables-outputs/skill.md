# Root Module Variables, tfvars Precedence and Outputs

**One-line description:** Wires root module variables and outputs: which value source wins (the documented precedence order), where each environment's values live, how to test expressions in `terraform console`, and how other tools read outputs with `terraform output -json`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root module paths.
- `module_interface` (object, required): From `tf-module-interface`; the inputs the root modules must supply.

---

## Outputs

- `variable_definitions` (object): Per root module, each variable, its type, and the single file or environment variable that supplies its value per environment.
- `output_definitions` (object): Per root module, each output, its consumer, and whether it is sensitive.

---

## Phase 1: Map Every Value to One Source

### Entry Criteria
- Root modules exist and call the module(s) in `module_interface`.

### Actions
1. Learn the precedence. Terraform loads values in this order, later sources override earlier ones:
   1. Environment variables `TF_VAR_<name>`
   2. `terraform.tfvars`
   3. `terraform.tfvars.json`
   4. `*.auto.tfvars` / `*.auto.tfvars.json`, in lexical file name order
   5. `-var` and `-var-file` on the command line, in the order given
2. Rule: each variable gets exactly ONE source per environment. Two sources for the same variable cause silent overrides.

| Value kind | Source |
|---|---|
| Non-secret, per environment | `terraform.tfvars` in the env directory, or `env/<env>.tfvars` via `-var-file` |
| Secret | `TF_VAR_<name>` from the CI secret store, or a data source (see `tf-secrets-handling`); never a committed tfvars |
| Same in every environment | A `default` in `variables.tf` |
| Set by CI per run (commit SHA, image tag) | `-var` on the command line |

3. List all value files: `ls *.tfvars *.auto.tfvars* 2>/dev/null` in each root. Any `*.auto.tfvars` file not in your table is a hidden override; record it.
4. Root variables also get `type`, `description`, and `validation` where the value has a known format.

### Output
Draft `variable_definitions`.

### Quality Gate
- Every variable in every root has exactly one recorded source per environment.
- `terraform plan -input=false` with no extra `-var` flags fails with "No value for required variable" for no variable (run it; paste the summary line).

---

## Phase 2: Test Values Before Planning

### Entry Criteria
- Sources mapped.

### Actions
1. Run `terraform console -var-file=<env file>` in the root and evaluate each non-trivial expression, for example `cidrsubnets(var.vpc_cidr, 4, 4, 4)` or `{ for s in var.subnets : s.name => s }`. Paste the results.
2. Check for duplicate keys in a `for` expression meant for `for_each`; console prints "Duplicate object key" if two items share a key.
3. Do not use `-input=true` prompts as a source of values; in CI always pass `-input=false`.

### Output
Console results recorded in `variable_definitions`.

### Quality Gate
- Every `for_each` map expression evaluates in console without error.

---

## Phase 3: Define Outputs for Consumers

### Entry Criteria
- Values tested.

### Actions
1. Output only what a named consumer reads (another root module via a parameter store, a deploy script, a human). Record the consumer.
2. Mark outputs `sensitive = true` when they carry secrets. Sensitive outputs are hidden in plan output but stored in plain text in state.
3. Add a `precondition` to outputs that other systems depend on:
```
output "db_endpoint" {
  value = aws_db_instance.main.endpoint
  precondition {
    condition     = aws_db_instance.main.storage_encrypted
    error_message = "Refusing to publish an endpoint for an unencrypted database."
  }
}
```
4. Consumers read outputs with `terraform output -json` (all) or `terraform output -raw db_endpoint` (single string, no quotes). Scripts must use `-json` or `-raw`; the default human format adds quotes.

### Output
`output_definitions`.

### Quality Gate
- `terraform output -json | jq 'keys'` lists exactly the outputs in `output_definitions` (after an apply in a non-production environment).
- Every output in the table has a named consumer.

---

## Worked Example

Illustrative. Root `live/dev/app` calls `modules/s3-bucket`.

- Phase 1: `name` from `terraform.tfvars`, `kms_key_arn` from `terraform.tfvars`, `image_tag` from `-var` in CI. A stray `override.auto.tfvars` setting `name = "test"` is found and recorded as a hidden override.
- Phase 2: `terraform console` evaluates `cidrsubnets("10.20.0.0/16", 4, 4)` to `["10.20.0.0/20", "10.20.16.0/20"]`.
- Phase 3: outputs `bucket_arn` (consumer: deploy pipeline) read with `terraform output -raw bucket_arn`.

---

## Exit Criteria

DONE when every variable has one source per environment, expressions are tested in console, and every output has a consumer and correct sensitivity.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Same variable set in tfvars and `*.auto.tfvars` | **Adjust**: delete the duplicate from one file after confirming which value is correct with the user. |
| Phase 2 | "Duplicate object key" | **Adjust**: choose a unique key attribute or add `...` grouping deliberately; never use list index as key for `for_each`. |
| Phase 3 | Output needed only by a human | **Adjust**: drop it; humans can use `terraform state show`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
