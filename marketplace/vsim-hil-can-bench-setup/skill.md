# HIL Bench CAN Interface Bring-Up

**One-line description:** Brings up a USB or PCIe CAN adapter under Linux SocketCAN for a hardware-in-the-loop bench, verifies bus wiring and termination with a meter, starts in listen-only mode, and reads controller error state before any frame is sent.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_interface_hw` (string, required): Adapter make and model (for example a PEAK PCAN-USB, Kvaser Leaf, or a gs_usb compatible device) and the ECU under test.
- `can_bitrate` (integer, required): Nominal bitrate from the ECU or vehicle documentation. Do not guess; a wrong bitrate puts error frames on the bus.
- `dbc_file` (string, required): DBC for the bench messages.

---

## Outputs

- `bench_can_config` (object): Interface name, driver, bitrate, termination measurement, listen-only result, controller state and error counters, and the exact `ip link` commands used.

---

## Phase 1: Bench Wiring and Termination

### Entry Criteria
- The ECU is on a bench harness powered from a bench supply, not installed in a vehicle.
- An independent hardware emergency stop removes power from any actuator connected to the bench. If no actuator is connected, record "no actuators".

### Actions
1. With all power off, measure resistance between CAN_H and CAN_L at the adapter connector. ISO 11898-2 high-speed CAN uses a 120 ohm termination at each bus end, so two terminators in parallel read about 60 ohm.
2. Interpret:

| Reading | Meaning | Action |
|---|---|---|
| About 60 ohm | Two terminators | Proceed |
| About 120 ohm | One terminator | Add termination at the other end (adapter switch or resistor) |
| Open or very high | No termination or broken wire | Fix wiring |
| Well below 60 ohm | Extra terminators or short | Remove extras; check for shorts |

3. Confirm the adapter's ground is common with the ECU ground.

### Output
Termination reading and wiring notes.

### Quality Gate
- The measured resistance and the meter used are recorded.
- The emergency stop presence or "no actuators" is recorded.

---

## Phase 2: Bring Up the Interface Listen-Only

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Plug in the adapter. `dmesg | tail` shows the driver (`peak_usb`, `kvaser_usb`, `gs_usb`) and the new interface (`can0`). `ip link show type can` lists it.
2. Configure listen-only first: `sudo ip link set can0 type can bitrate <can_bitrate> listen-only on`, then `sudo ip link set up can0`.
3. Power the ECU from the bench supply. Run `candump -t a -L can0` for a period long enough to see every periodic message in the DBC (use the longest `GenMsgCycleTime` in the DBC; cantools exposes it as `message.cycle_time`).
4. Read controller state: `ip -details -statistics link show can0`. Look at `state` (ERROR-ACTIVE is normal; ERROR-PASSIVE or BUS-OFF means a problem) and `berr-counter tx N rx M`.
5. If you see error frames or rx errors growing, the bitrate is wrong or wiring is bad. Do not leave listen-only mode until rx errors stay at zero.

### Output
Live listen-only capture and controller state.

### Quality Gate
- `ip -details -statistics link show can0` shows `ERROR-ACTIVE` and an rx error counter that does not increase across two reads.
- `candump` shows frames whose IDs match the DBC (`python -m cantools decode <dbc_file>` on the capture decodes them).

---

## Phase 3: Enable Transmit on the Bench Bus

### Entry Criteria
- Phase 2 gate passed. Transmit is only on this isolated bench bus, never on a vehicle bus.

### Actions
1. `sudo ip link set down can0`, then `sudo ip link set can0 type can bitrate <can_bitrate> listen-only off` and `sudo ip link set up can0`. Optionally add `restart-ms <value>` so the controller recovers from bus-off; the value is a user choice and is recorded.
2. Send one harmless frame defined in the DBC as a test or status message: `cansend can0 <id>#<data>`. Do not send actuator command IDs in this flow.
3. Confirm in a second terminal with `candump can0` and confirm the tx counter rises in `ip -s link show can0`.
4. Write `bench_can_config`.

### Output
`bench_can_config`.

### Quality Gate
- `ip -s link show can0` tx packets increased by the number of frames sent.
- Controller state is still ERROR-ACTIVE after the send.

---

## Worked Example

Illustrative. PCAN-USB, ECU documentation states 500 kbit/s.
```
$ sudo ip link set can0 type can bitrate 500000 listen-only on && sudo ip link set up can0
$ ip -details -statistics link show can0
    can <LISTEN-ONLY> state ERROR-ACTIVE (berr-counter tx 0 rx 0) restart-ms 0
          bitrate 500000 sample-point 0.875
$ candump -t a -L can0 | head -2
(1712933100.123456) can0 1A0#0011223344556677
```
Termination 60.4 ohm. Emergency stop: bench relay cut, tested. Transmit check: one status frame sent, tx +1.

---

## Exit Criteria

DONE when the bench bus is terminated, the interface reads the ECU listen-only with no errors, and one harmless transmit is confirmed on the bench bus.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No emergency stop with actuators attached | **Stop**: install an independent hardware stop first. |
| Phase 1 | Termination wrong | **Adjust**: fix per the table, remeasure. |
| Phase 2 | ERROR-PASSIVE or BUS-OFF | **Adjust**: verify `can_bitrate` from documentation and the wiring; stay listen-only. |
| Phase 2 | No interface appears | **Adjust**: check `dmesg` for the driver; install the vendor or mainline driver. |
| Phase 3 | Request to send on a vehicle bus | **Stop**: out of scope; bench bus only. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
