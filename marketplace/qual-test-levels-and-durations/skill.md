# Qual Test Levels And Durations

Set the qualification environments, levels, and durations with the correct margin above the acceptance and service conditions.

## Inputs

- `verification-matrix`: The requirements assigned to test and the environments they must be qualified to
- `service-environment`: The service load, vibration, thermal, shock, and life environments the product must survive

## Outputs

- `test-levels`: The qualification level and duration for each environment, with the margin above service and above acceptance stated
- `environment-sequence`: The order of environmental exposures and whether they are applied separately or combined, with the rationale

## Process

1. Set qualification levels above acceptance, which sits above service. Qualification demonstrates margin, so it runs hotter, harder, and longer than the product will ever see; acceptance screening runs between service and qualification to catch workmanship defects without consuming life. State the three levels (service, acceptance, qualification) for each environment so the margins are visible.
2. Apply established margins per environment. Typical practice adds a vibration qualification margin of a few dB above acceptance (for example acceptance at the service spectrum, qualification 3 to 6 dB higher), a thermal margin of 10 to 20 C beyond the operating extremes, and a shock margin above the worst-case service shock. Use the governing standard's margins where one applies.
3. Set test duration from life and acceleration. Vibration duration is set to accumulate the required fatigue dose (often expressed in minutes per axis that represent the service life, sometimes accelerated by raising level and shortening time per an equivalence rule); thermal cycling is set to a cycle count that represents the service life with margin. State the life basis behind each duration.
4. Decide separate versus combined environments. Real service often applies vibration, thermal, and load together; a combined-environment test is more representative but harder and costlier. Decide per requirement whether sequential single-environment tests suffice or whether a combined test is needed to expose interaction effects, and justify the choice.
5. Order the sequence to be representative and to stress interfaces. A common sequence runs functional, then thermal cycling, then random vibration, then shock, with functional checks between each, so a degradation introduced by one environment is caught before the next. Put the environment most likely to expose a weakness where its effect will be seen.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
