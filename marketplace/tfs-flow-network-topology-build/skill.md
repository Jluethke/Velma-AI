# Tfs Flow Network Topology Build

Represent the physical system as nodes and branches so a continuous pipe network becomes a solvable set of conservation equations at junctions and flow relations along components.

## Inputs

- `system-schematic`: The piping and instrumentation layout with components, connections, and operating fluid
- `operating-conditions`: Source pressures and temperatures, demanded flows, and the environment the system exchanges heat with

## Outputs

- `network-graph`: The nodes (junctions, boundaries) and branches (components) with connectivity and reference elevations
- `boundary-set`: The fixed-pressure, fixed-flow, and thermal boundary conditions that close the network

## Process

1. Map every junction and reservoir to a node and every flow-carrying component to a branch. A node carries a single pressure and temperature; a branch (pipe, pump, valve, heat exchanger) carries a flow and a pressure change that depends on that flow. This one-dimensional abstraction is valid when the flow is well described by cross-section averages, which holds for most piping systems.
2. Record elevations at nodes to capture static head. The pressure relation along a branch includes the gravity term rho*g*dz between its end nodes, which matters for tall systems, pump suction head, and natural-circulation loops; omitting elevation silently biases the pressure solution.
3. Set the boundary conditions that close the problem. Fix pressure at reservoirs and open ends, fix flow at pumps operating on a demanded duty or at metered supplies, and fix temperature or heat input at thermal boundaries; a network with too few boundaries is underdetermined and one with inconsistent boundaries has no solution.
4. Identify loops and series-parallel structure. Count independent loops for the pressure-flow solve; parallel branches split flow by their resistances and series branches share flow, and recognizing this structure both aids the solver initial guess and catches topology errors such as an isolated node with no path to a boundary.
5. Choose the modeling fidelity per component. Decide which components are lumped (a single branch resistance) and which need internal nodes (a long pipe discretized for temperature decay, a heat exchanger split into sections); the topology must carry enough internal nodes to resolve the temperature and pressure variation the outputs require.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
