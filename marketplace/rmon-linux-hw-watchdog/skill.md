# Hardware Watchdog for the Monitor Host

**One-line description:** Configures a hardware watchdog for the monitor host through the Linux `/dev/watchdog` interface or systemd `RuntimeWatchdogSec=`, reads its real capabilities with `wdctl`, and confirms on the bench that watchdog expiry drives the hardware safe state (for example removing propulsion enable) without any software in the path, while braking and emergency stop stay ungated.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `independence_plan` (object, required): Output of `rmon-independence-analysis`.
- `fallback_strategy` (object[], required): Output of `rmon-fallback-mode-selection` (safe state and reaction time budget).

---

## Outputs

- `watchdog_config` (object): Watchdog device identity and timeout from `wdctl`, the configuration method, the hardware signal the watchdog drives, and the bench test record.

---

## Phase 1: Identify the Watchdog

### Entry Criteria
- Linux host with a watchdog driver, or an external watchdog IC or supervisor MCU on the board.

### Actions
1. Run `wdctl` (from util-linux). Record `Device`, `Identity`, `Timeout`, `Timeleft` (if supported) and the `FLAG` table. If `wdctl` reports no device, run `ls /dev/watchdog*` and `dmesg | rg -i watchdog`.
2. Classify the watchdog:

   | Watchdog | Independence | When to use |
   |---|---|---|
   | `softdog` kernel module | none: it is software in the same kernel | never as the safety watchdog |
   | SoC internal watchdog | resets the SoC; shares clock and power with it | acceptable when reset itself leads to the safe state through hardware pulls |
   | External watchdog IC or supervisor MCU | separate clock and logic | preferred when the independence plan requires hardware separation |

3. If only `softdog` is present (`Identity: Software Watchdog`), record that the hardware level of independence is not met.

### Output
Watchdog identity and class.

### Quality Gate
- `wdctl` output (or the external IC datasheet reference) is recorded.
- The class from the table is written with its independence note.

---

## Phase 2: Configure and Wire the Safe Reaction

### Entry Criteria
- A non-`softdog` watchdog exists.

### Actions
1. Timeout: derive it from the `fallback_strategy` budget (the watchdog timeout counts toward detection time) or take it from the user. Check the hardware supports it: `wdctl` `Timeout` and the driver's maximum.
2. Configure one of:
   - systemd as the pinger: set `RuntimeWatchdogSec=<value>` in `/etc/systemd/system.conf` and reboot. systemd then pings the hardware watchdog; this covers kernel and PID 1 hangs, and the monitor's own hang is covered by its `WatchdogSec=` (see `rmon-linux-systemd-isolation`).
   - the monitor as the pinger: open `/dev/watchdog`, write any byte once per cycle after a full monitor cycle. On normal shutdown write the magic character `V` before closing only if the driver supports magic close and requirements allow disarming; otherwise the watchdog stays armed.
   Use only one pinger per device; two pingers mask each other's hangs.
3. Wiring: the watchdog output (reset line or fault output of the external IC) must de-assert the actuator enable or select the safety controller in hardware. Confirm on the schematic that the enable has a pull to the de-energized level, so a reset SoC with floating pins also yields the safe state.
4. The watchdog path may remove propulsion or request braking. It must never cut power to the braking system or the emergency stop circuit.

### Output
Configured watchdog and wiring note.

### Quality Gate
- `wdctl` shows the configured timeout after reboot.
- The schematic reference for the enable pull resistor is recorded.

---

## Phase 3: Bench Test the Expiry

### Entry Criteria
- Bench only, with the drive train lifted or disconnected and an independent hardware emergency stop within reach.

### Actions
1. Measure the actuator enable line with a scope or logic analyzer.
2. Stop the pinger: for systemd pinging, trigger a kernel hang only on a test image (for example `echo c | sudo tee /proc/sysrq-trigger` with sysrq enabled, which crashes the kernel); for monitor pinging, `kill -STOP` the monitor.
3. Measure the time from the last ping to the enable line reaching the de-energized level. Repeat at least the number of times set in the test plan.
4. Compare the worst observed time with the reaction budget in `fallback_strategy`.

### Output
`watchdog_config`.

### Quality Gate
- Scope capture shows the enable line de-energized after every trial.
- Worst measured time is recorded next to the budget with pass or fail.

---

## Worked Example

Illustrative only.
```
$ wdctl
Device:        /dev/watchdog0
Identity:      OMAP Watchdog [version 0]
Timeout:       60 seconds
Pre-timeout:    0 seconds
FLAG           DESCRIPTION               STATUS BOOT-STATUS
KEEPALIVEPING  Keep alive ping reply          1           0
MAGICCLOSE     Supports magic close char      0           0
SETTIMEOUT     Set timeout (in seconds)       0           0
```
`SETTIMEOUT` is supported, so the timeout can be set. The SoC watchdog resets the SoC; the motor enable has a 10 kOhm pull-down on the schematic, so reset de-energizes it.

---

## Exit Criteria

DONE when a non-software watchdog is identified, its timeout is derived or user-given, its expiry de-energizes the actuator enable in hardware within the measured time, and braking and emergency stop are untouched by it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Only `softdog` available | **Return**: record the independence gap; add an external watchdog to the hardware plan. |
| Phase 2 | Desired timeout below hardware minimum | **Return**: to `rmon-fallback-mode-selection` to rebalance the budget. |
| Phase 3 | Enable line stays energized after expiry | **Stop**: fix wiring or pull resistor before any powered test. |

**Do not:** count `softdog` as hardware, run two pingers on one device, or wire the watchdog so it can cut braking or the emergency stop.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
