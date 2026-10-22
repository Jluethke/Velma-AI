# Precision Time Distribution

Design a system to distribute precise time and frequency from a reference to remote locations using GNSS, fiber, or network-based methods.

## Inputs

- `synthesizer-design`: Local frequency synthesis system
- `distribution-requirements`: Required time accuracy at remote sites, distance, available infrastructure

## Outputs

- `time-distribution-design`: Selected distribution method with accuracy analysis and equipment specification
- `achieved-accuracy`: Expected time and frequency accuracy at each remote site

## Process

1. Select the distribution method by accuracy and infrastructure. GPS common-view: compare two GPS receivers at different sites, subtract the common satellite errors. Accuracy: 2-10 ns over intercontinental baselines. Requires GPS receiver and antenna at each site. Two-way satellite time transfer (TWSTT): exchange timing signals through a geostationary satellite, cancel the path delay by symmetry. Accuracy: 0.5-2 ns. Requires satellite modem and antenna.
2. For local distribution (within a facility): coaxial cable or fiber distribution of 1PPS and 10 MHz reference. Cable delay: ~5 ns/m for coax, ~5 ns/m for fiber. Compensate with measured delay. For high accuracy: round-trip measurement of cable delay and automatic correction. Temperature coefficient of cable delay: ~100 ppm/C for standard coax. Phase-stabilized fiber links achieve sub-picosecond stability over 100+ km.
3. IEEE 1588 Precision Time Protocol (PTP) for network-based distribution. PTP uses timestamped packets exchanged between master and slave clocks to measure and compensate network delay. Hardware timestamping at the PHY layer reduces jitter. Accuracy: 10-100 ns on a well-designed LAN with PTP-aware switches (boundary clocks or transparent clocks). Accuracy degrades across routers and non-PTP switches.
4. White Rabbit: an extension of PTP using syntonization (frequency locking via the Ethernet physical layer) and precise phase measurement. Achieves sub-nanosecond accuracy over fiber links of 10+ km. Used in CERN, financial trading, and telecom.
5. Design the monitoring and verification system. Each remote site needs a method to verify that it is receiving correct time. Cross-check between distribution methods where possible (e.g., GPS vs PTP). Monitor the time offset at each site and alarm on exceedance. For critical applications, maintain a local holdover clock that continues to provide time during distribution outages.
6. Document the distribution architecture, the equipment at each site, the expected accuracy under normal and degraded conditions (e.g., GPS jamming, network congestion, fiber cut), and the monitoring and alarm system.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
