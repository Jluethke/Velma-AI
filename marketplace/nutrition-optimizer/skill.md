# Nutrition Optimizer

Calculates personalized caloric and macronutrient targets using the Mifflin-St Jeor equation, designs meal plans matching dietary preferences and restrictions, tracks actual intake against targets, and adjusts plans based on measured weight trends and performance feedback.

## Execution Pattern: Phase Pipeline

## Inputs
- goals: string -- Primary goal: "cut" (fat loss), "bulk" (muscle gain), "maintain" (body recomposition), "performance" (fuel training)
- current_diet: object -- Description of current eating patterns, typical meals, eating schedule
- restrictions: array -- Allergies, intolerances, ethical restrictions (vegan, halal, kosher), medical (diabetes, celiac)
- preferences: object -- Liked/disliked foods, cuisine preferences, cooking skill level, meal prep willingness, budget
- body_stats: object -- Age, sex, height, weight, body fat % (if known), waist measurement
- activity_level: string -- Sedentary, lightly active (1-3 days exercise/week), moderately active (3-5 days), very active (6-7 days), extremely active (2x/day or physical job + training)

## Outputs
- caloric_targets: object -- Daily calorie target with BMR breakdown, TDEE calculation, and deficit/surplus applied
- macro_split: object -- Protein, carbohydrate, fat targets in grams and percentages with rationale
- meal_plan: array -- Daily meal plan with recipes, macro breakdown per meal, prep instructions
- tracking_report: object -- Intake vs targets comparison with adherence metrics
- adjustment_plan: object -- Modified targets based on actual results (weight trend, energy, performance)

## Execution

### Phase 1: ASSESS -- Calculate Baseline Requirements
**Entry criteria:** Body stats and activity level provided.
**Actions:**
1. Calculate Basal Metabolic Rate using Mifflin-St Jeor equation:
   - **Males:** BMR = (10 x weight in kg) + (6.25 x height in cm) - (5 x age) + 5
   - **Females:** BMR = (10 x weight in kg) + (6.25 x height in cm) - (5 x age) - 161
2. Apply activity multiplier to get Total Daily Energy Expenditure (TDEE):
   - Sedentary: BMR x 1.2
   - Lightly active: BMR x 1.375
   - Moderately active: BMR x 1.55
   - Very active: BMR x 1.725
   - Extremely active: BMR x 1.9
3. Apply goal-based adjustment:
   - **Cut:** TDEE - 300 to 500 cal/day (0.5-1 lb/week loss). Never below BMR x 1.2.
   - **Bulk:** TDEE + 250 to 500 cal/day (0.5-1 lb/month lean gain for intermediates).
   - **Maintain:** TDEE (body recomp with training stimulus).
   - **Performance:** TDEE + 100 to 200 (slight surplus to fuel recovery without excess fat gain).
4. Validate: if calculated intake is below 1200 cal (women) or 1500 cal (men), flag as potentially unsafe and recommend a smaller deficit or medical supervision.

**Output:** BMR, TDEE, adjusted daily calorie target with all calculations shown.
**Quality gate:** All unit conversions are correct. Activity multiplier matches described activity level. Calorie target is within safe ranges.

### Phase 2: CALCULATE -- Determine Macronutrient Split
**Entry criteria:** Daily calorie target calculated.
**Actions:**
1. Set protein target (most important macro for body composition):
   - **Cut:** 1.0-1.2g per pound of body weight (preserves muscle in deficit)
   - **Bulk:** 0.8-1.0g per pound of body weight
   - **Maintain:** 0.8-1.0g per pound of body weight
   - **Performance:** 0.7-1.0g per pound, adjusted by sport type
   - Protein = 4 calories per gram
2. Set fat target (essential for hormones, satiety, nutrient absorption):
   - Minimum: 0.3g per pound of body weight (never go below this)
   - Standard: 25-35% of total calories
   - Fat = 9 calories per gram
3. Set carbohydrate target (remaining calories):
   - Carbs = (Total calories - protein calories - fat calories) / 4
   - Carbs = 4 calories per gram
   - Minimum: 100g/day for brain function and training performance
4. Adjust for restrictions:
   - Keto: fat 60-75%, protein 20-25%, carbs 5-10% (<50g/day)
   - Low-fat: fat 15-20%, increase carbs proportionally
   - High-carb (endurance athletes): carbs 55-65%
5. Calculate per-meal distribution:
   - 3-meal split: distribute evenly or front-load protein at breakfast
   - 4-5 meal split: spread protein across all meals (maximize muscle protein synthesis -- 25-40g per meal)
   - Pre/post workout: carbs + protein around training for performance

