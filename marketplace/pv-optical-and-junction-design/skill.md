# Pv Optical And Junction Design

Design the optical front surface and the junction formation process to maximize photocurrent and open-circuit voltage.

## Inputs

- `cell-architecture`: Selected architecture and structure
- `material-system`: Wafer type and properties
- `efficiency-loss-budget`: Target reductions in optical and recombination losses

## Outputs

- `texturing-and-arc-design`: Surface texture and anti-reflection coating specifications
- `junction-formation-recipe`: Diffusion or implant parameters for the emitter and BSF/FSF
- `passivation-stack-design`: Dielectric layers for front and rear surface passivation

## Process

1. Design front surface texturing. Random pyramid texturing by alkaline etch (KOH or NaOH with IPA) on (100) silicon creates pyramids 1-5 um tall. This reduces weighted average reflectance from 35% (polished) to ~10%. For multi-crystalline, acidic texturing (HF/HNO3) gives a rounded etch texture. The pyramid angle (54.7 degrees for (111) facets) determines the optical path enhancement (~4n^2 = 50x for perfect Lambertian).
2. Design the anti-reflection coating. A single-layer SiNx:H by PECVD at 75nm thickness (quarter-wave at 600nm) reduces reflectance to 2-3%. Refractive index target: n = sqrt(n_air * n_Si) = sqrt(1 * 3.9) = 1.97, achieved by adjusting the SiH4/NH3 ratio in PECVD. For even lower reflectance, a dual-layer stack (MgF2/SiNx or SiO2/SiNx) reduces weighted reflectance below 2%. The SiNx also provides hydrogen passivation of the silicon surface and bulk.
3. Design the emitter. For TOPCon: the front boron-doped emitter is formed by BBr3 diffusion at 970-1010C. Sheet resistance target: 100-150 ohm/sq for a lightly doped emitter (low Auger recombination, high Voc) when combined with fine-line metallization. The emitter profile (surface concentration, junction depth) is a trade-off: heavier doping reduces contact resistance but increases Auger recombination and reduces blue response.
4. Design surface passivation. Front: SiO2/SiNx stack (the thin SiO2 from thermal oxidation provides excellent chemical passivation, the SiNx provides field-effect passivation with fixed positive charge and hydrogen). Rear for TOPCon: thin tunnel SiO2 (1.5 nm by chemical oxidation or thermal) plus doped polysilicon (n+ poly-Si, 100-200nm, phosphorus-doped). The tunnel oxide allows majority carrier transport while blocking minority carrier recombination. Target interface recombination current J0 < 5 fA/cm^2 for the passivated contact.
5. Validate passivation quality. Measure implied Voc (iVoc) and effective minority carrier lifetime by photoconductance decay (Sinton WCT-120). Target iVoc > 720 mV for TOPCon. Measure J0 by the Kane-Swanson method (lifetime at multiple injection levels). Map spatially using photoluminescence imaging to identify passivation non-uniformity before metallization.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
