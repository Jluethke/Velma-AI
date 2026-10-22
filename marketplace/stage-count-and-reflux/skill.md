# Stage Count And Reflux

Determine the number of theoretical stages, minimum and operating reflux ratio, and feed stage location.

## Inputs

- `thermodynamic-model`: VLE model with parameters
- `relative-volatility`: Relative volatility vs composition
- `separation-specification`: Feed composition, distillate and bottoms purity targets, feed rate

## Outputs

- `minimum-stages`: Minimum stages at total reflux from Fenske equation
- `minimum-reflux`: Minimum reflux ratio from Underwood equations
- `design-stages`: Number of theoretical stages at operating reflux from Gilliland correlation
- `feed-stage`: Optimal feed stage location from Kirkbride equation

## Process

1. Calculate minimum stages at total reflux using the Fenske equation: N_min = ln[(x_D/(1-x_D)) * ((1-x_B)/x_B)] / ln(alpha_avg). Use geometric mean alpha across the column for alpha_avg.
2. Calculate minimum reflux from the Underwood equations: for each root theta between the relative volatilities, solve sum(alpha_i * z_i / (alpha_i - theta)) = 1-q. Then R_min = sum(alpha_i * x_Di / (alpha_i - theta)) - 1.
3. Set operating reflux at 1.1 to 1.5 times minimum reflux. Higher ratios reduce stages but increase energy cost. Use the Gilliland correlation to estimate actual stages: plot (N-N_min)/(N+1) vs (R-R_min)/(R+1) and read off the design point.
4. Locate the feed stage using the Kirkbride equation: log(N_R/N_S) = 0.206 * log[(B/D) * (x_F_B/x_F_A)^2 * (x_B_A/x_D_B)^2] where N_R is rectifying stages and N_S is stripping stages.
5. For multicomponent systems, use rigorous simulation (MESH equations solved by inside-out or Newton method) to validate the shortcut results. Adjust stages and reflux if the shortcut estimate deviates by more than 10%.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
