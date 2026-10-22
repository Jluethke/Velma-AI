# Display Technology Selection

Select the display technology and pixel architecture based on the application requirements: size, resolution, brightness, contrast, viewing angle, power, lifetime, and cost.

## Inputs

- `display-requirements`: Diagonal size, resolution (PPI), peak brightness (nits), contrast ratio, color gamut, viewing angle, refresh rate, response time, power budget, operating temperature range, lifetime (hours to half-brightness)
- `application-context`: Use case (smartphone, TV, automotive HUD, VR/AR headset, signage, avionics), ambient light conditions, user distance, form factor constraints

## Outputs

- `technology-selection`: Display type (IPS-LCD, VA-LCD, AMOLED, micro-LED, LCoS, DLP), pixel structure (RGB stripe, PenTile, white OLED + CF), subpixel rendering if applicable
- `performance-specification`: Achievable brightness, contrast (static and dynamic), color gamut coverage (% sRGB, DCI-P3, BT.2020), response time (GtG), power consumption estimate, expected lifetime

## Process

1. For high contrast in dark environments (home theater, mobile): OLED or micro-LED. OLED contrast ratio is theoretically infinite (pixel off = 0 nits). OLED lifetime concern: blue emitter degradation limits lifetime to 30k-100k hours depending on brightness. Micro-LED eliminates the organic degradation but mass transfer yield is the manufacturing bottleneck.
2. For high brightness in ambient light (outdoor signage, automotive): LCD with high-brightness backlight (1000-3000 nits achievable), or micro-LED (can exceed 5000 nits). OLED peak brightness is limited by thermal and lifetime constraints (1000-1500 nits peak for HDR, 200-400 nits sustained for full-screen white).
3. LCD sub-types: IPS (In-Plane Switching): wide viewing angle (178 degrees), moderate contrast (1000:1 to 1500:1), good color accuracy. VA (Vertical Alignment): high native contrast (3000:1 to 6000:1), narrower viewing angle (shifts in gamma at off-axis), good for TVs. TN (Twisted Nematic): fastest response time (1ms GtG), lowest cost, but poor viewing angle and color. Use for gaming monitors where speed matters most.
4. For VR/AR headsets: high PPI (> 1000 PPI to avoid screen-door effect at close eye distance), low persistence (< 3ms illumination per frame to reduce motion blur), high refresh rate (90-120 Hz). Micro-OLED on Si backplane achieves > 3000 PPI. LCoS (liquid crystal on silicon) for AR waveguide coupling. Micro-LED for brightness in see-through AR.
5. Color gamut: sRGB = 72% of NTSC, covers standard web/photo content. DCI-P3 = 126% of sRGB, the cinema standard, now targeted by premium displays. BT.2020 = 152% of sRGB, the HDR/UHD standard, not fully achievable by current single-emitter technologies. Quantum dot enhancement (QD-LCD or QD-OLED) narrows the emission peaks to expand the gamut toward BT.2020.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
