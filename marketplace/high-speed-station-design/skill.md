# High Speed Station Design

Design stations for high-speed transport: platform operations, passenger flow, and interface with local transport.

## Inputs

- `alignment-geometry`: Station locations along alignment and approach geometry
- `tube-environment-design`: Pressure transition requirements at stations (for tube systems)

## Outputs

- `station-layout`: Platform configuration, passenger processing areas, airlock or pressure transition zones, vertical circulation
- `passenger-flow-model`: Design capacity, level of service at pinch points, dwell time, and headway

## Process

1. Determine platform configuration. Through-station (trains pass through) vs. terminal (trains reverse). Number of platforms from service frequency and dwell time: minimum 2 for bidirectional service with backup. Platform length from vehicle length. Platform screen doors for safety and environment control (mandatory for reduced-pressure systems, recommended for conventional HSR at > 200 km/h).
2. For tube systems: design airlock or pressure transition. Vehicle enters atmospheric-pressure station chamber, doors open, passengers board/alight, doors close, chamber depressurizes, vehicle departs into tube. Or continuous system where station is also at reduced pressure with airlocks for passenger access. Airlock cycle time directly affects system headway and capacity.
3. Model passenger flow. Level of service standards: LOS C or better for paid areas (1.0 to 1.5 m2/person). Stairway and escalator capacity: 4,500 to 6,000 persons/hour per meter width for stairs. Elevator capacity for accessibility: 10% of peak 15-minute passenger volume. Security screening throughput if required. Simulate peak 15-minute arrivals and departures using pedestrian microsimulation or Fruin analysis.
4. Design intermodal connections. Locate station for connection to metro, bus, taxi, and private vehicle. Kiss-and-ride and park-and-ride capacity from catchment analysis. Minimize transfer distance and level changes between modes. Wayfinding: clear sightlines to platforms from all entrances.
5. Calculate system capacity. Headway from signaling system minimum (for rail: moving block or fixed block) or airlock cycle time (for tube). Vehicles per hour per direction * passengers per vehicle = peak-hour passengers per direction (pphpd). Typical targets: 8,000 to 15,000 pphpd for high-speed rail, potentially lower for pod-based tube systems. Match capacity to demand forecast with growth margin.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
