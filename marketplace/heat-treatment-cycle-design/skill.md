# Heat Treatment Cycle Design

Define the complete heat treatment cycle including heating rate, austenitizing/solutioning parameters, quench method, and tempering/aging conditions.

## Inputs

- `transformation-path`: Required temperatures, times, and cooling rates from the phase transformation analysis
- `alloy-specification`: Alloy grade and component geometry for thermal uniformity analysis

## Outputs

- `heat-treatment-cycle`: Complete cycle specification: heating rate, soak temperature and time, quench medium and agitation, tempering/aging temperature and time, cooling method after temper
- `furnace-requirements`: Furnace type (atmosphere, vacuum, salt bath), temperature uniformity class (AMS 2750), atmosphere specification, and fixturing requirements

## Process

1. Set the heating rate. For carbon and alloy steels, heat slowly enough to avoid thermal gradients that cause distortion or cracking, especially for complex shapes or large sections. Rule of thumb: 1 hour per 25mm of thickness to reach the soak temperature. For sections with large thickness variations, use a step-heating approach (intermediate hold near Ac1 to equalize temperature before rapid heating through the transformation range).
2. Set the soak temperature and time. Austenitizing temperature: typically 30-50C above Ac3 for hypoeutectoid steels (e.g., 845-870C for 4140 steel). Higher temperatures dissolve more carbides and increase hardenability but risk grain growth. Soak time: enough for the entire cross-section to reach temperature and for carbides to dissolve. Minimum 30 minutes per 25mm of section for alloy steels. For solution treatment of aluminum, the temperature must be held within 5C of the target to avoid incipient melting.
3. Select the quench medium. Severity ranking: brine > water > polymer > oil > forced air > still air. Harder quench gives higher hardness but higher distortion and cracking risk. For high-alloy steels (4340, H13), oil or polymer quench is sufficient due to high hardenability. For low-alloy steels (1040, 1045), water quench may be required but carries cracking risk for complex shapes. Martempering (quench to just above Ms, equalize, then air cool) reduces distortion while still producing martensite.
4. Set the tempering/aging parameters. For steel tempering: the Hollomon-Jaffe parameter (T * (C + log t)) correlates tempering temperature and time to hardness for a given alloy. Typical tempering: 150-200C for high hardness (springs, bearings), 400-650C for toughness (structural components). Avoid the 260-370C tempered martensite embrittlement range for alloy steels. For aluminum aging: e.g., 7075-T6 at 120C for 24 hours (peak aged); 7075-T73 at higher temperature for longer time (overaged for stress corrosion resistance at the cost of some strength).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
