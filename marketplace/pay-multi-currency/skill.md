# Multi-Currency Pricing and Settlement

**One-line description:** Sets explicit per-currency prices in minor units, checks each against the provider's documented minimum charge amount, stores currency beside every amount, and reads presentment versus settlement amounts and the exchange rate from Stripe balance transactions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `currencies` (string[], required): ISO 4217 codes to present prices in.
- `currency_exponents` (object, required): Output of `pay-money-minor-units`.
- `integration_plan` (object, required): Output of `pay-stripe-integration-choice`.

---

## Outputs

- `currency_config` (object): Per currency: price list in minor units, minimum charge amount with doc source, settlement currency, and the result of one test charge showing `exchange_rate`.

---

## Phase 1: Explicit Prices Per Currency

### Entry Criteria
- Every code in `currencies` has an exponent.

### Actions
1. Decide with the business owner a price per product per currency. Do not compute prices at request time from a float exchange rate; that gives odd amounts and rounding drift.
2. In Stripe, either create one Price per currency, or one Price with `currency_options` for additional currencies (for example Python `stripe.Price.create(product=prod, currency="usd", unit_amount=4900, currency_options={"eur": {"unit_amount": 4500}, "jpy": {"unit_amount": 7000}})`). Check the Price API reference for your API version.
3. In your own database, every amount column has a currency column next to it. No amount is stored without its currency.
4. Write the price list into `currency_config`.

### Output
Per-currency price list.

### Quality Gate
- `stripe prices retrieve price_... -d "expand[]=currency_options"` (or SDK retrieve with `expand=["currency_options"]`) lists every code in `currencies`. Check `stripe prices retrieve --help` for the expand flag syntax on your CLI.
- `rg -n "amount" <schema files>` shows a currency column for each amount column (read each match).

---

## Phase 2: Minimums and Display

### Entry Criteria
- Price list exists.

### Actions
1. Open Stripe's "Minimum and maximum charge amounts" table and copy the minimum for each currency and its settlement-currency note into `currency_config` with the URL and date read. Do not type minimums from memory.
2. Flag any price below its minimum.
3. Display with the platform formatter, never by inserting a decimal point by hand:
   - JS: `new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 10 ** exponent)` (display only).
   - Python: Babel `format_currency(Decimal(minor) / (10 ** exp), currency, locale=locale)`.
   - Go: `golang.org/x/text/currency` with `message.NewPrinter`.
4. Rounding rule for any derived amount (tax, discount): compute in integer minor units and document the rounding mode (for example round half up) in code comments next to the computation.

### Output
Minimums table and formatter code.

### Quality Gate
- Every currency row has a cited minimum, and zero prices are below it (or flagged to the owner).
- A unit test formats one amount per currency and asserts the exact string for a fixed locale.

---

## Phase 3: Read Settlement Amounts

### Entry Criteria
- Test keys set.

### Actions
1. Find the account's default settlement currency: Dashboard, Settings, Bank accounts and currencies (or `stripe.Account.retrieve()` and read `default_currency`).
2. Make a test charge in a currency different from settlement, for example EUR on a USD account.
3. Read the balance transaction: retrieve the charge with `expand=["balance_transaction"]` and record `amount`, `currency`, `exchange_rate`, `fee`, `net`. The balance transaction is in the settlement currency; the charge `amount` is in presentment currency.
4. Record which of your reports use presentment and which use settlement amounts. Revenue reconciliation (`pay-payout-reconciliation`) uses settlement.

### Output
`currency_config`.

### Quality Gate
- The recorded balance transaction shows a non-null `exchange_rate` and `currency` equal to the settlement currency.

---

## Worked Example

Illustrative. `currencies` = `["USD","EUR","JPY"]`, account settles in USD.

- Phase 1: price 4900 USD, 4500 EUR, 7000 JPY.
- Phase 2: minimums copied from Stripe docs with URL; none below.
- Phase 3:
```
charge: amount=4500 currency=eur
balance_transaction: amount=<usd minor> currency=usd exchange_rate=<rate> fee=<fee> net=<net>
```

---

## Exit Criteria

DONE when every currency has an explicit price above its cited minimum, every stored amount carries a currency, and one cross-currency test charge's settlement fields are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Owner wants automatic conversion | **Return**: record as an open question; read Stripe's Adaptive Pricing docs and decide with the owner, do not build float conversion. |
| Phase 2 | Price below minimum | **Return**: flag to the owner; do not raise prices silently. |
| Phase 3 | `exchange_rate` is null | **Adjust**: the charge currency equals settlement currency; repeat with a different currency. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
