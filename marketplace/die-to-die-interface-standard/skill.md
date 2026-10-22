# Die To Die Interface Standard

Define or select the standardized interface for die-to-die communication in the heterogeneous assembly.

## Inputs

- `technology-map`: Function-to-node assignment
- `die-definitions`: Chiplet definitions with I/O requirements

## Outputs

- `interface-specification`: Selected standard (UCIe or custom) with protocol, physical layer, and bandwidth per link
- `interface-ip-plan`: IP blocks needed per chiplet for die-to-die communication, including area and power overhead

## Process

1. Evaluate UCIe (Universal Chiplet Interconnect Express). Standard package: 24 lanes at 32 GT/s = 96 GB/s per direction on organic substrate at 100um bump pitch. Advanced package: 16 GT/s per lane at 25um pitch, lower power per bit. Protocol options: PCIe, CXL, or streaming.
2. Evaluate BoW (Bunch of Wires): simpler physical layer (no SerDes, parallel source-synchronous), lower latency (~2ns), lower power per bit, but wider bus (more bumps). Suitable for closely-spaced chiplets on interposer.
3. Compare area and power overhead of each interface IP per chiplet. UCIe PHY: ~1-2mm2, ~0.5-1W per link. BoW: smaller PHY but more I/O pins. Custom: optimized for specific bandwidth but not portable.
4. Select based on requirements: UCIe for ecosystem compatibility and standardized testing. BoW or custom for lowest latency and power when chiplets are designed together. Consider mix: UCIe for external chiplet interfaces, custom for tightly-coupled pairs.
5. Define the interface at each chiplet boundary: protocol, data width, clock scheme (forwarded clock vs embedded), error detection/correction (CRC, retry), and power management (link state transitions, power gating).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
