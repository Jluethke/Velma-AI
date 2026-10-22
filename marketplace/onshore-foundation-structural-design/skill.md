# Onshore Foundation Structural Design

Design the structural foundation for an onshore wind turbine: gravity base or pile foundation, reinforcement design, anchor bolt embedment, and construction detailing.

## Inputs

- `geotechnical-model`: Soil profile and design parameters at the turbine location
- `foundation-design-parameters`: Allowable bearing pressure, stiffness, and hazard mitigation requirements

## Outputs

- `foundation-design`: Foundation type, dimensions, reinforcement layout, anchor bolt ring specification, and concrete mix design
- `construction-specification`: Excavation requirements, concrete placement sequence, curing requirements, backfill specification, and quality control plan

## Process

1. Select the foundation type. Gravity base (octagonal or circular pad, 15-22m diameter, 2-3m deep) is standard for onshore wind turbines on competent soil with adequate bearing capacity (greater than 150 kPa). Pile foundation (driven steel piles or drilled shafts) is used when bearing capacity is insufficient at shallow depth or when the soil is highly compressible. Rock-anchored foundations use post-tensioned anchors drilled into competent rock.
2. Size the gravity base foundation. The overturning moment from the tower base is resisted by the weight of the foundation and the overlying soil. Verify: bearing pressure under the combined vertical load and overturning moment does not exceed the allowable (use Meyerhof's effective area method for eccentric loading). Verify rotational stiffness meets the turbine manufacturer's requirement (typically expressed as a maximum rotation at the foundation top for the design moment).
3. Design the reinforcement. The foundation slab acts as a cantilevered plate loaded by the soil bearing pressure. The bending moment is maximum at the pedestal face. Design the radial and circumferential reinforcement per ACI 318 or Eurocode 2 for the factored bending moments and shear forces. Minimum reinforcement ratios apply to control cracking. The pedestal transfers the anchor bolt forces into the slab: design for the combined tension, shear, and bending from the tower base flange.
4. Specify the anchor bolt ring. The anchor bolt ring (typically 100-140 bolts of 36-72mm diameter arranged on a 4-5m diameter circle) transfers the tower overturning moment into the foundation as a tension-compression couple. Bolt embedment length must develop the bolt's proof load. The bolt template must be surveyed to within 1mm tolerance for compatible mating with the tower base flange.
5. Develop the construction specification. Excavation to design depth with proof rolling to verify bearing capacity. Lean concrete mud mat (75-100mm) for a clean working surface. Reinforcement placement with spacers for cover. Continuous concrete pour (a 500-800 cubic meter pour for a large foundation) with temperature monitoring for mass concrete effects (limit temperature rise to 20C above ambient to prevent thermal cracking). Cure for 28 days minimum before tower erection loading. Backfill with compacted select fill to restore overburden.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
