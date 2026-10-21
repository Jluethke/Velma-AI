# CAN Reverse Engineering Scope and Read-Only Access

**One-line description:** Confirms the vehicle is owned by the user, locates the OBD-II CAN pins per SAE J1962, picks a listen-only capable adapter for the chosen stack, and records a written read-only scope that every later step must obey.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `vehicle_description` (string, required): Make, model, model year, engine and trim of the vehicle, as printed on the registration or the door-jamb label.
- `ownership_confirmed` (boolean, required): True only when the user owns the vehicle (title or registration in the user's name). Leased, borrowed, rental, fleet and customer vehicles are false.
- `stack` (string, required): Capture stack for the whole chain. One of `linux` (SocketCAN plus can-utils), `python` (python-can plus cantools), `savvycan` (SavvyCAN GUI).
- `adapter_model` (string, optional): The CAN adapter the user already owns, exactly as printed on it (for example "PEAK PCAN-USB", "Kvaser Leaf Light v2", "CANable 2.0 with candleLight firmware").

---

## Outputs

- `capture_scope` (object): `vehicle_description`, ownership statement, `stack`, adapter model and its listen-only mechanism, bus access point (connector and pins), candidate bitrates, and the read-only rules list that later flows copy into their Entry Criteria.

---

## Phase 1: Confirm Ownership and Read-Only Rules

### Entry Criteria
- `vehicle_description` is present.
- `ownership_confirmed` is present.

### Actions
1. If `ownership_confirmed` is not true, stop. Do not continue for any reason, including "the owner said it is fine".
2. Write these read-only rules into `capture_scope.rules`, verbatim:
   - "No frame is transmitted on the vehicle network. The adapter runs in listen-only (silent) mode, which also suppresses the ACK bit."
   - "Replay of captured logs happens only on a virtual interface (vcan or a python-can virtual bus) or inside an offline tool with no hardware connection open."
   - "No step disables, bypasses or alters a security gateway, immobilizer, emissions control, airbag, ABS, ESC or any brake or emergency-stop path."
   - "The driver never operates the laptop. Capture is started before the drive and labeled by a passenger or by a pre-scripted marker."
3. Record `stack` and reject any value other than `linux`, `python` or `savvycan`.

### Output
Ownership statement and the rules list.

### Quality Gate
- `capture_scope.rules` contains all four rules word for word.
- `ownership_confirmed` is literally true.
- `stack` is one of the three allowed values.

---

## Phase 2: Locate the Bus Access Point

### Entry Criteria
- Phase 1 passed.

### Actions
1. Find the OBD-II diagnostic connector (SAE J1962). It is usually under the dashboard on the driver side; the owner's manual or service information gives the exact place.
2. Record the CAN pins defined by SAE J1962 and ISO 15765-4: pin 6 = CAN-High, pin 14 = CAN-Low, pin 4 = chassis ground, pin 5 = signal ground, pin 16 = battery positive.
3. Record candidate bitrates. ISO 15765-4 defines 500 kbit/s and 250 kbit/s for legislated OBD on CAN; list those two first. If the service information names CAN FD on the diagnostic connector, also record that the adapter must be CAN FD capable.
4. Do not open trim panels, splice harnesses or connect behind any module. This scope covers the diagnostic connector only.

### Output
Access point record: connector, pins, candidate bitrates, CAN FD yes/no.

### Quality Gate
- Pins 6 and 14 are recorded as CAN-High and CAN-Low with the standard cited.
- At least one candidate bitrate is listed, each tied to ISO 15765-4 or to cited service information.

---

## Phase 3: Choose the Listen-Only Mechanism for the Stack

### Entry Criteria
- Access point recorded.

### Actions
1. Use this table to pick how listen-only is enforced. Record the row used.

| `stack` | Adapter family | Listen-only mechanism |
|---|---|---|
| linux | gs_usb (candleLight), PEAK peak_usb, Kvaser kvaser_usb, other SocketCAN netdev | `ip link set <if> type can bitrate <rate> listen-only on`, verified as `LISTEN-ONLY` in `ip -details link show <if>` |
| python | Same adapter used through python-can `socketcan` on Linux | Same `ip link` setting, then python-can opens the already configured interface |
| python | Vendor driver interface (pcan, kvaser, vector) on Windows or macOS | The interface's silent or listen-only option as documented in the python-can interface page for that vendor; if the page documents none, use the vendor's own configuration tool to set listen-only, and record which |
| savvycan | GVRET-protocol device or SocketCAN through SavvyCAN | The listen-only option in SavvyCAN's connection window, checked before the connection is enabled |

2. If `adapter_model` is given, look up its listen-only support in the vendor documentation and cite the page. If the adapter has no documented listen-only mode, stop and tell the user to get one that does.
3. Write a one-sentence explanation into `capture_scope`: an adapter in normal mode acknowledges every frame and sends error frames at a wrong bitrate, so a "receive only" program on a normal-mode adapter still writes to the bus.
4. Emit `capture_scope`.

### Output
`capture_scope`.

### Quality Gate
- The listen-only mechanism row is named and, for a specific `adapter_model`, a vendor documentation reference is cited.
- `capture_scope` has fields for vehicle, ownership, stack, adapter, mechanism, access point, bitrates and rules, none empty.

---

## Worked Example

Illustrative only.

Input: `vehicle_description` = "2019 compact hatchback, 2.0 L gasoline, owner's vehicle", `ownership_confirmed` = true, `stack` = "linux", `adapter_model` = "CANable 2.0 with candleLight firmware".

- Phase 1: four rules written; stack accepted.
- Phase 2: connector under the steering column; pins 6/14 CAN-H/CAN-L per SAE J1962; candidate bitrates 500000 then 250000 per ISO 15765-4; CAN FD not listed in service information.
- Phase 3: row "linux / gs_usb"; mechanism `sudo ip link set can0 type can bitrate 500000 listen-only on`; candleLight gs_usb driver documents listen-only control mode support.

```
capture_scope:
  stack: linux
  adapter: CANable 2.0 (gs_usb)
  listen_only: ip link listen-only on, verify LISTEN-ONLY flag
  access: OBD-II J1962 pins 6/14, grounds 4/5
  bitrates: [500000, 250000]
```

---

## Exit Criteria

DONE when ownership is confirmed, the four read-only rules are recorded verbatim, the access point and candidate bitrates are cited, and a documented listen-only mechanism is named for the stack and adapter.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ownership_confirmed` is false or missing | **Stop**: this domain covers only vehicles the user owns. |
| Phase 1 | `stack` is not linux, python or savvycan | **Return**: ask the user to choose one of the three. |
| Phase 2 | No OBD-II connector found | **Stop**: consult the service information; do not open panels or tap harnesses. |
| Phase 3 | Adapter has no documented listen-only mode | **Stop**: use an adapter with documented listen-only support. |
| Phase 3 | Vendor documentation unreachable | **Adjust**: check the adapter's --help, man page or driver README and cite it; never assume support. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
