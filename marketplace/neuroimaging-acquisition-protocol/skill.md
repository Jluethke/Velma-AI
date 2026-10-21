# Neuroimaging Acquisition Protocol

Specify the neuroimaging acquisition: modality (fMRI, EEG, or both), sequence parameters, electrode layout, session structure, and quality assurance checks.

## Inputs

- `paradigm-spec`: Task timing and session length
- `roi-list`: Regions that determine spatial resolution and coverage needs

## Outputs

- `acquisition-protocol`: Sequence parameters (TR, TE, voxel size, slices) or EEG montage and sampling rate
- `session-structure`: Order of runs, rest periods, anatomical scans, and total time
- `qa-checklist`: Pre-scan checks (coil, motion straps, impedances) and real-time quality monitors

## Process

1. Choose imaging modality and justify based on temporal vs spatial resolution needs
2. Set acquisition parameters to cover ROIs at required resolution
3. Structure the session with task runs, rest, and anatomical acquisitions
4. Define real-time QA checks (motion, signal dropout, impedance)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
