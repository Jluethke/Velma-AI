# Sdm Eigenvalue Extraction

Solve the generalized eigenproblem for natural frequencies and mode shapes with a method suited to the model size and the number of modes needed.

## Inputs

- `mass-stiffness-model`: The mass and stiffness matrices to be solved
- `reduction-scheme`: Any reduction that sets the effective system size

## Outputs

- `natural-frequencies`: The extracted natural frequencies up to the range of interest, with any rigid-body modes identified
- `mode-shapes`: The mass-normalized mode shapes corresponding to each frequency

## Process

1. Solve the generalized eigenproblem (K - omega^2*M)*phi = 0, whose eigenvalues omega^2 give the natural frequencies f = omega/(2*pi) and whose eigenvectors phi give the mode shapes. For a single-degree-of-freedom check the basic relation is omega_n = sqrt(k/m), which also gives a quick hand estimate of the fundamental frequency.
2. Choose the eigensolver by the number of modes and the model size. The Lanczos method is the standard for extracting the lowest tens to hundreds of modes of a large sparse model efficiently; subspace iteration suits a smaller number of modes; avoid dense full-spectrum solvers on large models because cost scales with the cube of the system size.
3. Extract modes over a range, not a fixed count. Request all modes up to about 1.5 times the highest excitation frequency so the frequency-response and participation steps have the modes they need, including those just above the band that still contribute to the response through their tails.
4. Identify and handle rigid-body modes. A free or partially constrained structure has up to six zero-frequency rigid-body modes; confirm their count matches the constraint state (a correctly supported structure has none, a free-free model has six), because an unexpected near-zero mode signals a missing constraint or a mechanism in the model.
5. Mass-normalize the mode shapes so that phi^T*M*phi = 1 for each mode. Mass normalization makes the modal mass unity and the modal stiffness equal to omega^2, which is the convention the frequency-response synthesis and the modal-mass participation calculation assume; mixing normalizations is a common source of wrong response amplitudes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
