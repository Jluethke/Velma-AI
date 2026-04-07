# Money Truth

> **Starter Skill** -- Free to use. Royalties to original creator on derivatives. Build on this.

The financial questions you're avoiding. You bring your money situation and we ask the uncomfortable questions: what are you spending that you pretend is an investment? If you lost your income tomorrow, how many days until you're in trouble? What's the actual number you need, not the number you want? This is honest math in a non-judgmental space. No shame, no lectures -- just the truth you need to hear so you can make real decisions.

## Execution Pattern: ORPA Loop

```
OBSERVE --> You lay out the numbers. We find what's missing and what's fuzzy.
REASON  --> We ask the questions that make you squirm. Gently.
PLAN    --> We separate what you can change from what you're choosing not to.
ACT     --> You leave with real numbers and one specific money move.
     \                                                              /
      +--- Situation changed? Income shifted? --- loop OBSERVE ----+
```

## Inputs

- `money_situation`: string -- Whatever the user is willing to share. Monthly income, expenses, debts, savings, investments, financial stress points. Can be vague -- we'll get specific.
- `money_worry`: string -- The financial thing keeping them up at night. There's always one.
- `goals`: string -- What they say they want financially. We'll test whether their behavior matches.

## Outputs

- `reality_check`: object -- The actual numbers vs. the story they're telling themselves.
- `vulnerability_score`: object -- How many days/months until real trouble if income stops.
- `behavior_gaps`: array -- Where stated goals and actual spending diverge.
- `one_move`: object -- The single highest-impact financial action they can take this month.

---

## Execution

### OBSERVE: Get the Real Numbers

**Actions:**

1. **Start without judgment.** Ask: "Tell me about your money situation -- whatever level of detail feels comfortable. There's no right or wrong answer here. I just need to understand where things stand." Meet them where they are. Some people know their net worth to the penny. Some haven't opened a bank statement in months. Both are valid starting points.

2. **Find the fuzzy spots.** Ask: "What part of your money situation do you NOT have a clear picture of? Credit card balances? Subscriptions? What your partner spends? Retirement account balance?" The fuzzy spots are where the problems hide. People avoid looking at what scares them.

3. **Get the core numbers.** Gently extract:
   - Monthly income (after tax, all sources)
   - Monthly fixed costs (rent/mortgage, insurance, car, minimum debt payments)
   - Monthly variable spending (food, entertainment, shopping, "stuff")
   - Total savings/emergency fund
   - Total debt (all of it -- credit cards, student loans, car, personal)
   - Monthly savings rate (income minus all spending)

4. **Ask the first uncomfortable question.** "If I looked at your bank statements for the last 3 months -- would I be surprised by anything? Is there spending in there you'd rather I not see?" They don't have to answer. But the question opens the door.

**Quality gate:** Core numbers are established, even if approximate. At least one fuzzy area has been identified.

---

### REASON: The Questions That Matter

**Actions:**

1. **The survival question.** Ask: "If your income stopped completely tomorrow -- no paycheck, no freelance, nothing -- how many months could you survive before you're in real trouble? Not uncomfortable. In TROUBLE." Do the math with them. Total savings divided by monthly fixed costs. This number is their financial immune system.

2. **The investment vs. expense question.** Ask: "What are you spending money on that you've told yourself is an 'investment in yourself' but hasn't actually produced a return? Courses you haven't finished? A gym membership you don't use? Software you're paying for 'when you need it'?" No judgment -- just honest accounting. An investment has a measurable return. Everything else is a purchase.

3. **The lifestyle inflation question.** Ask: "Compared to 3 years ago, your income has probably changed. Has your spending changed by the same amount? Where is the extra money going?" Most people's lifestyle expands to consume their income increases invisibly.

4. **The partner/family question.** If applicable: "Are you and your partner on the same page about money? And I don't mean 'do you agree' -- I mean 'do you actually know what each other thinks, fears, and wants financially?'" Financial misalignment destroys relationships slowly and silently.

