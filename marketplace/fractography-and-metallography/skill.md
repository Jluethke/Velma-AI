# Fractography And Metallography

Read the fracture surface and the microstructure to identify the failure mode, the origin, and whether the material and processing were to specification.

## Inputs

- `evidence-record`: The preserved fracture surfaces and as-found documentation
- `material-spec`: The specified material, heat treat, and microstructure the part should have

## Outputs

- `failure-mode`: The identified fracture mechanism (fatigue, overload, brittle, intergranular, corrosion-assisted) and the located origin and crack direction
- `material-findings`: The metallographic and compositional findings: microstructure, hardness, defects, and whether material and processing met the specification

## Process

1. Read the macro fracture features first. Beach marks and a smooth-then-rough surface signal fatigue; a chevron pattern points back to a single overload origin; a shear lip indicates ductile overload; a flat, bright, faceted surface indicates brittle fracture. The macro features locate the origin and the crack-growth direction before any microscopy.
2. Confirm the mechanism under the scanning electron microscope (SEM). Fatigue striations (one per cycle in the growth region), ductile dimples (microvoid coalescence under overload), transgranular cleavage (brittle), and intergranular separation (temper embrittlement, hydrogen, stress corrosion, or creep) each have a distinct SEM signature. Identify the origin feature: an inclusion, a pore, a machining mark, or a corrosion pit.
3. Section through the origin for metallography. Mount, polish, and etch a cross-section through the crack origin to reveal grain structure, phase distribution, decarburization, case depth, and whether a crack followed a weak microstructural path. Section perpendicular to the crack front to see the subsurface initiation.
4. Measure microstructure and hardness against the specification. Compare grain size, phase balance, and hardness (and therefore the effective strength) to the material and heat-treat spec. A part at the wrong hardness, with the wrong microstructure, or with excessive inclusions failed partly because it was not the material the design assumed.
5. Check composition and for environmental attack. Energy-dispersive spectroscopy at the origin and on any corrosion product identifies the wrong alloy, a contaminant, or a corrosive species. Distinguish a material or process nonconformance from a pure design-load failure, because they lead to different corrective actions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
