# CAN Bit Timing and Sample Point Calculation

**One-line description:** Derives the time-quantum segment values (BRP, prop-seg, phase-seg1, phase-seg2, SJW) for a classic CAN or CAN FD bit rate and sample point from the controller's own bittiming_const limits, and checks that the result matches what the Linux driver actually programs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_netdev` (string, required): SocketCAN interface, for example "can0".
- `bitrate` (integer, required): Nominal (arbitration) bit rate in bit/s, taken from the network specification. Never guess it from traffic.
- `data_bitrate` (integer, optional): CAN FD data-phase bit rate in bit/s. Omit for classic CAN.
- `sample_point` (number, optional): Required nominal sample point as a fraction (for example 0.875), from the network specification or the OEM / CiA profile in use.
- `adapter_report` (object, required): From `canb-usb-adapter-bringup`; tells whether FD is supported.

---

## Outputs

- `bit_timing` (object): bitrate, sample_point, tq_ns, brp, prop_seg, phase_seg1, phase_seg2, sjw for the nominal phase, the same fields for the data phase when FD, the controller clock, and the exact `ip link` arguments to apply.

---

## Phase 1: Read the Controller Limits

### Entry Criteria
- `can_netdev` exists. Interface may be down.

### Actions
1. Run `ip -details link show <can_netdev>`.
2. From the `bittiming_const` line record: driver name, tseg1 min..max, tseg2 min..max, sjw max, brp min..max, brp_inc. From the `clock` field record the controller clock in Hz.
3. If `data_bitrate` is given, also record the `data_bittiming_const` line. If it is absent, the device cannot do CAN FD: go to Error Handling.
4. Write down the sample point source. Decision rule:
   - `sample_point` given: use it.
   - not given, but the network follows a CiA or OEM profile: look up the value in that document (for CANopen, the CiA 301 bit timing table; for CAN FD, the recommendations in CiA 601-3) and cite the section.
   - neither: report "sample point unknown" as an open question and let the kernel choose its default. Do not pick a number yourself.

### Output
Controller limits and sample point source.

### Quality Gate
- clock, tseg1, tseg2, sjw and brp ranges are copied verbatim from the command output.
- The sample point has a cited source or is listed as an open question.

---

## Phase 2: Compute the Segments

### Entry Criteria
- Limits recorded.

### Actions
1. Total time quanta per bit: `N = clock / (bitrate * brp)`. Try brp from brp min upward in steps of brp_inc; keep only brp values where N is an integer.
2. A bit is `1 (sync) + tseg1 + tseg2` quanta, with `tseg1 = prop_seg + phase_seg1`. The sample point is `(1 + tseg1) / N`.
3. For each candidate brp choose `tseg1 = round(sample_point * N) - 1` and `tseg2 = N - 1 - tseg1`. Reject candidates outside the tseg1 or tseg2 limits.
4. Prefer the candidate with the smallest brp (more quanta per bit gives finer sample point placement). Record the achieved sample point and its error from the target.
5. SJW: use the value the network specification gives. If none is given, record "sjw not specified" and leave it for the kernel default; SJW must not exceed tseg2 or sjw max.
6. For CAN FD, repeat steps 1 to 5 with `data_bitrate`, the data sample point and `data_bittiming_const`. Note that at higher data rates the transmitter delay compensation (TDC) matters; on kernels that support it, check `ip link help can` for `tdc-mode` and record whether it is available.
7. Cross-check with the can-utils tool `can-calc-bit-timing` if it is installed (run `can-calc-bit-timing --help` to see its options); differences mean a constant was copied wrong.

### Output
Segment values and achieved sample points.

### Quality Gate
- `1 + prop_seg + phase_seg1 + phase_seg2 == N` for each phase (recompute by hand).
- `clock / (brp * N) == bitrate` exactly.

---

## Phase 3: Confirm What the Driver Programs

### Entry Criteria
- Segments computed.

### Actions
1. Build the command. Either let the kernel compute: `ip link set <can_netdev> type can bitrate <bitrate> sample-point <sp>` (add `dbitrate <d> dsample-point <dsp> fd on` for FD), or give exact segments: `ip link set <can_netdev> type can tq <tq_ns> prop-seg <p> phase-seg1 <p1> phase-seg2 <p2> sjw <s>`.
2. Apply with the interface down (`sudo ip link set <can_netdev> down` first), then run `ip -details link show <can_netdev>`.
3. Compare the printed `bitrate`, `sample-point`, `tq`, `prop-seg`, `phase-seg1`, `phase-seg2`, `sjw`, `brp` with the Phase 2 values.
4. Store the final `ip link` arguments in `bit_timing`.

### Output
`bit_timing`.

### Quality Gate
- The printed bitrate equals `bitrate` exactly.
- The printed sample-point equals the computed one to the 3 decimals the tool prints.

---

## Worked Example

Illustrative. Input: `bitrate`=500000, `sample_point`=0.875, gs_usb adapter with `clock 48000000`, tseg1 1..16, tseg2 1..8, brp 1..1024.

- Phase 1: limits copied; sample point source "network spec".
- Phase 2: brp=6 gives N=16; tseg1=round(0.875*16)-1=13, tseg2=2; sample point 14/16=0.875. tq = 6/48 MHz = 125 ns. brp=3 gives N=32 but tseg1=27 exceeds tseg1 max 16, rejected.
- Phase 3: `ip -details link show can0` prints `bitrate 500000 sample-point 0.875 tq 125 prop-seg 6 phase-seg1 7 phase-seg2 2 sjw 1 brp 6`. Matches.

---

## Exit Criteria

DONE when `bit_timing` holds segment values that satisfy the bit equation, fit the controller limits, and match the driver's printed values.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `data_bittiming_const` but `data_bitrate` given | **Stop**: the adapter cannot do CAN FD; return to adapter selection. |
| Phase 1 | Sample point has no source | **Return**: report it as an open question; use the kernel default and say so. |
| Phase 2 | No brp gives an integer N | **Return**: the clock cannot produce this bit rate exactly; report it rather than accepting a rate error. |
| Phase 3 | `RTNETLINK answers: Device or resource busy` | **Retry**: bring the interface down, then set the bit timing. |
| Phase 3 | Printed values differ from computed | **Adjust**: recheck the clock and limits copied in Phase 1. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
