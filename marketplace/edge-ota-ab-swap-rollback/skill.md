# Edge OTA A/B Model Swap with Rollback

**One-line description:** Installs a signed model package into the inactive of two model slots on the device, switches the active slot with an atomic symlink rename, restarts the inference service, runs a health check with a timeout, and rolls back to the previous slot automatically when the check fails.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `device_host` (string, required): SSH target of the device.
- `model_package` (object, required): Output of `edge-ota-model-package`.
- `health_check_cmd` (string, required): A command on the device that exits 0 only when the service is loading the new model and producing outputs (for example a script that reads the health report from `edge-health-report` and checks `model_version` and a fresh `last_inference_utc`).

---

## Outputs

- `deploy_record` (object): Previous and new slot and model version, timestamps of each step, signature and hash verification results, health check output and exit code, and whether a rollback occurred.

---

## Phase 1: Verify and Stage

### Entry Criteria
- The device has `/opt/edge-models/slots/A`, `/opt/edge-models/slots/B` and a symlink `/opt/edge-models/current` pointing at one of them (create this layout once if absent; record it).

### Actions
1. Read the active slot: `readlink /opt/edge-models/current`. The other slot is the target.
2. Check free space: `df -h /opt/edge-models` must exceed twice the package size (extracted plus tarball).
3. Copy the tarball and signature to `/opt/edge-models/incoming/`.
4. Verify: `openssl dgst -sha256 -verify /etc/edge-models/release_pub.pem -signature <sig> <tarball>` must print `Verified OK`.
5. Empty the target slot (it holds the release before the current one; record its version first), extract into it, then run `sha256sum -c` from its manifest.
6. Compare `min_l4t_release` from the manifest with `/etc/nv_tegra_release`.

Do NOT: extract into the active slot, and do NOT delete the active slot at any point.

### Output
Verified target slot.

### Quality Gate
- Signature verification printed `Verified OK`.
- `sha256sum -c` printed `OK` for every file in the target slot.

---

## Phase 2: Switch Atomically

### Entry Criteria
- Target slot verified.

### Actions
1. Create the new link beside the old: `ln -s slots/<target> /opt/edge-models/current.new`.
2. Rename over the old: `mv -T /opt/edge-models/current.new /opt/edge-models/current`. `mv -T` performs a single `rename()` system call, which is atomic on the same filesystem. `ln -sfn` alone is not atomic (it unlinks then creates).
3. Restart the service: `sudo systemctl restart <service>`. Record the time.
4. The application must load the engine through the key procedure; if the packaged key does not match this device it rebuilds from the packaged ONNX, which can take minutes. Set the health-check timeout to cover that, as a user input.

### Output
Service running on the new slot.

### Quality Gate
- `readlink /opt/edge-models/current` prints the target slot.
- `systemctl is-active <service>` prints `active`.

---

## Phase 3: Health Check and Rollback

### Entry Criteria
- Service restarted.

### Actions
1. Run `timeout <seconds> <health_check_cmd>`; record stdout, stderr and exit code.
2. Decide:

| Exit code | Action |
|---|---|
| 0 | Keep the new slot. Record success. |
| Non-zero or 124 (timeout) | Roll back: `ln -s slots/<previous> /opt/edge-models/current.new && mv -T /opt/edge-models/current.new /opt/edge-models/current`, restart the service, rerun the health check. |

3. If the rollback health check also fails, stop and report both outputs; the device needs an operator.
4. Assemble `deploy_record`.

### Output
`deploy_record`.

### Quality Gate
- `deploy_record` contains the health check exit code for every check run.
- After a rollback, `readlink /opt/edge-models/current` prints the previous slot.

---

## Worked Example

Illustrative only.

```
$ readlink /opt/edge-models/current
slots/A
$ openssl dgst -sha256 -verify /etc/edge-models/release_pub.pem -signature edge-model-2.3.0.tar.gz.sig edge-model-2.3.0.tar.gz
Verified OK
$ ln -s slots/B /opt/edge-models/current.new && mv -T /opt/edge-models/current.new /opt/edge-models/current
$ sudo systemctl restart edge-infer
$ timeout 300 /opt/edge-app/health_check.sh 2.3.0; echo $?
model_version=2.3.0 last_inference_age_s=0.4
0
```
Result: slot B active, version 2.3.0, no rollback.

---

## Exit Criteria

DONE when the new model passes the health check from the newly active slot, or the device is back on the previous slot with a passing health check and the failure recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Signature or hash check fails | **Stop**: do not switch; delete only the incoming files. |
| Phase 1 | Not enough disk space | **Stop**: report; never free space by deleting the active slot. |
| Phase 2 | `mv -T` fails across filesystems | **Adjust**: create `current.new` in the same directory as `current`. |
| Phase 3 | Health check fails | **Return**: roll back per the table and record both results. |
| Phase 3 | Rollback health check fails | **Stop**: report both outputs for operator action. |

---

## Reference Section

The operating system and bootloader have their own A/B mechanism on Jetson (`sudo nvbootctrl dump-slots-info` reads it). OS updates follow NVIDIA's documented OTA procedure for the L4T release and are outside this flow, which swaps only model files.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
