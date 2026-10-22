# Hil Test Fixture Design

Design hardware-in-the-loop test fixtures that exercise the firmware on real hardware with controlled stimuli and automated result verification.

## Inputs

- `unit-test-plan`: Unit tests covering logic; HIL tests now need to cover hardware interaction
- `test-doubles-design`: Interfaces that were mocked in unit tests and now need real hardware testing

## Outputs

- `hil-fixture-design`: Test fixture schematic: target board connections, stimulus generation (signal generators, CAN adapters, SPI masters), measurement (logic analyzers, oscilloscopes, current sensors), and test host interface
- `hil-test-cases`: Test cases that can only be verified with real hardware: timing, interrupt behavior, power consumption, and communication with real peripherals

## Process

1. Define the HIL fixture hardware. Minimum: the device under test (DUT), a test host (PC or Raspberry Pi), a debug probe for flashing and control, and a bus interface for each communication protocol (USB-to-CAN adapter, USB-to-SPI, USB-to-UART). Add signal conditioning as needed (level shifters, attenuators).
2. Automate stimulus generation: the test host sends scripted commands over each communication interface. For CAN: send specific message IDs with known payloads and verify the DUT's response messages. For analog inputs: use a DAC connected to the DUT's ADC input to inject known voltages.
3. Automate result verification: the test host reads the DUT's outputs (GPIO states via a logic analyzer, CAN response messages, UART output) and compares against expected values. Use GPIO pins on the DUT as test points: the firmware toggles them at key events, and the test host captures the timing.
4. Design power measurement into the fixture: a current sense amplifier (INA219 or similar) on the DUT's supply rail, readable by the test host over I2C. This allows automated power consumption tests: verify that sleep mode current is below the spec, active mode current matches the power budget.
5. Create a test sequencer that runs the full HIL suite: flash the firmware, wait for boot, execute each test case, collect results, generate a pass/fail report. The sequencer must handle DUT resets (via the debug probe or a relay on the power supply) for tests that require a clean start.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
