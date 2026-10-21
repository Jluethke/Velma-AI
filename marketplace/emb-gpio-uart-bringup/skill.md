# GPIO and UART Bring-Up with a Logic Analyzer

**One-line description:** Brings up a first GPIO output and a UART on new hardware, measuring the actual pin toggle and UART bit width with a logic analyzer (sigrok-cli or PulseView), decoding the bytes, and resolving the common clock, alternate-function and wiring faults from the measurement.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `elf_path` (string, required): Test firmware image that toggles one GPIO and transmits on one UART.
- `pin_map` (object[], required): Pin, net, function and alternate function number for the GPIO and UART pins.
- `reference_manual` (string, required): MCU reference manual (RCC, GPIO, USART chapters).
- `logic_analyzer` (string, required): Analyzer model and its sigrok driver name (for example `fx2lafw` for Cypress FX2 based analyzers, `saleae-logic16`), or "Saleae Logic 2" if using that software.

---

## Outputs

- `uart_bringup_record` (object): Measured GPIO toggle period, measured UART bit width, computed baud error, decoded bytes, and each fault found with its fix.

---

## Phase 1: Prove a GPIO Toggles

### Entry Criteria
- Board powered from a current-limited bench supply; supply current recorded at power-on.
- Analyzer ground connected to board ground; analyzer input voltage range covers the I/O voltage (check the analyzer spec).

### Actions
1. Firmware for this step: enable the GPIO port clock (RCC enable bit for that port), set the pin mode to output, toggle it in a loop with a fixed delay derived from a timer or a cycle count.
2. Capture: `sigrok-cli --scan` to find the device, then `sigrok-cli -d <driver> --config samplerate=<rate> --samples <count> -C D0 -o gpio.sr`. Choose a sample rate at least 4 times the highest toggle frequency you expect. Check `sigrok-cli --show -d <driver>` for supported rates.
3. Open `gpio.sr` in PulseView and measure the period with the cursor, or decode with `sigrok-cli -i gpio.sr -P timing:data=D0` (check `sigrok-cli -P timing --show` for the option names).
4. Decision table:

| Observation | Cause to check first |
|---|---|
| Line stays low or high | Port clock not enabled; wrong pin; pin used by debug (SWD/JTAG) |
| Toggles but period wrong by a clean factor | System clock not what the code assumes (HSE value, PLL) |
| Toggles, period correct | GPIO and core clock are good; continue |

### Output
Measured toggle period.

### Quality Gate
- Measured period recorded from the capture; expected period recorded from the code; both shown.

---

## Phase 2: UART Bit Timing

### Entry Criteria
- GPIO toggles with correct period.

### Actions
1. Configure the UART pins as alternate function with the AF number from `pin_map` (cite the datasheet alternate function table). Enable the USART clock. Set 8 data bits, no parity, 1 stop bit, and the baud register from the peripheral clock (read the USART baud rate formula in the reference manual).
2. Transmit `0x55` ('U') repeatedly. With 8N1, 0x55 produces alternating bits so each pulse equals one bit time.
3. Capture the TX pin. Measure one bit width in PulseView. Expected width = 1 / baud.
4. Compute error: (measured baud - nominal baud) / nominal baud. Compare to the receiver's tolerance stated in its reference manual section on receiver tolerance to clock deviation. Do not invent a pass limit; record both numbers.
5. Decode: `sigrok-cli -i uart.sr -P uart:baudrate=<baud>:rx=D0 -A uart=rx-data`. Check `sigrok-cli -P uart --show` for channel and option names in your version.

### Output
Bit width, baud error, decoded bytes.

### Quality Gate
- Decoder output shows `55` bytes with no framing error annotations.
- Baud error and the cited receiver tolerance are both recorded.

---

## Phase 3: Host Link and Fault Table

### Entry Criteria
- Decoded bytes are correct on the analyzer.

### Actions
1. Connect a 3.3 V (or matching I/O voltage) USB-to-UART adapter: board TX to adapter RX, board RX to adapter TX, grounds joined. Never connect RS-232 level signals (a DB9 port) directly to MCU pins.
2. Open a terminal: `python -m serial.tools.miniterm <port> <baud>` (pyserial). Type characters and confirm echo if the firmware echoes.
3. Fault table:

| Symptom | Cause | Fix |
|---|---|---|
| Analyzer good, terminal shows nothing | TX/RX crossed wrong; adapter on wrong port | Swap wires; check port with `python -m serial.tools.list_ports` |
| Garbage characters | Baud mismatch; peripheral clock differs from assumed | Recompute from measured bit width |
| First byte corrupted after reset | Pin floats before init | Configure the pin before enabling the USART; add pull-up per schematic |
| Nothing on analyzer | AF number wrong; USART clock off | Re-read AF table row; check RCC enable bit |

### Output
`uart_bringup_record`.

### Quality Gate
- Terminal shows the expected string sent by firmware (copied into the record).
- Every fault encountered has a row with cause and fix.

---

## Worked Example

Illustrative. STM32F411, USART2 on PA2/PA3 (AF7), FX2 analyzer.

- Phase 1: `sigrok-cli -d fx2lafw --config samplerate=4m --samples 400000 -C D0 -o gpio.sr`; PulseView period 1.000 ms (code expected 1 ms).
- Phase 2: 115200 baud. Measured bit width 8.68 us; nominal 8.681 us; error well inside the tolerance quoted from the USART chapter. `sigrok-cli -i uart.sr -P uart:baudrate=115200:rx=D0 -A uart=rx-data` prints `uart-1: 55` repeated.
- Phase 3: miniterm shows `UUUU...` then `boot ok`.

---

## Exit Criteria

DONE when the GPIO period and UART bit width are measured, decoded bytes are correct, and a host terminal receives the firmware's output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Supply current at power-on far above the board's expected value | **Stop**: power off and inspect for shorts before probing. |
| Phase 1 | Analyzer not found by `--scan` | **Adjust**: install the driver (Zadig WinUSB on Windows for fx2lafw), rescan. |
| Phase 2 | Decoder shows framing errors | **Adjust**: measure bit width again, recompute baud register from the measured clock. |
| Phase 3 | Adapter at 5 V levels | **Stop**: do not connect; use an adapter matching the MCU I/O voltage. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
