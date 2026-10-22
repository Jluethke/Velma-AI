# Microgrid Generation Mix Optimization

Optimize the generation mix for the microgrid: solar, battery, diesel/gas, wind, and other DERs, balancing cost, reliability, and emissions.

## Inputs

- `load-classification`: Load categories and power demand by category
- `load-profile-analysis`: Hourly load profiles for dispatch optimization

## Outputs

- `generation-mix`: Optimal capacity of each generation source (solar kW, battery kWh/kW, diesel/gas kW, wind kW) with dispatch strategy
- `economic-comparison`: Net present cost comparison of microgrid scenarios against grid-only and diesel-only baselines

## Process

1. Define the candidate resources. Solar PV: capacity limited by available roof and ground area, production profile from the solar resource. Battery: energy (kWh) and power (kW) are independent design variables; round-trip efficiency 85-90%. Diesel or natural gas generator: dispatchable, fuel cost per kWh, maintenance cost per operating hour, emissions rate. Wind: capacity limited by site and permitting, production profile from the wind resource. Combined heat and power (CHP): if thermal loads exist, CHP improves total efficiency from 35% (electricity only) to 70-85% (electricity + heat).
2. Run the optimization. Use HOMER, REopt, DER-CAM, or a custom model. The objective function is typically minimum net present cost (capital + O&M + fuel - avoided grid purchases - demand charge savings). Constraints: critical load must be served for a defined islanding duration (typically 24-72 hours for resilience), emissions limits, space limits, and noise limits. The optimizer sizes each resource and determines the dispatch order.
3. Size the battery for the islanding requirement. During a grid outage, the battery must bridge the gap between renewable generation and critical load. For a 24-hour islanding requirement with solar: the battery must cover the nighttime critical load plus any daytime shortfall. A rough sizing: battery kWh = critical load kW x hours without solar x (1 / round-trip efficiency). Refine with an hourly simulation of the worst-case day (minimum solar, maximum critical load).
4. Size the diesel/gas backup for worst-case scenarios. Even with solar and battery, extended cloudy periods or equipment failures may exhaust the battery. A diesel or gas generator sized to serve the critical load provides the ultimate backup. N+1 redundancy (one more generator than needed) is standard for high-reliability applications. Fuel storage must be sized for the maximum expected outage duration (regulatory requirements may specify minimum fuel storage for hospitals, military, etc.).
5. Compare scenarios. Present the NPC, LCOE, payback period, and CO2 emissions for at least three scenarios: grid-only (baseline), microgrid with optimization, and microgrid with maximum renewable penetration. The optimal scenario minimizes NPC while meeting the reliability and emissions constraints. Sensitivity to utility rate escalation, fuel price, and battery cost shows the robustness of the result.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
