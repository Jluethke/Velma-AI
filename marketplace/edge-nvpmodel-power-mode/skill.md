# Edge nvpmodel Power Mode Selection

**One-line description:** Lists the power modes defined for the exact Jetson module in its nvpmodel configuration, sets the requested mode by ID, handles modes that require a reboot, and records the active mode so every benchmark and soak test states the power envelope it ran under.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `device_host` (string, required): SSH target of the device.
- `platform_report` (object, required): Output of `edge-jetpack-l4t-version-check`.
- `power_mode_target` (string, optional): The mode NAME (for example `MAXN` or `30W`) the deployment must run in. When absent, the flow records the current mode without changing it.

---

## Outputs

- `power_mode_record` (object): Mode ID and NAME before and after, the `POWER_MODEL` block for the active mode from the config file, whether a reboot occurred, and raw `nvpmodel -q --verbose` output.

---

## Phase 1: Read Defined and Current Modes

### Entry Criteria
- `platform_report` names the module.

### Actions
1. Run `ssh <device_host> sudo nvpmodel -q`. The output ends with two lines: `NV Power Mode: <NAME>` and the numeric ID. Record both.
2. Run `ssh <device_host> "readlink -f /etc/nvpmodel.conf"` and `ssh <device_host> "grep -n 'POWER_MODEL' /etc/nvpmodel.conf"`. Each line has `ID=<n> NAME=<name>`. Record the full list.
3. Mode IDs differ between modules (an ID that means MAXN on one module can mean a lower mode on another). Always select by reading NAME to ID from this device's file.

### Output
Mode table for this device and the current mode.

### Quality Gate
- The mode table has one row per `POWER_MODEL` line in the active config file.
- The current mode NAME appears in the table.

---

## Phase 2: Set the Target Mode

### Entry Criteria
- Mode table exists.

### Actions
1. If `power_mode_target` is absent, skip to Phase 3.
2. Look up the ID whose NAME equals `power_mode_target` exactly. If no row matches, stop (see Error Handling).
3. Run `ssh <device_host> sudo nvpmodel -m <ID>`.
4. If nvpmodel prints a prompt saying a reboot is required for the change, answer it only after the user confirms the device may reboot now. A reboot during another job loses that job.
5. After any reboot, wait until `ssh <device_host> true` succeeds.

Do NOT: edit `/etc/nvpmodel.conf` to raise clock or power limits. Mode definitions come from NVIDIA for the module's thermal and electrical design; a custom mode is a hardware design change and is out of scope.

### Output
Device running the target mode.

### Quality Gate
- `sudo nvpmodel -q` prints the target NAME.
- If a reboot happened, `uptime` shows the device came back.

---

## Phase 3: Record the Mode

### Entry Criteria
- Mode is final.

### Actions
1. Run `ssh <device_host> sudo nvpmodel -q --verbose > nvpmodel_verbose.txt` and keep the file.
2. Copy the `POWER_MODEL` block (from its `< POWER_MODEL ID=... >` line to the next one) for the active ID out of the config file.
3. Note that nvpmodel persists across reboots. The mode stays set after this flow ends.
4. Assemble `power_mode_record`.

### Output
`power_mode_record`.

### Quality Gate
- `power_mode_record` contains the before and after NAME and ID.
- The active `POWER_MODEL` block is copied verbatim.

---

## Worked Example

Illustrative only.

Input: `power_mode_target` = `MAXN`.
```
$ sudo nvpmodel -q
NV Power Mode: 30W
2
$ grep -n 'POWER_MODEL' /etc/nvpmodel.conf
...: < POWER_MODEL ID=0 NAME=MAXN >
...: < POWER_MODEL ID=1 NAME=15W >
...: < POWER_MODEL ID=2 NAME=30W >
...: < POWER_MODEL ID=3 NAME=50W >
$ sudo nvpmodel -m 0
$ sudo nvpmodel -q
NV Power Mode: MAXN
0
```
`power_mode_record`: before 30W (2), after MAXN (0), no reboot.

---

## Exit Criteria

DONE when the device runs the requested mode (or the current mode is recorded when none was requested) and `power_mode_record` holds the verbatim mode definition.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `nvpmodel: command not found` | **Stop**: the L4T `nvidia-l4t-nvpmodel` package is missing; report it. |
| Phase 2 | `power_mode_target` matches no NAME | **Return**: list the valid NAMEs to the user; never pick the nearest. |
| Phase 2 | Reboot required but not approved | **Stop**: leave the mode unchanged and record that the target is pending. |
| Phase 2 | Mode reverts after reboot | **Adjust**: check for a startup script calling `nvpmodel -m`; report it to the user rather than deleting it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
