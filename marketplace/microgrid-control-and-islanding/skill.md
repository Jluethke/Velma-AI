# Microgrid Control And Islanding

Design the microgrid control system: energy management, islanding detection, smooth transition, black start, and power quality management in island mode.

## Inputs

- `generation-mix`: Generation sources and their control capabilities
- `economic-comparison`: Selected scenario configuration

## Outputs

- `control-system-design`: Microgrid controller architecture, dispatch algorithm, islanding transition sequence, and black start procedure
- `island-mode-performance`: Voltage and frequency regulation capability, transient response to load steps, and maximum load that can be picked up in a single step

## Process

1. Design the microgrid controller architecture. A central microgrid controller (MMC) communicates with all DERs and the point of common coupling (PCC) breaker. The MMC performs economic dispatch (minimizing operating cost while meeting load and constraints), state estimation, and islanding transition management. Communication: typically Modbus TCP or DNP3 over Ethernet, with latency requirements below 100ms for dispatch and below 20ms for protection signals.
2. Design the islanding transition. For planned islanding (scheduled maintenance): pre-load the DERs to match the microgrid load, then open the PCC breaker at zero current crossing. For unplanned islanding (grid fault): detect the island condition within 2 seconds (IEEE 1547), transition the grid-forming inverter or diesel generator from grid-following to grid-forming mode, and shed non-critical loads if the available generation is less than the total load. The voltage and frequency transient during transition should stay within ANSI C84.1 Range B.
3. Design the black start sequence. After a complete blackout (all sources offline), the black start sequence must re-energize the microgrid without relying on the utility grid. A diesel generator with black start capability (battery cranking, no external power needed) is the typical black start source. Sequence: start the diesel generator, close onto a dead bus, sequentially energize feeders and pick up critical loads in steps (each step limited to avoid frequency and voltage excursions beyond the generator's capability, typically 30-50% of rated load per step).
4. Design the economic dispatch algorithm. In grid-connected mode: charge the battery when renewable generation exceeds load or when grid energy is cheap (time-of-use rates), discharge when grid energy is expensive or during demand peaks (peak shaving). Prioritize renewable self-consumption to maximize savings. In island mode: dispatch generators to follow load, charge the battery from excess renewable generation, shed non-critical loads when generation is insufficient.
5. Verify island mode power quality. In island mode, voltage and frequency are controlled by the grid-forming source (diesel generator or battery inverter). Simulate load transients: a sudden load increase of 20-30% of the grid-forming source's rating should not cause frequency to dip below 57 Hz or voltage below 0.88 pu (ANSI C84.1 Range B limits). If transient performance is inadequate, add a flywheel, increase battery inverter rating, or implement faster load shedding.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
