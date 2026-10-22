# Sdm Modal Mass Participation Check

Compute the effective modal mass of each mode and confirm enough modes are retained to represent the dynamic response, using the standard participation threshold.

## Inputs

- `natural-frequencies`: The extracted frequencies whose participation is assessed
- `mode-shapes`: The mass-normalized mode shapes used in the participation calculation

## Outputs

- `modal-mass-table`: The effective modal mass and cumulative participation per direction for each mode
- `mode-count-decision`: The number of modes needed to reach the participation threshold, with any residual-mass correction

## Process

1. Compute the effective modal mass of each mode in each direction. For mode i the effective modal mass is m_eff,i = (phi_i^T*M*r)^2 / (phi_i^T*M*phi_i), where r is the rigid-body influence vector for the direction; with mass-normalized modes the denominator is 1 and the numerator is the squared participation factor. This quantifies how much of the total mass each mode mobilizes in a base excitation.
2. Sum the effective modal masses and compare to the total mass. The effective modal masses in a direction sum to the total mass of the structure when all modes are included; the cumulative sum as a fraction of total mass tells you how much of the response the retained modes capture in that direction.
3. Apply the 90 percent participation rule. Retain enough modes that the cumulative effective modal mass reaches at least 90 percent of the total mass in each excited direction, a common seismic and base-excitation requirement; some demanding applications require 95 percent. A direction that falls short needs more modes extracted.
4. Watch for directions dominated by high-frequency or local modes. A stiff direction may reach the participation threshold only with many modes, or its mass may hide in a local mode; check all three translational and, where relevant, rotational directions, because a design can meet the threshold in one direction and badly miss in another.
5. Add a residual or missing-mass correction when truncation leaves mass unaccounted. When extracting all needed modes is impractical, add a static correction (a pseudo-mode) that lumps the quasi-static response of the omitted high-frequency modes, so the total response does not lose the stiffness contribution of the modes above the extracted band.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
