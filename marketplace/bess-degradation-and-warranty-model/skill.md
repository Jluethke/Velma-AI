# Bess Degradation And Warranty Model

Model battery degradation from calendar aging and cycle aging mechanisms, size the overbuild for end-of-life capacity, and structure the warranty to match project economics.

## Inputs

- `thermal-system-design`: Operating temperature profile that affects degradation rate
- `thermal-model-results`: Cell temperature distribution under various operating profiles

## Outputs

- `degradation-forecast`: Year-by-year capacity fade and resistance growth with overbuild recommendation to meet end-of-life energy guarantee
- `warranty-structure`: Warranted capacity at each year, throughput limits, temperature and DOD operating envelope for warranty validity

## Process

1. Model calendar aging. Calendar aging depends on temperature and SOC (state of charge at rest). Higher temperature and higher resting SOC accelerate SEI layer growth. For LFP at 25C and 50% SOC, calendar aging is approximately 1-2% per year. Each 10C increase roughly doubles the rate (Arrhenius relationship). Store batteries at 30-50% SOC when not cycling to minimize calendar loss.
2. Model cycle aging. Cycle aging depends on depth of discharge, C-rate, and temperature. Deeper cycles cause more capacity loss per cycle but deliver more energy per cycle, so the loss per MWh throughput is often similar across DOD ranges. Use the manufacturer's cycle life curve (capacity vs cycle count at specified DOD and temperature) and convert to an equivalent full-cycle count for the expected usage profile using rainflow counting.
3. Combine calendar and cycle aging. The total capacity fade is approximately the sum of calendar fade and cycle fade (linear superposition works as a first approximation for the first 80% of life, though degradation accelerates as it approaches the knee of the aging curve). Build a year-by-year model using the expected cycling profile (cycles per day, average DOD, average temperature from the thermal model).
4. Size the overbuild. If the project requires delivering 100 MWh at year 15, and the degradation model predicts 78% remaining capacity at year 15, install 100/0.78 = 128 MWh nameplate. This overbuild is the largest single driver of BESS capital cost. Reducing operating temperature by 5C or narrowing the DOD window by 10% can reduce required overbuild by 5-10%.
5. Structure the warranty. Manufacturer warranties typically guarantee a minimum remaining capacity (e.g., 60% at 10 years or a stated throughput in MWh). Define the operating envelope that preserves warranty validity: maximum cell temperature, maximum C-rate, DOD limits, and cumulative throughput. The project's BESS controller must enforce these limits. Include augmentation rights (ability to add cells or modules to restore capacity at a known price) in the contract.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
