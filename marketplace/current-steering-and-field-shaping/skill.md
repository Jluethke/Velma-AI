# Current Steering And Field Shaping

Design multi-contact current steering strategies to shape the stimulation field for spatial selectivity, using simultaneous multi-electrode activation.

## Inputs

- `stimulation-parameters`: Waveform and amplitude specifications
- `electrode-design`: Multi-contact electrode geometry and impedance per contact

## Outputs

- `current-steering-configuration`: Current allocation across contacts (percentage per contact, polarity), steering resolution, and estimated volume of tissue activated
- `field-model`: Finite element model of the electric field distribution in tissue, showing isopotential contours and activation volume for each steering configuration

## Process

1. Map the target neural structure and the structures to avoid. For DBS in the subthalamic nucleus: target the dorsolateral motor territory (approximately 3x4 mm), avoid the ventral limbic territory (mood side effects) and the medial internal capsule (muscle contractions). The electrode is a cylindrical lead with 4-8 contacts spaced 0.5-1.5 mm apart (Medtronic 3389, Boston Scientific Vercise).
2. Implement current steering using multiple independent current sources (one per contact). Divide current across contacts to steer the activation volume. For directional leads (Boston Scientific, Abbott) with segmented contacts (3 segments per row, 120 degrees each), allocate current to one segment to steer the field laterally by approximately 1 mm. For ring contacts, vertical steering between adjacent rings shifts the field up/down along the lead axis in 0.5 mm steps.
3. Build a finite element model of the electrode in tissue. Tissue conductivity: gray matter 0.2 S/m, white matter 0.1 S/m (anisotropic along fiber direction), CSF 1.8 S/m, electrode-tissue interface impedance from electrode material. Apply stimulation current boundary conditions. Solve for the potential field. Estimate the volume of tissue activated (VTA) using an activation threshold of 0.2 V/mm for 90 us pulses (or couple to axon models for precise prediction using the activating function: second spatial derivative of the potential along the axon).
4. Optimize current allocation to maximize target coverage while minimizing side-effect region activation. This is a constrained optimization: maximize VTA overlap with target region, subject to total current within safety limits and each contact within its charge density limit. In practice, clinicians step through discrete configurations during programming sessions, adjusting by 10-20% current shifts between contacts and evaluating symptom response and side effects.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
