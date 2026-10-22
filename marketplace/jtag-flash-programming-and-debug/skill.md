# Jtag Flash Programming And Debug

Use JTAG for in-system flash programming, memory access for debug, and custom test instructions for board-level DFT beyond standard boundary scan.

## Inputs

- `interconnect-test-results`: Verified board connectivity before programming
- `chain-topology`: JTAG chain configuration

## Outputs

- `programming-result`: Flash programming status: verify, program, verify cycle with bit-error count if any
- `memory-test-result`: Memory cluster test results for SRAM and SDRAM accessible through JTAG
- `test-coverage-summary`: Total board test coverage combining boundary scan interconnect, memory test, and flash programming verification

## Process

1. Program flash memory through JTAG: use the processor's debug interface (not boundary scan EXTEST) to access the flash controller. Write the flash algorithm to SRAM, then stream the firmware image through JTAG. Verify by reading back and comparing. For large images (greater than 1MB), measure programming time and optimize the JTAG clock speed and data transfer block size.
2. Test memory clusters: for SRAM directly accessible through the processor bus, run a walking-ones pattern followed by an address-uniqueness test through the JTAG debug interface. For SDRAM, initialize the memory controller first (timing parameters must match the board's SDRAM chip), then run the pattern tests. These tests catch solder faults on address and data lines that boundary scan alone might miss if the memory chip has no JTAG.
3. Implement custom JTAG test access for board-specific DFT. If the FPGA or ASIC on the board has custom JTAG instructions (user-defined registers mapped to internal test points), configure these in the test tool. Use them to access voltage monitors, temperature sensors, or loopback test modes not reachable through standard boundary scan.
4. Calculate total test coverage: start with the interconnect test coverage (testable nets / total nets). Add memory test coverage (tested address and data bits / total bits). Add flash programming verification as a functional test of the processor, flash, and boot path. Report untestable areas and recommend supplementary test methods (functional test, flying probe, ICT) for those areas.
5. For production, optimize the test sequence: run the chain integrity test first (fast, catches catastrophic faults), then interconnect test (medium, catches solder faults), then memory test and flash programming (slow but highest value). Calculate total test time and verify it fits the production takt time.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
