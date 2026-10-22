# Hydrogen Balance Of Plant Design

Design the balance of plant: power conditioning, water treatment, gas processing, compression, storage, and control systems.

## Inputs

- `electrolyzer-selection`: Technology, rated capacity, and operating parameters
- `technology-comparison`: Technology-specific BOP requirements

## Outputs

- `bop-design`: Power supply sizing, water treatment train, gas dryer and purifier, compressor selection, and storage vessel sizing
- `process-flow-diagram`: Complete PFD with mass and energy balance at rated and partial load conditions

## Process

1. Design the power supply. For grid-connected: AC/DC rectifier (thyristor or IGBT-based) sized for stack voltage range and current. For renewable-coupled: DC/DC converter or direct connection (for PV) with MPPT. The power electronics must handle the stack's voltage-current characteristic: voltage increases with current (the polarization curve) and changes with temperature and degradation.
2. Design the water treatment system. Raw water passes through multimedia filtration, activated carbon, reverse osmosis (to less than 10 microsiemens/cm), and electrodeionization or mixed-bed ion exchange (to less than 1 microsiemens/cm for PEM). Size for peak water consumption plus 30% for RO reject and system flushing. Include a water storage tank for at least 4 hours of production.
3. Design the gas processing system. Hydrogen from the electrolyzer is saturated with water vapor. A condenser and desiccant dryer reduce moisture to the delivery specification (typically less than 5 ppm for fuel cell grade, ISO 14687). For PEM, oxygen crossover produces trace oxygen in the hydrogen stream; a deoxo reactor (catalytic recombiner) reduces O2 to less than 1 ppm if required.
4. Select the compressor. Electrolyzer output pressure is 1-30 bar depending on technology. If delivery or storage pressure is higher (350-700 bar for vehicle refueling, 200-350 bar for tube trailer), a multi-stage diaphragm or ionic liquid compressor is needed. Size for rated flow with a capacity margin. Compression energy is significant: approximately 2-4 kWh/kg H2 for compression from 30 to 350 bar.
5. Size the storage. Buffer storage between the electrolyzer and the offtaker smooths production-demand mismatch. For ground-level storage, Type I (steel) or Type II (steel liner with composite wrap) vessels at 200-500 bar. Size the storage volume from the maximum expected production-demand mismatch duration. For large volumes, geological storage (salt caverns) offers the lowest cost per kg stored.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
