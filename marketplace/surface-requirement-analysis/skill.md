# Surface Requirement Analysis

Define the surface performance requirements from the application and identify the failure modes the surface treatment must prevent.

## Inputs

- `application-requirements`: Operating conditions (contact stress, sliding speed, temperature, corrosive media), required life, and substrate material
- `failure-mode-history`: Current failure modes of uncoated or currently coated parts (wear mechanism, corrosion type, thermal damage)

## Outputs

- `surface-specification-targets`: Required surface properties: hardness range, friction coefficient, wear rate, corrosion resistance, thermal stability, thickness, and adhesion
- `candidate-processes`: Short list of surface modification processes capable of meeting the property targets on the substrate material

## Process

1. Identify the dominant wear mechanism. Abrasive wear (hard particles sliding against the surface): need high hardness. Adhesive wear (material transfer between sliding surfaces): need low friction and chemical incompatibility. Erosive wear (particle impact): need hardness plus toughness. Fretting wear (micro-motion at contact interfaces): need a combination of hardness and solid lubricant. The wear mechanism dictates the coating property priorities.
2. Identify corrosion requirements. Oxidation resistance at temperature (need a stable oxide former: alumina from Al, chromia from Cr). Aqueous corrosion resistance (need a barrier coating or cathodic protection). Hot corrosion (sulfate/vanadate attack at 700-900C): need MCrAlY or diffusion aluminide coatings. Hydrogen permeation resistance: need a dense barrier (TiN, TiAlN, or DLC).
3. Identify process compatibility with the substrate. PVD and CVD work on most substrates but require vacuum. PVD at 200-500C is compatible with tempered steel (no softening if below tempering temperature). CVD at 800-1000C is limited to substrates that tolerate the temperature (HSS, cemented carbide, ceramics). Thermal spray at atmospheric pressure deposits thick coatings (50-500 microns) but with porosity and lower adhesion. Electroplating is substrate-chemistry dependent. Nitriding modifies the substrate surface directly (no separate coating layer).
4. Short-list 2-3 candidate processes that meet both the property and the process compatibility requirements. For cutting tools: PVD TiAlN or AlCrN for general-purpose, CVD Al2O3 + TiCN for indexable inserts, DLC for non-ferrous machining. For wear-resistant machine components: hard chromium electroplating (being replaced due to Cr(VI) regulations), thermal spray (HVOF WC-Co), or PVD CrN. For corrosion-resistant fasteners: zinc-nickel electroplating, or PVD CrN.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