5. **The real number question.** Ask: "What's the actual dollar amount you need per month to live the life you want -- not survive, but actually be satisfied? Have you ever calculated that number, or are you just chasing 'more'?" Most people have never done this math. They optimize for maximum income when they should be optimizing for enough.

6. **The avoidance question.** Ask: "What financial task have you been putting off for more than a month? The bill you haven't looked at, the account you haven't checked, the conversation you haven't had. What is it?" Avoidance is the most expensive financial habit.

**Quality gate:** At least 3 uncomfortable questions addressed honestly. The survival calculation has been done. At least one avoidance behavior identified.

---

### PLAN: Separate Truth from Story

**Actions:**

1. **Build the gap map.** Show them: "Here's what you say you want. Here's what your spending says you want. Let's look at the gap." Goals say "save for a house." Spending says "DoorDash and impulse purchases." No judgment -- just the data. Ask: "Does your money go where your mouth is?"

2. **Identify the three types of spending.**
   - **Life support:** You need this to survive. Rent, food, health, transportation. Non-negotiable.
   - **Life quality:** You need this to be happy. Not everything here is frivolous -- some of it is real. But be honest about which items.
   - **Life leaks:** Money that leaves your account and produces neither survival nor joy. Subscriptions you forgot about. Purchases you regret. Convenience spending that's really avoidance spending.

3. **Quantify the leaks.** Ask: "If we added up all the life leaks -- the subscriptions, the impulse purchases, the 'I'll cancel that later' items -- what's the monthly total? What would that number be over a year?" Seeing the annual number is usually the wake-up call.

4. **Test the goals.** Ask: "Given what we've just looked at -- is your current financial goal the right goal? Or is there a more urgent goal hiding underneath it?" Sometimes "I want to invest" should really be "I need to stop the bleeding first."

**Quality gate:** Spending is categorized into life support / life quality / life leaks. Leaks are quantified monthly and annually. At least one goal has been pressure-tested.

---

### ACT: One Move

**Actions:**

1. **Deliver the reality check.** Summarize: survival months, monthly savings rate, total leak spending, and the biggest gap between goals and behavior.

2. **Identify the ONE move.** Ask: "If you could only do one thing this month to improve your financial situation, what would have the biggest impact?" Help them find it. Usually it's one of: cancel the subscriptions (15 minutes of work), have the money conversation with your partner (hard but free), set up auto-transfer to savings (10 minutes), or look at the account you've been avoiding (5 minutes of courage). The one move is always smaller than they think and more impactful than they expect.

3. **Make it concrete.** Ask: "When are you going to do this? Not 'this week.' What day? What time? What's the first physical action -- opening the app, sitting down at the laptop, sending the text?" Vague intentions produce zero financial change.

4. **Set the re-check.** Say: "In 30 days, come back and we'll look at the numbers again. Did the one move happen? Did the leaks shrink? How does the survival number look now?" Financial health is a practice, not an event.

**Output:** Reality check summary, categorized spending, leak total, one specific move with a deadline, 30-day re-check prompt.

## Exit Criteria

Done when: (1) core financial numbers are established, (2) survival months calculated, (3) spending categorized with leaks identified, (4) one specific action committed with a date, (5) no financial advice given -- only questions asked and math done.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | User won't share specific numbers | Work with ranges: "More or less than $3K/month? More or less than $5K?" Precision isn't required. Honesty is. |
| REASON | User gets defensive | Back off the specific question, normalize: "Most people feel this way. The fact that you're here means you're ahead of most." |
| REASON | User's situation is genuinely dire | Drop the framework. Be direct: "Let's focus on the next 30 days only. What's the most urgent bill? What's the minimum you need?" |
| PLAN | All spending feels essential | Challenge one item: "If someone offered you $500/month to give up [item], would you take it? Then it's not essential -- it's a choice." |
| ACT | User won't commit to the one move | Shrink it: "What if the move was just LOOKING at the number? Not doing anything about it yet. Just looking." |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
