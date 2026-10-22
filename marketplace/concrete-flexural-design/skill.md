# Concrete Flexural Design

Size reinforcement for flexural members using ultimate strength design with Whitney stress block.

## Inputs

- `critical-sections`: Factored moment, axial force at each section
- `structural-layout`: Member dimensions and material properties

## Outputs

- `flexural-reinforcement`: Required reinforcement area and layout at each critical section, with capacity check
- `ductility-verification`: Neutral axis depth ratio (c/d) and strain in tension steel confirming ductile behavior

## Process

1. Set material properties. f'c typically 28 to 55 MPa for normal construction. fy = 420 MPa (Grade 60) or 500 MPa (Eurocode). Effective depth d = h minus cover minus stirrup diameter minus half bar diameter.
2. Calculate required reinforcement from Mu. Using Whitney stress block: a = d - sqrt(d^2 - 2*Mu/(phi*0.85*f'c*b)), where phi = 0.9 for tension-controlled. Required As = 0.85*f'c*b*a/fy. Alternatively, use the resistance coefficient: Rn = Mu/(phi*b*d^2), then rho = (0.85*f'c/fy)*(1 - sqrt(1 - 2*Rn/(0.85*f'c))).
3. Check ductility. Verify c/d < 0.375 for tension-controlled behavior (epsilon_t > 0.005). If compression-controlled, increase section size or add compression steel. Check minimum reinforcement: As_min = max(3*sqrt(f'c)/fy * b*d, 200/fy * b*d) per ACI.
4. For doubly-reinforced sections: calculate moment capacity of tension steel alone. If insufficient, add compression steel. Compression steel contribution: As' = (Mu - phi*Mn_single)/(phi*fy*(d-d')). Verify compression steel yields: check strain compatibility at compression steel location.
5. Detail the reinforcement. Bar spacing must accommodate concrete placement (minimum clear spacing = max of bar diameter, 25 mm, 4/3 * aggregate size). Development length from ACI 318 Chapter 25. Curtailment: extend bars past theoretical cutoff by d or 12db. Lap splices in low-stress zones only.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
