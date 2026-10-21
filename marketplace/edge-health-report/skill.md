# Edge Health Report

**One-line description:** Publishes a machine-readable health record from the device (model version and engine key, last inference time, frame rate, power mode, temperatures, throttle state, memory, service restarts) written atomically at a fixed interval, and defines staleness so a consumer can tell a dead reporter from a healthy one.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `device_host` (string, required): SSH target of the device.
- `service_unit` (object, required): Output of `edge-systemd-watchdog-service`.
- `deploy_record` (object, required): Output of `edge-ota-ab-swap-rollback`; supplies model version and slot.
- `clock_state` (object, required): Output of `edge-jetson-clocks-lock`; supplies the reference GPU frequency for throttle detection.

---

## Outputs

- `health_report` (object): JSON schema of the health record, file path and publish interval, a sample record, the staleness rule, how each field is sourced, and the result of a stale-detection test.

---

## Phase 1: Define the Record

### Entry Criteria
- The service is active.

### Actions
1. Fields and sources:

| Field | Source |
|---|---|
| `utc` | `date -u +%Y-%m-%dT%H:%M:%S.%3NZ` at write time |
| `seq` | monotonically increasing integer, reset only on reporter restart |
| `model_version`, `slot` | `/opt/edge-models/current/manifest.json` and `readlink /opt/edge-models/current` |
| `engine_key` | the key the app actually loaded (the app writes it to a file at load) |
| `last_inference_utc`, `fps` | written by the app's inference loop to a small state file |
| `power_mode` | `nvpmodel -q` |
| `temps_c` | `/sys/class/thermal/thermal_zone*/temp` divided by 1000, keyed by `type` |
| `gpu_freq_hz` | devfreq `cur_freq` from the node in `clock_state` |
| `throttled` | `gpu_freq_hz` below the reference frequency |
| `ram_used_mb`, `ram_total_mb` | `/proc/meminfo` `MemTotal` minus `MemAvailable` |
| `service_restarts` | `systemctl show <service> -p NRestarts --value` |

2. Write the schema as JSON Schema or a typed table in `health_report`.

### Output
Record definition.

### Quality Gate
- Each field has exactly one source command or file.
- `engine_key` is read from what the app loaded, not from the package manifest.

---

## Phase 2: Publish

### Entry Criteria
- Definition complete.

### Actions
1. Implement the reporter as its own small systemd service or a timer (`OnUnitActiveSec=` in a `.timer` unit) so that it keeps reporting when the inference service is down.
2. Write atomically: write to `/run/edge-health/health.json.tmp`, then `mv /run/edge-health/health.json.tmp /run/edge-health/health.json` (same filesystem rename). Readers never see a half-written file.
3. Optional transport, user choice: serve the file over the existing site network (for example an MQTT publish with `mosquitto_pub -t <topic> -f /run/edge-health/health.json` or HTTP). Record the transport and topic.
4. Publish interval is a user input; record it.

Do NOT: compute `fps` in the reporter by guessing; it must come from the app's own counter.

### Output
Running reporter.

### Quality Gate
- `python3 -m json.tool /run/edge-health/health.json` exits 0 on 10 consecutive reads.
- `seq` increases between two reads one interval apart.

---

## Phase 3: Define and Test Staleness

### Entry Criteria
- Reporter running.

### Actions
1. Staleness rule for consumers: a record is stale when now minus `utc` exceeds a user-set multiple of the publish interval, or when `seq` has not increased. Inference is stale when now minus `last_inference_utc` exceeds a user-set limit.
2. Test: `sudo systemctl stop edge-infer`. Within the inference staleness limit, the record must still be published with an old `last_inference_utc` and an increased `service_restarts` or a stopped state. Then `sudo systemctl start edge-infer` and confirm `last_inference_utc` becomes fresh.
3. Test the reporter itself: stop the reporter; confirm the consumer marks the record stale by the rule.
4. Assemble `health_report`.

### Output
`health_report`.

### Quality Gate
- Both tests are recorded with timestamps showing the stale condition detected.
- The staleness rule names its user-set values.

---

## Worked Example

Illustrative only.

```
{"utc":"2026-10-21T15:04:05.120Z","seq":8812,"model_version":"2.3.0","slot":"B",
 "engine_key":"3f7a09c2d1b84e65","last_inference_utc":"2026-10-21T15:04:05.081Z","fps":29.9,
 "power_mode":"30W","temps_c":{"cpu-thermal":57.2,"gpu-thermal":59.0,"tj-thermal":59.4},
 "gpu_freq_hz":1300500000,"throttled":false,"ram_used_mb":6120,"ram_total_mb":30536,"service_restarts":0}
```
After stopping `edge-infer`, `last_inference_utc` stopped advancing while `seq` kept increasing; the consumer flagged inference stale.

---

## Exit Criteria

DONE when a valid health record is published atomically at the set interval and both staleness cases are shown to be detected.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | App does not expose the loaded engine key | **Adjust**: add a one-line write of the key at load in the app. |
| Phase 2 | Partial JSON read | **Adjust**: the writer is not using rename; fix to tmp plus `mv`. |
| Phase 3 | Reporter stops when inference stops | **Adjust**: separate the reporter from the inference process. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
