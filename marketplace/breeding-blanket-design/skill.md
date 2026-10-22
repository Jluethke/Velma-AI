# Breeding Blanket Design

Design the tritium breeding blanket to achieve a tritium breeding ratio greater than 1, accounting for neutronics, thermal-hydraulics, and material constraints.

## Inputs

- `neutron-wall-loading`: 14.1 MeV neutron flux at the first wall in MW/m2
- `blanket-space-envelope`: Available space between first wall and vacuum vessel

## Outputs

- `blanket-concept`: Breeder material, coolant, structure, and neutron multiplier selection
- `tritium-breeding-ratio`: Calculated TBR with uncertainty from nuclear data
- `thermal-hydraulic-design`: Coolant flow, temperature limits, and heat extraction

## Process

1. Select breeder material: lithium ceramic (Li4SiO4, Li2TiO3) as solid pebble beds, liquid lithium-lead (Pb-15.7Li eutectic), or molten salt (FLiBe). Solid breeders are simpler but limited by tritium release temperature. Liquid breeders can serve as both breeder and coolant.
2. Include neutron multiplier: beryllium (n,2n reaction) or lead (in PbLi). Beryllium increases TBR by 0.2-0.4 but is toxic and limited in supply. Calculate TBR using Monte Carlo neutronics (MCNP, Serpent) with FENDL nuclear data library.
3. Target TBR > 1.05-1.15 to account for tritium losses (processing, decay, permeation, inventory). 6Li enrichment increases TBR (natural Li is 7.5% 6Li; enrichment to 30-90% depending on blanket concept).
4. Design thermal-hydraulics: helium-cooled solid breeder (inlet 300C, outlet 500C, 8 MPa) or self-cooled PbLi (inlet 300C, outlet 550C, MHD pressure drop in strong magnetic field requires insulating flow channel inserts or SiC inserts).
5. Calculate tritium production rate and extraction: solid breeder releases T by thermal desorption into helium purge gas (0.1% H2 in He), extracted by cryogenic molecular sieve or oxidation-absorption. PbLi extraction by permeation against vacuum or gas-liquid contactor.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
