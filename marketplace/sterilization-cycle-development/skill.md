# Sterilization Cycle Development

Develop and validate the sterilization cycle: bioburden characterization, dose setting or cycle parameter qualification, and performance qualification with biological indicators.

## Inputs

- `sterilization-method`: Selected method with applicable standard
- `device-design-characteristics`: Device and packaging configuration for sterilization

## Outputs

- `bioburden-characterization`: Bioburden count and identification on production-representative devices
- `validated-sterilization-cycle`: Qualified cycle parameters with biological indicator and dosimetric evidence of sterility assurance level 10^-6

## Process

1. Determine product bioburden per ISO 11737-1: test 10+ production units from at least 3 production lots. Use membrane filtration or direct immersion culture. Report average bioburden count and identify predominant organisms. Bioburden data drives the dose or cycle severity needed.
2. For radiation (ISO 11137-2): use VDmax method for low bioburden products (under 1000 CFU). Irradiate 10 product items at the verification dose. If no more than 1 of 10 is positive for growth, the 25kGy substantiation dose is validated. For higher bioburden, use Method 1 or 2 with augmented bioburden.
3. For EtO (ISO 11135): develop the cycle in three phases. First, determine the minimum cycle parameters through fractional cycle studies with BIs at worst-case locations. Then run half-cycles to confirm BI inactivation approach. Finally, run full cycles with product load configurations representing worst case (maximum load density, hardest-to-sterilize orientation).
4. Performance qualification: run 3 consecutive sterilization cycles under worst-case conditions (minimum gas concentration, minimum time, coldest temperature for EtO; minimum dose for radiation). All BIs must be inactivated (for EtO). Dosimeters must confirm minimum dose delivery at the minimum-dose location (for radiation).
5. Establish routine monitoring: dosimetric release for radiation (every load), BI and chemical indicator monitoring for EtO (every load), bioburden trending (quarterly). Define revalidation triggers: change in product design, packaging, bioburden, or sterilization equipment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
