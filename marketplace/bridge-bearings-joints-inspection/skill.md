# Bridge Bearings Joints Inspection

Select bearings and expansion joints, and establish the inspection and load rating methodology for the completed bridge.

## Inputs

- `superstructure-design`: Superstructure movements (thermal, creep, shrinkage, seismic) and reactions
- `substructure-design`: Substructure configurations and pier stiffness

## Outputs

- `bearings-and-joints`: Bearing type, size, and installation requirements; expansion joint type and movement range
- `inspection-and-rating-plan`: Inspection schedule, access requirements, element-level inspection items, and load rating methodology

## Process

1. Calculate bearing movements. Thermal: coefficient of expansion * temperature range * expansion length (from fixed point to bearing). Creep and shrinkage for concrete superstructures per AASHTO or CEB-FIP. Seismic displacement from analysis. Total movement is the algebraic sum of all sources.
2. Select bearing type. Elastomeric pads: for movements up to 50 mm and moderate rotations (simple span precast girders). PTFE sliding bearings: for large translations. Pot bearings or disc bearings: for high loads with rotation. Seismic isolation bearings (lead-rubber or friction pendulum): for SDC C/D to reduce seismic forces. Size elastomeric bearings: total elastomer thickness > 2 times maximum shear deformation; check shape factor (loaded area per free-to-bulge area) for compressive capacity.
3. Select expansion joints. Strip seals for movements up to 80 mm. Modular joints for larger movements (up to 600 mm). Finger joints for very large movements. Integral abutments eliminate joints entirely (suitable for total bridge length up to 90 m steel, 180 m concrete). Joint selection affects maintenance costs: joints and bearings are the highest-maintenance bridge components.
4. Establish inspection program per NBIS (National Bridge Inspection Standards). Routine inspection every 24 months. Fracture-critical inspection for non-redundant steel members annually. Underwater inspection every 60 months for submerged elements. Element-level inspection per AASHTO bridge element manual: rate each element condition state CS1 through CS4.
5. Develop load rating methodology. Inventory rating: HL-93 loading, phi factors per LRFR. Operating rating: higher capacity reflecting maximum permissible load. Rate all critical sections: positive and negative moment, shear at supports, connections, bearing capacity. Permit load analysis for overweight vehicles. If rating factor < 1.0: posting required or strengthening needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
