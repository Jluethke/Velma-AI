# Hardware Timer PWM Setup

**One-line description:** Computes timer prescaler, auto-reload and compare values for a target PWM frequency from the real timer kernel clock, configures preload and output enable bits (including the main output enable on advanced timers), and measures frequency and duty with a logic analyzer, with any actuator load tested only on a bench behind an independent hardware emergency stop.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `elf_path` (string, required): Firmware image with the timer code.
- `reference_manual` (string, required): MCU reference manual (clock tree and timer chapters).
- `pwm_frequency_hz` (number, required): Target PWM frequency from the load's datasheet (motor driver, LED driver, servo spec).
- `drives_actuator` (boolean, required): True when the PWM output drives a motor, valve, heater, steering, brake or other actuator.

---

## Outputs

- `pwm_record` (object): Timer clock, PSC, ARR, CCR values, computed and measured frequency, duty cycle steps, and the bench safety setup when an actuator is connected.

---

## Phase 1: Find the Timer Clock and Compute Values

### Entry Criteria
- Timer instance and channel chosen and present in the pin map.

### Actions
1. Read the timer kernel clock from the clock tree. On STM32 parts, the reference manual states that when an APB prescaler is not 1, the timers on that bus run at twice the APB clock; confirm the rule for your part in the RCC chapter. Record the value.
2. For an up-counting edge-aligned timer, frequency = f_tim / ((PSC + 1) x (ARR + 1)); duty = CCR / (ARR + 1) in PWM mode 1. Read the timer chapter to confirm for your part (center-aligned mode halves the frequency).
3. Choose PSC as small as possible so ARR is as large as the counter width allows (16-bit counters: ARR at most 0xFFFF; some timers are 32-bit). Duty resolution is ARR + 1 steps.
4. If no integer pair gives the exact frequency, record the nearest achievable value and the error, and ask whether the load tolerates it. Do not round silently.

### Output
f_tim, PSC, ARR, resolution.

### Quality Gate
- f_tim cites the clock tree figure.
- Computed frequency from the chosen PSC and ARR is shown as arithmetic.

---

## Phase 2: Configure the Channel

### Entry Criteria
- Values computed.

### Actions
1. Set the channel output compare mode to PWM mode 1 (`OCxM` field per the timer chapter), enable output compare preload (`OCxPE`) and auto-reload preload (`ARPE`), so new values take effect at the update event without glitches.
2. Generate an update event (`UG` bit in `EGR`) once after setting PSC and ARR so the shadow registers load.
3. Enable the channel output (`CCxE`). On advanced-control timers (for example STM32 TIM1, TIM8), also set the main output enable (`MOE` in `BDTR`); without it the pin stays idle.
4. Start with CCR = 0 (output off) when `drives_actuator` is true.
5. Set the GPIO pin to the timer's alternate function only after the timer is configured; the board must hold the pin at the off level with a pull resistor before that.

### Output
Configured timer.

### Quality Gate
- Register read-back in GDB (`p/x TIM1->CR1`, `CCMR1`, `CCER`, `BDTR`) shows the bits listed above; values recorded.

---

## Phase 3: Measure, Then Connect a Load

### Entry Criteria
- Measurement without a load first: pin connected only to the analyzer or oscilloscope.
- If `drives_actuator` is true, for the loaded test: bench or closed course only; an independent hardware emergency stop that removes power from the actuator driver is wired and tested by pressing it once before the test; the mechanism is secured so motion cannot harm anyone. Braking and emergency-stop paths are never gated, delayed or blocked by this firmware.

### Actions
1. Capture the pin: `sigrok-cli -d <driver> --config samplerate=<rate> --samples <count> -C D0 -o pwm.sr`, then `sigrok-cli -i pwm.sr -P pwm:data=D0` (check `sigrok-cli -P pwm --show`). Read frequency and duty.
2. Step duty through 0%, 25%, 50%, 75%, 100% (CCR = 0, (ARR+1)/4, ...) and record measured duty for each.
3. With an actuator: connect through its driver, start at CCR = 0, raise in small steps chosen by the operator, keep a hand on the emergency stop. The timer break input (BKIN on STM32 advanced timers) can force outputs to a safe state in hardware; it is an additional path, never a replacement for the independent emergency stop.

### Output
`pwm_record`.

### Quality Gate
- Measured frequency and each measured duty step are recorded from decoder output.
- When `drives_actuator` is true, the record contains the emergency stop press test result taken before the loaded run.

---

## Worked Example

Illustrative. STM32F411 TIM3 CH1, APB1 prescaler 2, HCLK 100 MHz, `pwm_frequency_hz` = 20000, LED driver load (`drives_actuator` false).

- Phase 1: APB1 = 50 MHz, prescaler not 1, so f_tim = 100 MHz. PSC = 0, ARR = 4999: 100 MHz / (1 x 5000) = 20 kHz exactly; 5000 duty steps.
- Phase 2: GDB shows `CCMR1 = 0x68` (OC1M = 110, OC1PE = 1), `CR1 = 0x81` (ARPE, CEN), `CCER = 0x1`.
- Phase 3: decoder reports 20.00 kHz; duty steps 0.0, 25.0, 50.0, 75.0, 100.0%.

---

## Exit Criteria

DONE when the measured frequency and duty steps match the computed values, and any actuator test ran on a bench behind a tested independent hardware emergency stop.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Measured frequency is exactly double or half | **Adjust**: recheck the APB timer clock rule and center-aligned mode. |
| Phase 2 | Pin stays idle on TIM1/TIM8 | **Adjust**: set `MOE` in `BDTR`. |
| Phase 3 | Emergency stop not wired or fails its press test | **Stop**: no loaded test until it removes driver power. |
| Phase 3 | Output glitches when duty changes | **Adjust**: enable `OCxPE` and `ARPE`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
