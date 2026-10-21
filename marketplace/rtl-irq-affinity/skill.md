# IRQ Affinity For Real-Time CPUs

**One-line description:** Moves every movable hardware interrupt off the real-time CPUs, places the control loop's own device interrupts (CAN, Ethernet, serial) on a deliberately chosen CPU, stops irqbalance from undoing it, and verifies placement from /proc/interrupts counters.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `isolation_config` (object, required): From `rtl-cpu-isolation-bootargs`.
- `housekeeping_cpus` (string, required): Where general interrupts go.
- `rt_device_irqs` (object[], optional): Devices the control loop reads or writes, each with `device` (for example `can0`, `enp2s0`, `ttyS1`) and `target_cpu` (where the user wants its interrupt). Empty means every interrupt goes to housekeeping CPUs.

---

## Outputs

- `irq_affinity_map` (object[]): One row per IRQ: number, name from /proc/interrupts, `effective_affinity_list`, intended CPUs, whether it is kernel-managed, and counter delta per CPU over a test window.

---

## Phase 1: Inventory Interrupts

### Entry Criteria
- `housekeeping_cpus` is set.

### Actions
1. Save `/proc/interrupts` twice, 10 seconds apart: `cat /proc/interrupts > irq_a.txt; sleep 10; cat /proc/interrupts > irq_b.txt`. Columns are per-CPU counts; the last columns name the controller and device.
2. For each numbered IRQ, read `/proc/irq/<n>/smp_affinity_list` and `/proc/irq/<n>/effective_affinity_list`.
3. Map each `rt_device_irqs` device to its IRQ numbers: for a network or CAN interface, `grep <device> /proc/interrupts`, or `ls /sys/class/net/<device>/device/msi_irqs/` for MSI vectors; for USB CAN adapters, the interrupt belongs to the USB host controller (`xhci_hcd`), not to `can0`.
4. Record which IRQs increased on RT CPUs between the two snapshots.

### Output
IRQ inventory with current affinities and activity.

### Quality Gate
- Every IRQ whose count rose on an RT CPU is listed with its name.
- Every device in `rt_device_irqs` maps to at least one IRQ number or is marked `USB-hosted`.

---

## Phase 2: Stop irqbalance From Overriding

### Entry Criteria
- Phase 1 complete.

### Actions
1. `systemctl is-active irqbalance`. If inactive, go to Phase 3.
2. Choose one:
   - Keep irqbalance but ban the RT CPUs: set `IRQBALANCE_BANNED_CPULIST=<RT CPUs read from isolation_config>` in `/etc/default/irqbalance` (Debian) or `/etc/sysconfig/irqbalance` (RHEL). Older versions use `IRQBALANCE_BANNED_CPUS` with a hex mask; check `man irqbalance` on the machine for which one it reads. Then `sudo systemctl restart irqbalance`.
   - Or stop it: `sudo systemctl disable --now irqbalance`. Then every affinity is yours to manage.
3. Record the choice.

### Output
irqbalance state.

### Quality Gate
- `systemctl is-active irqbalance` output is recorded, and if active, the banned list setting is shown with `grep BANNED <file>`.

---

## Phase 3: Set Affinities And Verify

### Entry Criteria
- Phase 2 complete.

### Actions
1. Default for new IRQs: `echo <housekeeping mask hex> | sudo tee /proc/irq/default_smp_affinity`.
2. For every IRQ not belonging to `rt_device_irqs`: `echo <housekeeping_cpus> | sudo tee /proc/irq/<n>/smp_affinity_list`. If the write fails with `Input/output error`, the IRQ is kernel-managed (common for NVMe queues) or per-CPU (timer, IPI): record it as `managed` and do not retry in a loop; `isolcpus=managed_irq` is the mechanism for those.
3. For each `rt_device_irqs` entry, write its `target_cpu`. Decision rule: if the loop waits on the device (blocking read on CAN), putting its IRQ on the loop's CPU keeps the wakeup local but adds that IRQ's handler time to the CPU; putting it on a housekeeping CPU costs a cross-CPU wakeup. The user chooses; record which. Do not choose for them.
4. Read back `effective_affinity_list` for each IRQ. The effective value is what the hardware got; it can differ from the requested one.
5. Repeat the two 10-second snapshots from Phase 1 with the system under its normal load. Compute per-CPU deltas.
6. Persist: affinities reset on reboot and when a driver reloads or an interface goes down and up. Use a systemd oneshot unit ordered `After=network-online.target` (or after your CAN setup unit) that writes the values, or the `tuned` profile on RHEL family. Record the method.

### Output
`irq_affinity_map`.

### Quality Gate
- In the new snapshot pair, every IRQ outside `rt_device_irqs` has delta 0 on every RT CPU, except entries recorded as `managed` or per-CPU (`LOC`, `RES`, `CAL`, `TLB` style rows).
- Each `rt_device_irqs` IRQ shows its count rising only on its `target_cpu`.

---

## Worked Example

Illustrative. `housekeeping_cpus` = `0-1`, `rt_cpus` = `2-3`, `rt_device_irqs` = `[{device: "can0", target_cpu: "2"}]`, a PCIe CAN card.

```
$ grep can0 /proc/interrupts
 129:   0   0   48211   0  IR-PCI-MSI 1048576-edge  can0
$ echo 2 | sudo tee /proc/irq/129/smp_affinity_list
$ echo 0-1 | sudo tee /proc/irq/128/smp_affinity_list   # enp1s0
$ echo 0-1 | sudo tee /proc/irq/131/smp_affinity_list
tee: /proc/irq/131/smp_affinity_list: Input/output error   # nvme0q3, managed
```
After snapshots: `enp1s0` rose only on CPUs 0-1, `can0` only on CPU 2, `nvme0q3` recorded as managed and still on CPU 3. The user is told NVMe I/O on CPU 3 remains a noise source.

---

## Exit Criteria

DONE when no movable IRQ fires on an RT CPU unless placed there on purpose, managed IRQs are listed, irqbalance cannot override, and the setup survives reboot and interface restarts.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Device IRQ not found | **Adjust**: check `ethtool -i <dev>` for bus info and `lspci -vv -s <bus>` for MSI; USB devices use the host controller IRQ. |
| Phase 3 | `Input/output error` on write | **Adjust**: mark managed; do not retry. |
| Phase 3 | Affinity reverts after a minute | **Retry**: irqbalance is still running; repeat Phase 2. |
| Phase 3 | Counts on RT CPU still rise for a moved IRQ | **Return**: compare `effective_affinity_list`; some interrupt controllers support only one target CPU. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
