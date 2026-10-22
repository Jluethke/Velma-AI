# Partitioned Vs Monolithic Selection

Choose between solving all fields in one combined system (monolithic) or solving each field with its own solver and iterating (partitioned), trading stability against the ability to reuse mature single-physics solvers.

## Inputs

- `coupling-map`: The coupled field pairs
- `coupling-strength`: One-way or two-way and the tightness estimate

## Outputs

- `solution-strategy`: Monolithic or partitioned, with the coupling scheme (explicit/loose or implicit/strong) named
- `solver-assignment`: Which solver handles each field and how the coupled system is assembled or exchanged

## Process

1. Understand the monolithic option. A monolithic solver assembles all fields into one system and solves the fully coupled Jacobian at each step. It is unconditionally stable for tight coupling and converges quadratically with a Newton method, but it needs a custom solver, large memory for the combined Jacobian, and good preconditioning; it cannot reuse separately validated single-physics codes.
2. Understand the partitioned option. A partitioned scheme keeps each field in its own solver and exchanges interface data between them. It reuses mature, validated solvers and scales to complex physics, but it can be unstable for tight coupling and needs coupling sub-iterations and relaxation to reach the same answer the monolithic solver gives in one shot.
3. Split partitioned coupling into loose and strong. A loose (explicit) scheme exchanges data once per time step and marches on; it is cheap and fine for weak coupling. A strong (implicit) scheme sub-iterates the field exchange within each time step until the interface residual converges; it is required for tight coupling and for the added-mass regime.
4. Pick by coupling strength and density ratio. Use one-way sequential solving for one-way coupling. Use loose partitioned coupling for weak two-way coupling such as a heavy flexible structure in a light gas. Use strong partitioned or monolithic coupling for tight two-way coupling such as a light structure in a dense liquid, where loose schemes diverge no matter how small the time step.
5. Assign solvers and define the exchange. Name which code owns each field, what is passed at the interface (loads one way, displacements or temperatures the other), and whether the strong coupling is driven by fixed-point iteration with relaxation or by an interface quasi-Newton method, which is the choice the next steps implement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
