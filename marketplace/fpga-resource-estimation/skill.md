# Fpga Resource Estimation

Estimate the FPGA resource requirements from the design specification: LUTs, registers, BRAM, DSP blocks, I/O pins, and high-speed transceivers.

## Inputs

- `system-architecture`: Block diagram of the full system showing all processing blocks, memory interfaces, communication interfaces, and control logic
- `performance-requirements`: Clock frequency targets, throughput requirements, latency budgets, and I/O speed grades for each interface

## Outputs

- `resource-estimate`: Estimated LUT, register, BRAM (18Kb and 36Kb), DSP block, I/O pin, and transceiver count for each functional block and the total
- `resource-confidence`: Confidence level for each estimate (high: based on prior implementation, medium: scaled from similar design, low: rough estimate from specification) and recommended margin

## Process

1. Estimate logic resources (LUTs and registers) for each block. For well-understood blocks (UART, SPI, I2C controllers): use published resource figures from IP datasheets. For custom logic: estimate from the RTL's complexity. A simple state machine is ~50-200 LUTs. A packet processor is ~2,000-10,000 LUTs depending on features.
2. Estimate memory (BRAM). Each BRAM is 18Kb or 36Kb. Memory needs: FIFOs (width x depth), lookup tables, frame buffers, coefficient storage. For each memory, calculate bits = width x depth and divide by 18Kb or 36Kb. Add 20% margin for inefficient packing (a 17-bit-wide memory wastes 1 bit per BRAM but uses one full BRAM column).
3. Estimate DSP blocks. Each DSP48 provides one 27x18 multiply-accumulate. Count multiplications: FIR filter taps, matrix operations, correlation functions. If time-multiplexing is used, divide by the multiplexing factor. Add DSP blocks for any arithmetic that benefits from the DSP's pre-adder or pattern detector.
4. Count I/O pins. List every external interface: memory data/address/control, communication ports, sensor inputs, actuator outputs, debug/test, power management, LEDs/switches. Include both signal pins and associated power/ground pins in the I/O bank budget.
5. Count high-speed transceivers. Each serial link (PCIe lane, Ethernet port, fiber channel, custom SERDES) requires one transceiver pair. Multi-lane interfaces require that many transceiver pairs be in the same transceiver quad or bank for channel bonding.
6. Apply margins. For a first implementation: 50% margin on logic (LUT/register), 30% on BRAM, 20% on DSP. For a design migrated from a known implementation: 20% on logic, 10% on BRAM and DSP. Margin accounts for synthesis efficiency, debug instrumentation, and feature additions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
