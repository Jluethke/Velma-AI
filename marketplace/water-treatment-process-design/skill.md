# Water Treatment Process Design

Size and detail each unit process in the treatment train for the design flow.

## Inputs

- `treatment-train`: Selected processes with design criteria
- `design-flows`: Average and maximum day flows

## Outputs

- `process-sizing`: Dimensions, number of units, and equipment specifications for each process
- `hydraulic-profile`: Water surface elevations through the plant from intake to clearwell

## Process

1. Size rapid mix. Velocity gradient G = 300 to 1000 s^-1 for 10 to 60 seconds. Power required P = mu * G^2 * V, where mu is dynamic viscosity and V is chamber volume. Mechanical mixer or in-line static mixer. For in-line: select mixer diameter and number of elements for target G at design flow.
2. Size flocculation. Three-stage tapered flocculation: G = 60-80 s^-1 in first stage, 30-50 in second, 15-30 in third. Total detention time 20 to 40 minutes at maximum day flow. Paddle, turbine, or vertical turbine flocculators. Gt product (G * detention time) typically 20,000 to 200,000. Provide at least 2 parallel trains for redundancy.
3. Size sedimentation basins. Surface overflow rate at maximum day flow: 1.0 to 2.5 m/h (lower for cold water, higher with tube settlers). Length-to-width ratio 4:1 to 6:1 for rectangular basins. Weir loading rate < 250 m3/m/d. Sludge collection: chain-and-flight or suction header, sludge hopper at inlet end. Minimum 2 basins for maintenance flexibility.
4. Size filters. Filtration rate at maximum day flow with one filter out of service: 5 to 12 m/h. Number of filters from total area required: minimum 4, use formula N = 0.044*sqrt(Q) where Q is in m3/d for larger plants. Individual filter area: 50 to 150 m2 (limited by backwash capacity and media distribution). Underdrain system: Leopold blocks, nozzles, or gravel support with header-lateral. Provide backwash rate 40 to 60 m/h with air scour at 50 to 80 m/h.
5. Build hydraulic profile. Start from clearwell design water level and work upstream, adding head losses through each unit: filter (clean head loss 0.3 m, terminal 2.5 m), piping (Hazen-Williams or Darcy-Weisbach), flocculation chambers (0.1 to 0.3 m), sedimentation weirs, rapid mix. The intake must be high enough to gravity-feed the plant, or provide raw water pumping to overcome the head requirement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
