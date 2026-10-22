# Display Optical Stack Design

Design the optical layers of the display: backlight or emission layer, color filter, polarizer, and enhancement films for LCD; or emission stack and encapsulation for OLED.

## Inputs

- `technology-selection`: Display type and pixel architecture
- `performance-specification`: Target brightness, contrast, gamut, viewing angle

## Outputs

- `optical-stack-design`: Layer-by-layer specification: for LCD (backlight: LED type, light guide, diffuser, prism sheets, DBEF, polarizer, LC cell, color filter, cover glass); for OLED (substrate, TFT, OLED stack: HIL/HTL/EML/ETL/EIL, cathode, thin-film encapsulation, cover)
- `optical-performance`: Luminance uniformity, angular luminance distribution, spectral output, power efficiency (lumens per watt of electrical input)

## Process

1. For LCD backlight: edge-lit (LEDs along one or more edges of a light guide plate) for slim form factor. Direct-lit (LED array behind the panel) for local dimming with high dynamic range. Mini-LED backlight: thousands of small (100-200um) LEDs for fine-grained local dimming (1000+ dimming zones) to approach OLED-like contrast.
2. Backlight optical films: diffuser (homogenizes the light from the light guide), BEF (brightness enhancement film: prismatic sheet that recycles off-axis light, increasing on-axis brightness by 1.5-1.8x), DBEF (dual brightness enhancement film: reflects one polarization back for recycling, increasing polarized output by 1.3-1.5x). Total backlight efficiency from LED to panel: 5-8% of electrical power becomes screen luminance.
3. For OLED emission stack: the organic layers are deposited by vacuum thermal evaporation (small molecule) or inkjet printing (polymer). Stack order: anode (ITO) / HIL (hole injection) / HTL (hole transport) / EML (emissive layer: host + dopant) / ETL (electron transport) / EIL (electron injection) / cathode (thin metal or transparent). For white OLED (WOLED) in large panels: stack blue + yellow-green emitters, use color filter array for RGB subpixels.
4. OLED encapsulation: organic materials degrade in the presence of moisture and oxygen. Thin-film encapsulation (TFE): alternating layers of inorganic (Al2O3, SiNx by ALD or PECVD) and organic (polymer by inkjet). WVTR (water vapor transmission rate) target: < 1e-6 g/m^2/day. Edge seal with desiccant for additional moisture protection.
5. For micro-LED: each pixel is an individual LED chip (InGaN for blue/green, AlInGaP for red). Mass transfer from epitaxial wafer to display backplane is the key manufacturing challenge. Approaches: pick-and-place (slow but proven for large pixels), stamp transfer (elastomer stamp picks up arrays), laser lift-off + fluidic self-assembly. Defect management: redundant sub-pixels or post-transfer repair by laser.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
