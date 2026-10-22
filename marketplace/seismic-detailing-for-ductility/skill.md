# Seismic Detailing For Ductility

Detail structural members to achieve the ductility capacity assumed by the R factor in design.

## Inputs

- `seismic-forces`: Design forces from seismic analysis
- `lateral-system`: LFRS type and R factor

## Outputs

- `seismic-detailing`: Connection details, confinement reinforcement, capacity-protected elements, and plastic hinge regions
- `capacity-design-checks`: Verification of strong-column/weak-beam, overstrength at connections, and non-ductile failure prevention

## Process

1. Apply capacity design philosophy. Identify intended plastic hinge locations (beam ends in moment frames, link beams in EBF, wall base). Design these locations for the code-required ductility. Design all other elements (columns, connections, foundations) for the overstrength capacity of the plastic hinges, not the code design forces.
2. For RC special moment frames: strong column / weak beam requirement (sum of Mnc >= 1.2 * sum of Mnb at each joint). Confine plastic hinge regions in beams: hoops at s = min(d/4, 6db, 150 mm) over 2h from face of column. Confine columns: spiral or hoops over lo = max(h, L/6, 450 mm) from each end, with Ash calculated to maintain axial capacity after cover spalling. Joint shear: Vn = gamma*sqrt(f'c)*Aj where gamma depends on confinement.
3. For steel special moment frames: prequalified connections (per AISC 358) that can develop 0.04 radian plastic rotation. Reduced beam section (RBS, 'dogbone') is most common. Panel zone design: allow limited yielding in panel zone but avoid excessive deformation. Lateral bracing of beam flanges at plastic hinge locations. Column splices: full penetration welds or slip-critical bolted, located away from potential plastic hinges.
4. For RC special shear walls: boundary elements where maximum compressive strain exceeds 0.003 (check neutral axis depth at Mn). Confine boundary elements over depth of neutral axis and extend vertically above and below the critical section. Shear design: Vn = Acv*(alpha_c*sqrt(f'c) + rho_t*fy), where alpha_c = 3 for hw/lw >= 2.0, 2 for hw/lw <= 1.5. Web reinforcement in two directions, minimum rho = 0.0025.
5. For steel braced frames: ensure brace connections can develop expected brace capacity (Ry*Fy*Ag in tension, 1.14*Fy*Ag for overstrength). Gusset plate design: Whitmore section for tension, Thornton method for compression (buckling of gusset). Balanced design: columns designed for mechanism-level forces. For BRB (buckling-restrained brace): verify qualification testing per AISC 341 (2% story drift, cumulative ductility 200).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
