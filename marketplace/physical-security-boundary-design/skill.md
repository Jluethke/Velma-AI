# Physical Security Boundary Design

Define the physical security boundary and select tamper protection mechanisms appropriate to the threat model: tamper-evident seals, active mesh, potting, environmental sensors, and zeroization triggers.

## Inputs

- `threat-model`: Attacker capabilities: remote only, physical access duration, equipment budget (hobbyist, professional, nation-state)
- `security-level-target`: Target protection level: FIPS 140-3 Level 2/3/4, PCI PTS, CC protection profile

## Outputs

- `tamper-protection-design`: Selected mechanisms: mesh design, sensor suite, potting material, seal placement, zeroization circuit
- `security-boundary-document`: Drawing showing the physical boundary, all penetration points, and the protection at each point

## Process

1. Define the physical security boundary: the enclosure or coating that contains all CSPs (critical security parameters: keys, PINs, intermediate crypto values). Every opening in the boundary (connectors, ventilation, seams) is a potential attack point that must be addressed.
2. Tamper-evident (FIPS Level 2): apply tamper-evident seals over enclosure screws and seams. Seals must show visible damage if removed (frangible labels, holographic seals with unique serial numbers). Document seal placement and inspection procedure. Limitation: detects but does not prevent physical access.
3. Tamper-responsive (FIPS Level 3+): active mesh surrounding the security boundary. Mesh: a dense serpentine trace pattern on a flexible PCB wrapped around the module. The tamper detection circuit continuously monitors mesh continuity and resistance. Any cut, short, or significant resistance change triggers zeroization. Mesh pitch determines the minimum drill diameter that can penetrate without detection (typical: 100-200 um pitch for professional-grade).
4. Environmental sensors: voltage monitor (detect supply glitching), temperature sensor (detect freezing attacks to slow SRAM decay), light sensor (detect decapsulation), clock frequency monitor (detect clock glitching). Each sensor triggers the tamper response when out of specified range. Set thresholds with margin to avoid false triggers during normal operation (temperature: -40C to +85C operational, trigger at -50C or +100C).
5. Zeroization circuit: on tamper trigger, overwrite all key storage (battery-backed SRAM) with zeros or random data. Circuit must be powered by a dedicated battery independent of the main power supply (so zeroization works even when the device is powered off). Zeroization completion time must be shorter than the time for an attacker to read out SRAM through the compromised boundary (target: < 100 microseconds for the write cycle).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
