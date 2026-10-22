# Concrete Shear And Torsion Design

Design shear reinforcement and check torsion resistance using strut-and-tie where applicable.

## Inputs

- `critical-sections`: Factored shear and torsion at critical sections
- `flexural-reinforcement`: Longitudinal reinforcement layout already determined

## Outputs

- `shear-reinforcement`: Stirrup size, spacing, and extent for each member
- `torsion-reinforcement`: Closed stirrups and additional longitudinal steel for members subject to torsion

## Process

1. Calculate concrete shear contribution Vc. ACI simplified: Vc = 2*sqrt(f'c)*b*d (in psi units) or 0.17*sqrt(f'c)*b*d (in MPa). Detailed formula accounts for longitudinal reinforcement ratio and Mu/Vu*d ratio. For members with axial compression, Vc increases; with tension, Vc decreases.
2. Check if shear reinforcement is required: Vu > phi*Vc/2. If Vu > phi*Vc, provide stirrups. Required Vs = Vu/phi - Vc. Stirrup spacing: s = Av*fy*d/Vs. Maximum spacing: d/2 when Vs < 4*sqrt(f'c)*b*d, d/4 when Vs exceeds that. Verify Vs < 8*sqrt(f'c)*b*d (upper limit; if exceeded, increase section size).
3. For torsion: check if Tu > phi*Tcr/4, where Tcr = 4*sqrt(f'c)*(Acp^2/pcp). If Tu > phi*Tcr, provide closed stirrups. Required At/s = Tu*tan(theta)/(phi*2*Ao*fy), where Ao = 0.85*Aoh. Additional longitudinal steel: Al = At/s * ph * cot^2(theta). Theta typically 45 degrees.
4. For deep beams (clear span / depth < 4): strut-and-tie model. Define nodes at load and support points. Define struts (compression) and ties (tension). Check strut capacity: fcu = 0.85*beta_s*f'c (beta_s = 0.75 for bottle-shaped struts with reinforcement, 0.60 without). Check node bearing stress. Design tie reinforcement.
5. Detail stirrups. Hook details: 135-degree hooks for closed stirrups (seismic) or 90-degree plus 6db extension. Extend stirrups through full member depth. In beam-column joints for seismic frames: joint shear check per ACI 352, transverse reinforcement within the joint.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
