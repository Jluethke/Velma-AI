# Bug Root Cause -- Intermittent Order Duplication

## Scenario

An e-commerce platform receives occasional reports of duplicate orders. A customer clicks "Place Order" once but is charged twice, and two identical orders appear in the database. It happens roughly 3 times per week, always during high-traffic periods.

## OBSERVE: Gather Evidence

### Error Signal
- No error is thrown -- both orders succeed (silent failure)
- Symptom class: **Data corruption** (duplicate records)
- Detected by: customer complaints and finance reconciliation

### Timeline
```
Last known good state:  Before deploy on March 15 (0 duplicates in prior 60 days)
First occurrence:       March 16, 2:47 PM (high traffic period)
Frequency:              ~3 per week, always between 1-4 PM
Pattern:                Never on weekends (lower traffic)
```

### Recent Changes (March 15 deploy)
```
commit e4a7f21  "Add retry logic to payment gateway calls"
  - Modified: services/payment_service.py
  - Added: automatic retry with 3 attempts on timeout

commit b2c9d11  "Increase API timeout from 5s to 15s"
  - Modified: config/settings.py

commit 91f3a22  "Add order confirmation email"
  - Modified: services/order_service.py (added email call after order creation)
```

### Code Path
```python
# services/order_service.py
def place_order(user_id, cart):
    order = Order.create(user_id=user_id, items=cart.items, total=cart.total)
    db.session.add(order)
    db.session.commit()

    # Payment (with new retry logic from commit e4a7f21)
    result = payment_service.charge(order.id, cart.total)

    # Email (new in commit 91f3a22)
    send_confirmation_email(user_id, order.id)

    return order

# services/payment_service.py
def charge(order_id, amount):
    for attempt in range(3):              # <-- New retry logic
        try:
            response = gateway.charge(amount, idempotency_key=None)  # <-- No idempotency key!
            record_payment(order_id, response.transaction_id)
            return response
        except TimeoutError:
            if attempt == 2:
                raise
            continue                      # Retry on timeout
```

## REASON: Trace the Causal Chain

### 5 Whys

```
Why 1: Why are duplicate orders created?
  → The place_order function is called twice for the same cart.

Why 2: Why is place_order called twice?
  → The frontend retries when the first request times out. The backend takes >5s
    (because of the email send), the frontend's 5s timeout triggers, user sees
    "error", clicks again or frontend auto-retries.

Why 3: Why doesn't the backend reject the duplicate?
  → There's no idempotency check. Each call to place_order creates a new Order
    record unconditionally. There's no unique constraint on (user_id + cart_hash + time_window).

Why 4: Why did this start on March 15?
  → Two changes compounded: (1) the email send made the endpoint slower (sometimes >5s),
    and (2) the payment retry logic was added WITHOUT an idempotency key, so even the
    payment gateway charges twice.

Why 5: Why wasn't this caught?
  → Integration tests don't test concurrent requests. The retry logic was unit-tested
    in isolation (mock gateway always succeeds on retry) but never tested for the
    idempotency requirement.

ROOT CAUSE: Missing idempotency at two levels:
  1. No request-level idempotency (duplicate place_order calls both succeed)
  2. No payment-level idempotency (gateway.charge called without idempotency_key)
  Compounded by: endpoint became slow enough to trigger frontend timeout retries.
```

### Fault Tree

```
                    [Duplicate Order]
                     /            \
                  [AND]          [AND]
                 /    \         /    \
    [Frontend     [No order    [Payment   [No payment
     retries]      idempotency] retries]   idempotency]
       |              |            |            |
  [Endpoint       [Missing     [Timeout     [Missing
   slow >5s]       unique       error]       idempotency
     |             constraint]     |          key]
  [Email send                  [Gateway
   added in                     slow under
   commit 91f3a22]              load]
```

### Change Correlation

| Commit | Relevance | Contribution |
|---|---|---|
| e4a7f21 (retry logic) | **DIRECT** -- added retry without idempotency key | Primary contributing factor |
| b2c9d11 (timeout increase) | INDIRECT -- backend waits longer, but frontend timeout unchanged | Minor contributing factor |
| 91f3a22 (email send) | **DIRECT** -- made endpoint slow enough to trigger frontend retry | Primary contributing factor |

**Root cause confidence: 0.92** -- Strong change correlation (started exactly after deploy), reproduction confirmed (sending duplicate requests creates duplicate orders), and the idempotency gap is verifiable in code.

## PLAN: Design Fix and Verification

### Verification Test
```
1. Send POST /api/orders with identical cart payload twice within 1 second
2. Expect: first request creates order, second request returns the same order (idempotent)
3. Verify: only one charge on the payment gateway
4. Verify: only one order record in database
```

### Primary Fix
```python
# 1. Add idempotency key to order creation
def place_order(user_id, cart, idempotency_key):
    # Check for existing order with this key
    existing = Order.query.filter_by(idempotency_key=idempotency_key).first()
    if existing:
        return existing  # Return existing order, don't create duplicate

    order = Order.create(
        user_id=user_id, items=cart.items, total=cart.total,
        idempotency_key=idempotency_key  # Unique constraint in DB
    )
    db.session.add(order)
    db.session.commit()

    result = payment_service.charge(order.id, cart.total)
    send_confirmation_email(user_id, order.id)
    return order

# 2. Add idempotency key to payment gateway
def charge(order_id, amount):
    for attempt in range(3):
        try:
            response = gateway.charge(
                amount,
                idempotency_key=f"order-{order_id}"  # Gateway deduplicates
            )
            record_payment(order_id, response.transaction_id)
            return response
        except TimeoutError:
            if attempt == 2:
                raise
            continue
```

### Regression Test
```python
def test_duplicate_order_request_returns_same_order():
    """Verify that submitting the same order twice returns the existing order."""
    cart = create_test_cart(items=3)
    idem_key = "test-idempotency-key-123"

    order_1 = place_order(user_id=1, cart=cart, idempotency_key=idem_key)
    order_2 = place_order(user_id=1, cart=cart, idempotency_key=idem_key)

    assert order_1.id == order_2.id  # Same order returned
    assert Order.query.filter_by(idempotency_key=idem_key).count() == 1
    assert Payment.query.filter_by(order_id=order_1.id).count() == 1
```

## ACT: Deliver Analysis

### Summary
```
SYMPTOM:     Duplicate orders created during high-traffic periods (~3/week)
TIMELINE:    Started March 16, one day after deploy adding retry logic + email send
ROOT CAUSE:  Missing idempotency at request and payment levels, compounded by
             endpoint becoming slow enough to trigger client-side retries
EVIDENCE:    Change correlation (exact deploy date match), reproduction confirmed,
             code inspection shows no idempotency_key and no unique constraint
CONFIDENCE:  HIGH (0.92)
```

### Prevention Measures
- **Immediate**: Add idempotency_key to Order model + unique constraint + payment calls
- **Short-term**: Add an endpoint latency budget -- alert if any endpoint exceeds the frontend timeout
- **Long-term**: Establish an idempotency standard for all mutation endpoints -- every POST/PUT/DELETE must accept and enforce an idempotency key

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
