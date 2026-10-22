# Fpga Vendor And Family Evaluation

Evaluate FPGA vendor families against the resource estimates, performance requirements, and project constraints to create a shortlist of candidate devices.

## Inputs

- `resource-estimate`: Resource requirements with margins
- `resource-confidence`: Confidence levels and recommended margins

## Outputs

- `device-shortlist`: 3-5 candidate FPGA devices from 1-2 vendors, each with its resource headroom, speed grade, package, and unit price at the expected volume
- `vendor-comparison-matrix`: Side-by-side comparison of candidates across: resources, speed grade, I/O count, transceiver count, power, package size, price, tool chain maturity, IP availability, and long-term availability

## Process

1. Filter by hard requirements. Eliminate devices that do not have enough of any single resource: insufficient transceiver count, wrong transceiver speed, missing I/O standard support, or insufficient DSP blocks. These are non-negotiable.
2. Select the speed grade. The speed grade determines the maximum achievable clock frequency. If the design requires 400 MHz operation and the device's fastest speed grade achieves 450 MHz on representative logic, there is 12% margin. If the slowest speed grade achieves 350 MHz, it is insufficient. Prefer the slowest speed grade that meets timing with margin, because faster grades cost more and consume more power.
3. Evaluate the package. Pin count must accommodate all I/O plus power/ground. Physical footprint must fit the PCB. Thermal pad or ball configuration must be compatible with the assembly process. Some packages have fewer transceiver pairs than the die supports; verify the package exposes enough for the design.
4. Compare vendors. AMD/Xilinx vs Intel/Altera: evaluate tool chain quality (Vivado vs Quartus), available IP (Ethernet MAC, PCIe, DDR controller), ecosystem (documentation, community, third-party tools), and your team's existing expertise. Switching vendors has a learning curve cost.
5. For cost-sensitive applications: consider Lattice (lower power, lower cost, fewer resources) or Microchip/Microsemi (flash-based, instant-on, radiation-tolerant options). These target different segments than AMD and Intel.
6. Check long-term availability. FPGA devices can have 15+ year lifecycles, but specific packages may be discontinued earlier. For products with long production runs, verify the device and package are not in the 'not recommended for new designs' status. Request a product lifecycle commitment from the vendor.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
