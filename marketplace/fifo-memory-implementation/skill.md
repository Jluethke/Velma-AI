# Fifo Memory Implementation

Implement the FIFO storage element using the target FPGA's memory resources (block RAM, distributed RAM, or shift registers) based on depth, width, and access pattern requirements.

## Inputs

- `pointer-logic-design`: Write and read pointer logic with address generation
- `flag-generation-logic`: Empty/full and threshold flag logic

## Outputs

- `fifo-rtl`: Complete FIFO RTL implementation with memory, pointer logic, flag generation, and interface ports
- `resource-utilization-estimate`: Expected FPGA resource usage: BRAM count or LUT count, registers for pointers and synchronizers

## Process

1. Select memory type based on depth and width: (a) Distributed RAM (LUT-based) for shallow FIFOs (depth <= 64, width <= 32), offers combinational read (first-word-fall-through with no extra latency). (b) Block RAM for deeper FIFOs, offers registered read output (one cycle read latency). (c) Shift register (SRL) for very small, fixed-depth FIFOs in Xilinx FPGAs.
2. For block RAM: instantiate as true dual-port RAM with independent read and write ports (required for async FIFO). Configure for write-first or read-first mode based on whether simultaneous read and write to the same address must return new or old data. For most FIFOs, this does not occur because read and write pointers are never equal when both are active (the FIFO would be empty).
3. Implement first-word-fall-through (FWFT) mode if required: when the FIFO transitions from empty to non-empty, the first word appears on the read data output before the read signal is asserted. For block RAM, this requires a bypass register: when writing to an empty FIFO, the data bypasses the RAM and loads directly into the output register.
4. For the async FIFO, ensure the memory write and read ports are clocked by their respective domains. The write address comes from the binary write pointer; the read address from the binary read pointer. The gray-code pointers are separate from the memory addresses.
5. Add write-enable gating: write_en = external_write_enable AND NOT full. Add read-enable gating: read_en = external_read_enable AND NOT empty. These prevent corruption from writes to a full FIFO or reads from an empty FIFO.
6. Estimate resources: each block RAM is typically 18Kb or 36Kb. A 1024-deep x 32-wide FIFO uses one 36Kb BRAM. Pointer logic uses approximately 2 * (log2(depth)+1) registers per domain plus synchronizer registers. Gray-code conversion uses XOR gates (negligible).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
