# Tbm Selection And Specification

Select TBM type and specify its key parameters based on ground conditions, tunnel diameter, and alignment constraints.

## Inputs

- `ground-model`: Interpreted geotechnical model along alignment
- `tunnel-diameter-range`: Excavated diameter range from functional requirements

## Outputs

- `tbm-specification`: TBM type, diameter, thrust capacity, torque, cutterhead design, muck handling system, and backup system requirements
- `ground-conditioning-plan`: Conditioning agents and injection rates for each ground zone (foam, polymer, bentonite for EPB; slurry density targets for slurry shield)

## Process

1. Map ground zones to TBM types. EPB shield for soft ground (cohesive soils, mixed face with clay fraction above 10 to 15%). Slurry shield for granular soils below water table with high permeability (k > 1e-5 m/s) where EPB cannot maintain face support. Hard rock TBM (open or shielded) for rock with UCS above 25 MPa. For mixed face with rock and soil, dual-mode or hybrid TBM.
2. Size the cutterhead. Excavated diameter from internal diameter plus segment thickness plus tail void plus shield skin clearance. Typical segment thickness is tunnel radius divided by 10 to 12. Opening ratio of cutterhead face: 25 to 35% for clay, up to 50% for granular soil. Disc cutter spacing 70 to 90 mm for hard rock.
3. Calculate required thrust from face pressure plus friction. Face pressure equals groundwater pressure plus effective earth pressure (K0 * sigma_v_eff at axis, or higher if full overburden). Add skin friction along shield (empirical: 2 to 5 kN per m2 of shield surface). Total thrust must exceed this with margin for difficult ground.
4. Calculate required torque from cutterhead. Empirical methods: torque proportional to diameter cubed for soft ground, or sum of cutter forces times moment arms for rock. Installed torque typically 1.3 to 1.5 times calculated torque for breakout after stoppage.
5. Specify muck handling. For EPB: screw conveyor diameter (typically 0.6 to 0.7 m for 6 m diameter tunnel), screw length for pressure gradient (longer screw for higher face pressure), belt conveyor or muck car behind. For slurry: slurry circuit with separation plant (cyclones, screens, centrifuge for fine particles).
6. Define ground conditioning plan by zone. For EPB in clay: foam injection with FIR (foam injection ratio) 30 to 60%, FER (foam expansion ratio) 8 to 15. For EPB in sand: add polymer to increase fines adhesion, or bentonite slurry injection. For slurry shield: target slurry density 1.05 to 1.30 g/cm3 depending on permeability and face pressure.
7. Specify probe drilling and pre-excavation treatment capability. Forward probe drilling from cutterhead for ground investigation ahead. Pre-excavation grouting ports for mixed ground or fault zones.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