**Output:** Macro targets in grams and percentages, per-meal distribution, pre/post workout nutrition.
**Quality gate:** Protein + fat + carb calories sum to total calorie target (within 10 cal rounding). No macro falls below minimum thresholds. Ratios match the stated goal.

### Phase 3: PLAN -- Build Meal Plan
**Entry criteria:** Macro targets and restrictions defined.
**Actions:**
1. Design daily meal templates matching macro targets:
   - Each meal: protein source + carb source + fat source + vegetables
   - Hit protein target first (hardest macro for most people)
   - Distribute carbs around training (more pre/post workout, less at other meals if cutting)
2. Select specific foods respecting restrictions and preferences:
   - Build a "protein menu" of 8-10 options the user likes
   - Build a "carb menu" of 8-10 options
   - Build a "fat menu" of 5-8 options
   - Build a "vegetable menu" of 8-10 options
3. Create 3-5 sample day plans with specific meals:
   - Each meal: ingredients, approximate portions, macro breakdown
   - Daily total matches targets within +/- 50 calories
   - Variety across days (don't repeat the same meal plan daily)
4. Include practical guidance:
   - Meal prep strategy (what can be batch-cooked on Sunday)
   - Restaurant/eating out adjustments
   - Quick options for busy days (under 10 min prep)
   - Snack options that fit macros
5. Provide a "flexible dieting" framework: how to swap foods while maintaining macro targets (protein equivalents, carb equivalents, etc.)

**Output:** 3-5 sample day meal plans with per-meal macros, protein/carb/fat menus for flexible swapping, meal prep guide.
**Quality gate:** Every sample day hits macro targets within +/-5%. All restrictions are respected. At least one quick-prep option exists for every meal slot.

### Phase 4: TRACK -- Monitor Intake and Progress
**Entry criteria:** User has been following the plan and logging data.
**Actions:**
1. Compare logged intake against targets:
   - Daily average calories vs target (7-day rolling average to smooth daily variance)
   - Macro compliance: are protein/carb/fat within +/-10% of targets?
   - Adherence rate: how many of the last 14 days were on-plan?
2. Track weight trend:
   - Use 7-day moving average (daily weight fluctuates 1-3 lbs from water, sodium, glycogen)
   - Calculate weekly rate of change from the moving average
   - Compare actual rate against expected rate:
     - 500 cal deficit should produce ~1 lb/week loss
     - If actual differs from expected, the calorie target may be wrong
3. Track subjective metrics:
   - Energy level (1-5 daily rating)
   - Training performance (are lifts going up, staying, or declining?)
   - Hunger level (1-5 scale, sustained >4 suggests deficit is too aggressive)
   - Sleep quality (1-5 scale, poor sleep impairs fat loss and muscle gain)
4. Flag issues:
   - Weight loss >2 lbs/week (too aggressive, likely losing muscle)
   - Weight gain >1 lb/week on a bulk (likely excessive fat gain)
   - Protein consistently under target (priority issue for body composition)
   - Energy/performance declining (may need to increase calories or add a diet break)

**Output:** Tracking report: intake vs targets, weight trend analysis, subjective metric trends, flagged issues.
**Quality gate:** At least 7 days of data before generating a report. Weight trend uses moving average, not single-day readings. Flags are specific and actionable.

### Phase 5: ADJUST -- Modify Plan Based on Results
**Entry criteria:** At least 2 weeks of tracking data with weight trend.
**Actions:**
1. If weight is not changing as expected:
   - **Losing too fast (>2 lbs/week on a cut):** Increase calories by 200/day. Risk of muscle loss.
   - **Not losing (on a cut):** Verify tracking accuracy first. If accurate, reduce by 100-200 cal/day (from carbs or fat, not protein).
   - **Gaining too fast (>1 lb/week on a bulk):** Reduce surplus by 150-200 cal/day.
   - **Not gaining (on a bulk):** Increase by 200-300 cal/day (from carbs primarily).
2. If energy or performance is declining:
   - Consider a "diet break" -- 1-2 weeks at maintenance calories to restore metabolic rate and hormones.
   - Increase carbs around training even if overall calories stay the same.
   - Check sleep and stress -- these impact hormones more than food sometimes.
3. If adherence is below 70%:
   - The plan is too restrictive. Increase flexibility.
   - Add more preferred foods. Fit treats into macros ("if it fits your macros" approach).
   - Reduce the number of meals if meal prep is the bottleneck.
   - Consider a less aggressive deficit/surplus (smaller gap = easier adherence = better results over time).
4. Update calorie and macro targets based on new weight (recalculate BMR with current weight every 4-6 weeks).

**Output:** Adjusted targets with rationale, updated meal plan if needed, specific recommendations for improving adherence.
**Quality gate:** Adjustments are based on 2+ weeks of data, not single-day fluctuations. Changes are incremental (100-300 cal adjustments, not dramatic shifts). Protein target is never reduced.

## Exit Criteria
The skill completes one cycle when adjusted targets and an updated plan are delivered. The pipeline restarts when new tracking data is available or goals change. Long-term exit: user reaches and sustains goal weight/body composition for 4+ weeks at maintenance calories.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| ASSESS | Body stats missing or obviously wrong | Abort -- request accurate stats (height, weight, age, sex are mandatory) |
| ASSESS | Calculated calories unreasonably low (<1200) | Escalate -- recommend medical supervision for very low calorie diets |
| CALCULATE | Restrictions eliminate entire macro sources (e.g., vegan + nut allergy + soy allergy = limited protein) | Adjust -- build a specialized protein menu from remaining sources, flag that supplementation may be needed |
| PLAN | User dislikes all suggested foods | Adjust -- request a list of acceptable foods and build plan from those |
| TRACK | Insufficient tracking data (<7 days) | Skip adjustment phase -- request more data before making changes |
| ADJUST | Weight loss has stalled for 3+ weeks despite verified deficit | Adjust -- implement 2-week diet break at maintenance, then resume deficit |
| ADJUST | User rejects final output | **Targeted revision** -- ask which meal plan, macro target, or food substitution fell short and rerun only that section. Do not regenerate the full nutrition plan. |

## Reference

### Mifflin-St Jeor Equation (1990)
The most accurate predictive equation for BMR in non-obese individuals (within +/- 10% for most people):
- Males: BMR = (10 x weight_kg) + (6.25 x height_cm) - (5 x age_years) + 5
- Females: BMR = (10 x weight_kg) + (6.25 x height_cm) - (5 x age_years) - 161

Unit conversions: 1 lb = 0.4536 kg, 1 inch = 2.54 cm.

### Macronutrient Calorie Values
- Protein: 4 calories per gram
- Carbohydrate: 4 calories per gram
- Fat: 9 calories per gram
- Alcohol: 7 calories per gram (no nutritional value)

### Protein Requirements by Goal
| Goal | Protein (g/lb body weight) | Rationale |
|---|---|---|
| Fat loss | 1.0-1.2 | Preserves lean mass in deficit, increases satiety |
| Muscle gain | 0.8-1.0 | Sufficient for MPS with adequate surplus |
| Maintenance | 0.8-1.0 | General health and body composition |
| Endurance athlete | 0.6-0.8 | Lower muscle damage, higher carb needs |

### Muscle Protein Synthesis (MPS)
- MPS is maximally stimulated by 25-40g of high-quality protein per meal.
- Distributing protein across 3-5 meals is superior to consuming it in 1-2 meals.
- Leucine is the primary amino acid trigger for MPS. Minimum ~2.5g leucine per meal. Sources: whey, eggs, chicken, beef are leucine-rich.
- Post-workout protein timing matters less than daily total, but consuming protein within 2 hours post-training is reasonable practice.

### Rate of Weight Change Guidelines
| Goal | Rate | Notes |
|---|---|---|
| Fat loss (preserve muscle) | 0.5-1% body weight/week | Slower for leaner individuals |
| Lean bulk | 0.5-1 lb/month (intermediate) | Faster for beginners (up to 2 lb/month) |
| Maintenance | +/- 1 lb/week (water fluctuation) | Judge by 2-week trend, not daily |

### Diet Break Protocol
After 8-12 weeks of sustained deficit:
- Return to maintenance calories for 1-2 weeks
- Increase carbs specifically (restores leptin, glycogen, training performance)
- Maintain protein target
- Psychological reset: reduces diet fatigue and binge risk
- Resume deficit after break -- rate of loss often improves

### Common Tracking Errors
1. Not counting cooking oils (1 tbsp = 120 cal)
2. Underestimating portion sizes (use a food scale for the first 2 weeks)
3. Not counting liquid calories (coffee drinks, juice, alcohol)
4. "Clean eating" fallacy: food quality matters for health, but calories determine weight change
5. Weekend overconsumption: 5 perfect weekdays + 2 high-calorie weekends = no deficit

### State Persistence
Tracks over time:
- Daily calorie and macro intake logs
- Weight (daily readings, 7-day moving average)
- Body measurements (waist, optional: chest, arms, legs -- monthly)
- Energy and performance ratings
- Adherence rate per week
- Calorie adjustments history and their impact
