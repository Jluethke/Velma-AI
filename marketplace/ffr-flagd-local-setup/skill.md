# flagd Flag File and Local Daemon Setup

**One-line description:** Writes a schema-valid flagd flag definition file for one flag, runs the flagd daemon in Docker against it, and proves evaluation works over the flagd evaluation API and OFREP with curl before any application code is touched.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flag_spec` (object, required): Output of `ffr-flag-type-classify`.
- `provider_choice` (object, required): Output of `ffr-provider-select`; `provider` must be `flagd`.
- `repo_path` (string, required): Repository root where the flag file will live.

---

## Outputs

- `flagd_config` (object): Path of the flag file, the flagd image tag used, the ports (evaluation, management, OFREP), the exact `docker run` command, and the curl evaluation transcript.

---

## Phase 1: Write the Flag File

### Entry Criteria
- `provider_choice.provider` == "flagd".

### Actions
1. Create one file, `flags/flags.flagd.json`, under `repo_path`. If a flag file already exists, add the flag to it instead of creating a second file; flagd merges multiple sources but two files make ownership unclear.
2. Use this shape. The `$schema` line lets editors and the validator check it.
```json
{
  "$schema": "https://flagd.dev/schema/v0/flags.json",
  "flags": {
    "checkout-new-tax-engine": {
      "state": "ENABLED",
      "variants": { "on": true, "off": false },
      "defaultVariant": "off"
    }
  }
}
```
3. Set `defaultVariant` to the variant whose value equals `flag_spec.safe_default`. In flagd, `defaultVariant` is what the flag serves when no targeting rule matches; the code default in the SDK call is separate and is what is served when flagd cannot answer. Both must be the safe value at the start.
4. Do not add `targeting` yet. Targeting is written in `ffr-targeting-rules`.
5. Validate the file against the schema:
```
pipx run check-jsonschema --schemafile https://flagd.dev/schema/v0/flags.json flags/flags.flagd.json
```
If `pipx` is not installed, `pip install check-jsonschema` and run `check-jsonschema` with the same arguments.

### Output
A schema-valid flag file.

### Quality Gate
- `check-jsonschema` prints `ok -- validation done` and exits 0.
- `defaultVariant` maps to the same value as `flag_spec.safe_default`.

---

## Phase 2: Run flagd and Evaluate

### Entry Criteria
- Valid flag file.

### Actions
1. Start flagd from `repo_path`:
```
docker run --rm -it --name flagd \
  -p 8013:8013 -p 8014:8014 -p 8016:8016 \
  -v "$(pwd)/flags:/etc/flagd" \
  ghcr.io/open-feature/flagd:latest \
  start --uri file:/etc/flagd/flags.flagd.json
```
Ports per the flagd docs: 8013 evaluation (gRPC and HTTP via Connect), 8014 management (health and metrics), 8015 sync, 8016 OFREP. For anything beyond a local check, replace `latest` with a pinned version tag and record it.
2. In another terminal, evaluate with the flagd evaluation API:
```
curl -s -X POST "http://localhost:8013/flagd.evaluation.v1.Service/ResolveBoolean" \
  -H "Content-Type: application/json" \
  -d '{"flagKey":"checkout-new-tax-engine","context":{}}'
```
3. Evaluate the same flag through OFREP, which is what browser and generic OFREP providers use:
```
curl -s -X POST "http://localhost:8016/ofrep/v1/evaluate/flags/checkout-new-tax-engine" \
  -H "Content-Type: application/json" \
  -d '{"context":{"targetingKey":"user-123"}}'
```
4. Read each response. `value` must equal the safe default, `variant` must be `off` (or your safe variant), and `reason` should be `STATIC` (no targeting). Any `errorCode` field means something is wrong.
5. Ask for a key that does not exist and confirm flagd returns a not-found error rather than a value. This proves the SDK will fall back to the code default for a typo:
```
curl -s -X POST "http://localhost:8013/flagd.evaluation.v1.Service/ResolveBoolean" \
  -H "Content-Type: application/json" -d '{"flagKey":"no-such-flag","context":{}}'
```

### Output
Evaluation transcript.

### Quality Gate
- The ResolveBoolean response for the real key shows `"value":` equal to the safe default.
- The OFREP response shows the same value.
- The unknown-key request returns a not-found error code, not a value.

---

## Phase 3: Prove Hot Reload

### Entry Criteria
- Daemon running.

### Actions
1. Edit `defaultVariant` to the non-safe variant, save, and re-run the ResolveBoolean curl. flagd watches file sources; the new value should appear without a restart. Read the flagd container log for a line about the file change.
2. Change `defaultVariant` back to the safe variant and confirm with curl again.
3. Record the time between saving and seeing the new value. This is a local number only; production propagation is measured in `ffr-kill-switch-drill`.
4. Stop the container with `docker stop flagd`. Do not leave the edited file with the non-safe default.

### Output
`flagd_config`.

### Quality Gate
- Two curl results recorded: one after the flip showing the non-safe value, one after reverting showing the safe value.
- `git diff flags/flags.flagd.json` shows `defaultVariant` set to the safe variant.

---

## Worked Example

Illustrative only.

```
$ pipx run check-jsonschema --schemafile https://flagd.dev/schema/v0/flags.json flags/flags.flagd.json
ok -- validation done
$ curl -s -X POST http://localhost:8013/flagd.evaluation.v1.Service/ResolveBoolean -H "Content-Type: application/json" -d '{"flagKey":"checkout-new-tax-engine","context":{}}'
{"value":false,"reason":"STATIC","variant":"off","metadata":{}}
$ curl -s -X POST http://localhost:8016/ofrep/v1/evaluate/flags/checkout-new-tax-engine -H "Content-Type: application/json" -d '{"context":{"targetingKey":"user-123"}}'
{"key":"checkout-new-tax-engine","value":false,"reason":"STATIC","variant":"off","metadata":{}}
$ curl -s -X POST http://localhost:8013/flagd.evaluation.v1.Service/ResolveBoolean -H "Content-Type: application/json" -d '{"flagKey":"no-such-flag","context":{}}'
{"code":"not_found","message":"FLAG_NOT_FOUND"}
```
After flipping `defaultVariant` to `on` the next call returned `"value":true` about one second later; reverted and confirmed `false`.

---

## Exit Criteria

DONE when the flag file validates, flagd serves the safe default over both APIs, an unknown key returns not-found, and hot reload was shown and reverted.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Schema validation fails | **Adjust**: fix the field named in the error; common causes are `defaultVariant` not in `variants` and `state` not `ENABLED` or `DISABLED`. |
| Phase 2 | Port already in use | **Adjust**: map a different host port (`-p 18013:8013`) and use it in curl. |
| Phase 2 | curl returns connection refused | **Retry**: check `docker logs flagd` for a file path error; the `--uri` path is inside the container. |
| Phase 3 | Change not picked up | **Adjust**: on Docker Desktop with some bind mounts file events do not propagate; restart the container and record that hot reload is not available in this setup. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
