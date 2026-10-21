# CAN Controller Bring-Up (Loopback, Bench, Listen-Only)

**One-line description:** Brings up an MCU CAN controller (bxCAN, FDCAN, MCAN or similar) in three stages: internal loopback, a two-node bench bus checked against a SocketCAN reference adapter, and listen-only monitoring of a network the user owns, with bit timing and sample point verified and no frames ever transmitted onto a vehicle network.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `elf_path` (string, required): Firmware with the CAN driver under test.
- `pin_map` (object[], required): CAN TX/RX pins with alternate function, and the transceiver standby/enable pin.
- `reference_manual` (string, required): MCU reference manual CAN chapter (bit timing, test and silent modes).
- `can_bitrate` (integer, required): Nominal bitrate of the target network in bit/s, from the network's documentation or the owner. Not guessed.
- `network_owner_confirmed` (boolean, required): True only when the user owns the vehicle or machine whose network will be monitored in Phase 4.

---

## Outputs

- `can_bringup_record` (object): Bit timing register values, computed bitrate and sample point, loopback result, bench result with candump excerpt, error counters, and the listen-only capture summary.

---

## Phase 1: Bit Timing and Internal Loopback

### Entry Criteria
- Board on the bench; no connection to any external CAN network.

### Actions
1. Read the CAN kernel clock frequency from the clock tree (reference manual RCC chapter) and the configured prescaler.
2. Apply the reference manual bit timing formula: bit time = (1 + TSEG1 + TSEG2) time quanta, time quantum = prescaler / f_can_clock. Register fields usually store "value minus one"; read the register description and record both the field value and the real value.
3. Sample point = (1 + TSEG1) / (1 + TSEG1 + TSEG2). Take the target sample point from the network's documentation. For CANopen networks, CiA 301 gives bit timing recommendations; for other networks, if no document gives it, record it as an open question and use the value Linux SocketCAN computes for the same bitrate on the reference adapter (`ip -details link show can0` prints `sample-point`).
4. Enable the controller's internal loopback with silent mode (bxCAN: BTR bits LBKM and SILM; FDCAN/MCAN: TEST register loopback with CCCR TEST and MON set; read the chapter for your controller). In this mode no signal reaches the pins.
5. Transmit one frame with a known ID and data; confirm it is received in the RX FIFO.

### Output
Bit timing values and loopback pass.

### Quality Gate
- Computed bitrate from the recorded register values equals `can_bitrate` exactly, shown as arithmetic.
- Loopback receive shows the same ID and data bytes that were sent.

---

## Phase 2: Bench Bus Wiring

### Entry Criteria
- Loopback passed.
- Bench bus with the MCU board's transceiver and a USB-CAN adapter supported by Linux SocketCAN (for example a gs_usb or PEAK adapter).

### Actions
1. Terminate the bus at both ends with 120 Ohm resistors per ISO 11898-2. With power off, measure CANH to CANL resistance; expect the parallel value of the two terminators (record the measurement).
2. Set the transceiver standby or enable pin to the active level (from `pin_map` and the transceiver datasheet).
3. On Linux: `sudo ip link set can0 type can bitrate <can_bitrate>` then `sudo ip link set can0 up`. Check `ip -details -statistics link show can0` shows `state ERROR-ACTIVE`.

### Output
Bench bus ready.

### Quality Gate
- Termination measurement recorded.
- `ip -details link show can0` shows `ERROR-ACTIVE` and the configured bitrate.

---

## Phase 3: Bench Traffic

### Entry Criteria
- Bench bus ready; nothing else connected to the bus.

### Actions
1. Disable loopback on the MCU (normal mode). Start `candump -tA -x can0` on the host.
2. Transmit a test frame from the MCU. Confirm candump prints it with the right ID, DLC and data.
3. From the host, send to the MCU: `cansend can0 123#DEADBEEF`. Confirm the MCU receives it (log over UART or RTT).
4. Read error counters: on the MCU from the error status register (TEC, REC); on the host from `ip -details -statistics link show can0`. Both must stay at zero during the test. Nonzero counters mean bit timing, termination or wiring fault.
5. Optional: decode the CAN_RX line with sigrok (`-P can:can_rx=D0:...`; check `sigrok-cli -P can --show` for the bitrate option name).

### Output
Bidirectional bench traffic with zero error counts.

### Quality Gate
- candump line for the MCU frame is copied into the record.
- TEC and REC read zero after the test (values recorded).

---

## Phase 4: Listen-Only Monitoring of an Owned Network

### Entry Criteria
- `network_owner_confirmed` == true. If false, **Stop** after Phase 3.
- Read-only by design: the MCU controller is in silent/monitor mode (bxCAN SILM=1 without LBKM; FDCAN CCCR MON=1) so it never transmits and never sends ACK bits. Confirm the register value in the debugger before connecting.
- Connection only at a diagnostic or documented access point the owner chooses. No connection to, or bypass of, a security gateway, immobilizer, emissions control or safety system.

### Actions
1. Set the host adapter to listen-only as well: `sudo ip link set can0 type can bitrate <can_bitrate> listen-only on`.
2. Record traffic: `candump -L can0 > capture.log` for a fixed period chosen by the user.
3. Summarize unique IDs and their periods (`cat capture.log | awk '{print $3}' | cut -d# -f1 | sort | uniq -c`). Decode only with a DBC file the user is entitled to use.
4. Do not send any frame. Do not run `cansend` or `cangen` on this network.

### Output
`can_bringup_record`.

### Quality Gate
- The MCU monitor-mode register value read back from the debugger is recorded before connection.
- Host `ip -details link show can0` shows `LISTEN-ONLY` in the ctrlmode line.
- Host TX counter in `ip -statistics link show can0` is zero after the capture.

---

## Worked Example

Illustrative. STM32F446 bxCAN, f_can_clock 45 MHz, `can_bitrate` 500000.

- Phase 1: prescaler 5, TSEG1 15, TSEG2 2: tq = 5/45 MHz = 111.1 ns; 18 tq per bit = 2.0 us = 500 kbit/s. Sample point (1+15)/18 = 88.9%; the SocketCAN adapter reports `sample-point 0.875` for 500 kbit/s; nearest achievable chosen and recorded. Loopback frame `0x123 [4] DE AD BE EF` received.
- Phase 2: 60.2 Ohm measured between CANH and CANL.
- Phase 3: `candump` prints ` (2026-10-21 10:14:03.120)  can0  321   [2]  01 02`. TEC 0, REC 0.
- Phase 4: owner's bench machine, MON confirmed; 30 s capture, 14 unique IDs, host TX count 0.

---

## Exit Criteria

DONE when bit timing matches `can_bitrate` by arithmetic, loopback and bench traffic pass with zero error counters, and any owned-network capture was taken in listen-only mode with zero transmitted frames.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No integer prescaler gives the exact bitrate | **Adjust**: change the CAN kernel clock source per the clock tree; do not accept a near-miss bitrate. |
| Phase 2 | Termination reads open or about 120 Ohm | **Adjust**: add the missing terminator at the far end. |
| Phase 3 | Error counters rise or controller goes bus-off | **Stop** traffic; recheck sample point, termination and ground, then retry. |
| Phase 4 | `network_owner_confirmed` is false | **Stop**: no monitoring of a network the user does not own. |
| Phase 4 | Any TX count above zero | **Stop**: disconnect immediately and recheck monitor mode before any further capture. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
