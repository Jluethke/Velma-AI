# Transformer Condition Assessment

Assess the condition of power transformers using dissolved gas analysis, electrical tests, and physical inspection to make maintenance and replacement decisions.

## Inputs

- `cable-specification`: System context for transformer loading and protection
- `ampacity-calculation`: Loading conditions that affect transformer thermal aging

## Outputs

- `condition-assessment`: Overall transformer health index based on DGA, electrical tests, and physical inspection, with remaining life estimate
- `maintenance-recommendations`: Prioritized maintenance actions: oil processing, leak repair, bushing replacement, load management, or planned replacement

## Process

1. Perform dissolved gas analysis (DGA). Sample the insulating oil and measure dissolved gases: hydrogen (H2), methane (CH4), ethane (C2H6), ethylene (C2H4), acetylene (C2H2), carbon monoxide (CO), and carbon dioxide (CO2). Each gas indicates a specific fault type: H2 indicates partial discharge; C2H2 indicates arcing; C2H4 indicates high-temperature oil overheating; CO indicates cellulose degradation. Use the Duval Triangle, Rogers ratios, or IEC 60599 key gas method to classify the fault type. Trending is as important as absolute values: rapidly increasing gas levels indicate an active fault.
2. Perform electrical tests. Power factor (dissipation factor) test at 10kV: measures the dielectric losses in the insulation system. Values above 1% for oil-filled transformers indicate insulation degradation. Winding resistance: detects loose connections, broken strands, and tap changer contact problems. Compare phases and compare to nameplate or factory test values; differences above 2% warrant investigation. Turns ratio test: verify at all tap positions; deviation above 0.5% from nameplate indicates winding damage.
3. Perform frequency response analysis (FRA). Sweep a low-voltage signal across a frequency range (20Hz to 2MHz) and measure the transfer function between terminals. Compare the measured response to a baseline (factory test or previous measurement). Deviations indicate mechanical changes: winding displacement, core movement, or clamping looseness. FRA is the most sensitive test for detecting mechanical damage from through-faults or transportation incidents.
4. Assess insulation condition. Oil quality: measure breakdown voltage (IEC 60156, minimum 30kV for new oil, 20kV for service-aged), moisture content (Karl Fischer, less than 20ppm for transformers above 69kV), and acidity (neutralization number, less than 0.2 mgKOH/g). Paper insulation condition: degree of polymerization (DP) estimated from furan compounds in oil (2-furfuraldehyde correlates inversely with DP). DP below 200 indicates end-of-life paper; replacement may be warranted.
5. Calculate the health index. Combine DGA results (40% weight), electrical test results (25%), oil quality (20%), and physical condition (age, loading history, external condition: 15%) into a composite score. Map the score to a condition category: Good (normal maintenance), Fair (increased monitoring), Poor (plan repair or replacement), Very Poor (imminent failure risk, limit loading). Use the health index to prioritize capital spending across the transformer fleet.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
