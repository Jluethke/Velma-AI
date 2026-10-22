# Tim Type Evaluation

Evaluate TIM types against the application requirements, understanding the physics of each type's thermal performance and failure mechanisms.

## Inputs

- `tim-resistance-budget`: Maximum allowable TIM resistance
- `interface-geometry`: Surface conditions and gap dimensions

## Outputs

- `tim-candidates`: Short list of TIM types and specific products with their thermal resistance at the application conditions, not just the datasheet bulk conductivity
- `tim-failure-risk-assessment`: Expected failure mechanism and time-to-failure for each candidate under the application thermal cycling profile

## Process

1. Understand that bulk thermal conductivity is not the whole story. TIM thermal resistance = bulk resistance + contact resistance at both surfaces. R_TIM = BLT/k + R_contact_1 + R_contact_2. A 5 W/mK pad at 0.5mm BLT has bulk R = 0.05/(5*0.0001) = 100 C*cm^2/W... but with clamping pressure of 200kPa, contact resistance drops and the actual performance is 2-3x better than the bulk calculation alone.
2. Compare TIM types for the application:
- Thermal grease (2-8 W/mK): lowest contact resistance, fills all gaps, but pump-out under thermal cycling causes degradation over time. Best for prototype and rework-friendly designs.
- Phase change material (3-6 W/mK): solid at room temperature, softens above 45-55C to fill gaps. No pump-out. Easier to apply than grease. Requires initial heat cycling to wet the surfaces.
- Thermal pad (1-15 W/mK): compressible solid, gap-filling, electrically isolating options available. Higher thermal resistance than grease but more consistent BLT. Best for applications where gap tolerance is large.
- Gap filler (1-5 W/mK): very soft, fills large gaps (0.5-5mm). Low clamping force required. Used between components and heat sink lids where gap variation is large.
- Indium foil (80 W/mK): metal, conforms under pressure, no degradation. Expensive. For high-reliability or high-power applications.
3. Calculate the actual thermal resistance for each candidate at the application conditions. Use the manufacturer's test data at the relevant bond line thickness and clamping pressure, not the bulk conductivity alone. If data is not available at your conditions, test a sample.
4. Assess reliability failure mechanisms. Grease pump-out: the thermal resistance of silicone grease can double over 1000 thermal cycles between -40C and 125C as the grease migrates from the high-pressure center to the low-pressure edges. Phase change: stable, no pump-out, but the phase change temperature must be below the operating temperature or the TIM never wets. Pads: compression set reduces contact force over time.
5. Short-list 2-3 candidates that meet the thermal resistance budget with margin for degradation over product life. For each, specify: manufacturer and part number, thickness, required clamping pressure, thermal resistance at application conditions (not just datasheet spec), and expected degradation over life.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
