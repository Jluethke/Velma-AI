# Hal Testing Strategy

Design a testing strategy for the HAL: unit testing on host with mocked registers, hardware-in-the-loop testing on target, and conformance testing across MCU families.

## Inputs

- `pin-mux-system`: Pin mux abstraction to be tested
- `clock-tree-abstraction`: Clock tree abstraction to be tested

## Outputs

- `test-architecture`: Three test levels: host unit tests (mocked registers), target integration tests (real hardware), and cross-platform conformance tests
- `hal-design-document`: Complete HAL specification: layer architecture, driver pattern, pin/clock abstraction, test strategy, and porting guide for adding a new MCU family

## Process

1. Host unit tests: replace the register access layer with a mock. The mock provides an array of uint32_t values representing each register. The driver code writes to these mock registers, and the test verifies the correct bits were set. This runs on the development machine with no hardware, testing the driver logic in isolation.
2. Create a register mock framework: a struct that mirrors the peripheral register layout, pre-initialized to reset values from the datasheet. After calling hal_spi_init(), assert that CR1 has the expected CPOL, CPHA, BR, and SPE bits. After calling hal_spi_transmit(), assert that DR was written with the correct data.
3. Target integration tests: run on the actual hardware with loopback connections (SPI MOSI connected to MISO, UART TX to RX, CAN with a single node and loopback mode). Verify that data transmitted is correctly received. Measure timing with GPIO toggling to confirm baud rates and latencies are within spec.
4. Cross-platform conformance tests: a test suite that runs the same test cases on every supported MCU family. The tests call only HAL API functions (not register-level code). If all conformance tests pass on a new MCU port, the port is considered functional. This is the acceptance criterion for porting.
5. Document the complete HAL design: layer responsibilities, the standard driver pattern with a worked example (SPI driver walkthrough), pin mux and clock abstraction APIs, the test strategy with example test cases, and a step-by-step porting guide for adding support for a new MCU family. The porting guide should specify exactly which files need to be created and which interfaces need to be implemented.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
