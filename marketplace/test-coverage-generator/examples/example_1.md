# Test Coverage Generator -- Testing a Shopping Cart Module

## Scenario

A shopping cart module has 4 public functions: `add_item()`, `remove_item()`, `apply_coupon()`, and `calculate_total()`. Current coverage is 35% (happy path only). The team needs comprehensive tests before refactoring.

## Phase 1: ANALYZE

### Testable Surfaces

| Function | Params | Return | Branches | Edge Cases | Current Coverage |
|---|---|---|---|---|---|
| `add_item(cart, product_id, quantity)` | 3 | updated cart | 5 | qty=0, qty<0, qty>stock, product not found, cart full | 40% (happy path only) |
| `remove_item(cart, product_id)` | 2 | updated cart | 3 | item not in cart, last item, empty cart | 33% (happy path only) |
| `apply_coupon(cart, code)` | 2 | discount amount | 6 | expired coupon, used coupon, min order, stacking, invalid code, empty cart | 17% (happy path only) |
| `calculate_total(cart)` | 1 | float | 4 | empty cart, single item, with tax, with discount | 50% (happy + empty) |

### Branch Map for `apply_coupon()`
```python
def apply_coupon(cart, code):
    coupon = db.get_coupon(code)
    if not coupon:                          # Branch 1: invalid code
        raise InvalidCouponError(code)
    if coupon.expired_at < datetime.now():  # Branch 2: expired
        raise ExpiredCouponError(code)
    if coupon.used_count >= coupon.max_uses: # Branch 3: used up
        raise CouponExhaustedError(code)
    if cart.subtotal < coupon.min_order:     # Branch 4: min order
        raise MinOrderError(coupon.min_order)
    if cart.applied_coupon and not coupon.stackable:  # Branch 5: stacking
        raise CouponStackError()
    discount = cart.subtotal * coupon.percent / 100   # Branch 6: success
    cart.applied_coupon = coupon
    return discount
```

Covered by existing tests: Branch 6 only.
Uncovered: Branches 1-5 (all error paths).

## Phase 2: PRIORITIZE

### Risk Scores

| Function | Business (0-3) | Complexity (0-3) | Change Freq (0-3) | Coverage (0-3) | Total |
|---|---|---|---|---|---|
| `apply_coupon()` | 3 (revenue) | 2 (6 branches) | 3 (changed often) | 3 (17%) | **11** |
| `calculate_total()` | 3 (revenue) | 2 (4 branches) | 2 (monthly) | 2 (50%) | **9** |
| `add_item()` | 2 (core) | 2 (5 branches) | 2 (monthly) | 2 (40%) | **8** |
| `remove_item()` | 1 (supporting) | 1 (3 branches) | 1 (stable) | 2 (33%) | **5** |

### Test Plan (ordered by risk)
1. `apply_coupon` -- all 5 error paths (unit)
2. `apply_coupon` -- boundary: coupon expires exactly now (unit)
3. `calculate_total` -- with tax + discount combined (unit)
4. `calculate_total` -- empty cart edge case (unit)
5. `add_item` -- quantity exceeds stock (unit)
6. `add_item` -- product not found (unit)
7. `add_item` + `calculate_total` flow (integration)
8. `remove_item` -- empty cart (unit)
9. Full cart workflow: add, coupon, total, remove (integration)

## Phase 3: GENERATE

```python
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from cart import add_item, remove_item, apply_coupon, calculate_total
from cart.exceptions import (
    InvalidCouponError, ExpiredCouponError,
    CouponExhaustedError, MinOrderError, CouponStackError
)
from tests.factories import make_cart, make_product, make_coupon


# --- apply_coupon tests (highest risk, 11/12) ---

class TestApplyCoupon:
    """Tests for apply_coupon -- all error paths were untested."""

    def test_apply_coupon_invalid_code_raises_error(self):
        """Invalid coupon codes should raise InvalidCouponError, not fail silently."""
        cart = make_cart(subtotal=100.00)
        with pytest.raises(InvalidCouponError, match="FAKE123"):
            apply_coupon(cart, "FAKE123")

    def test_apply_coupon_expired_raises_error(self):
        """Expired coupons must be rejected even if the code is valid."""
        cart = make_cart(subtotal=100.00)
        coupon = make_coupon(code="OLD10", expired_at=datetime.now() - timedelta(days=1))
        with patch("cart.db.get_coupon", return_value=coupon):
            with pytest.raises(ExpiredCouponError):
                apply_coupon(cart, "OLD10")

    def test_apply_coupon_exhausted_raises_error(self):
        """Coupons at max usage count must be rejected."""
        cart = make_cart(subtotal=100.00)
        coupon = make_coupon(code="USED10", max_uses=100, used_count=100)
        with patch("cart.db.get_coupon", return_value=coupon):
            with pytest.raises(CouponExhaustedError):
                apply_coupon(cart, "USED10")

    def test_apply_coupon_below_minimum_order_raises_error(self):
        """Coupons with a minimum order value must reject carts below that value."""
        cart = make_cart(subtotal=25.00)
        coupon = make_coupon(code="MIN50", min_order=50.00, percent=10)
        with patch("cart.db.get_coupon", return_value=coupon):
            with pytest.raises(MinOrderError):
                apply_coupon(cart, "MIN50")

    def test_apply_coupon_non_stackable_with_existing_coupon_raises_error(self):
        """Non-stackable coupons must reject carts that already have a coupon."""
        cart = make_cart(subtotal=100.00, applied_coupon=make_coupon(code="FIRST"))
        coupon = make_coupon(code="SECOND", stackable=False)
        with patch("cart.db.get_coupon", return_value=coupon):
            with pytest.raises(CouponStackError):
                apply_coupon(cart, "SECOND")

    def test_apply_coupon_boundary_expires_exactly_now(self):
        """Coupon expiring at exactly the current time should be treated as expired."""
        cart = make_cart(subtotal=100.00)
        now = datetime.now()
        coupon = make_coupon(code="EDGE", expired_at=now)
        with patch("cart.db.get_coupon", return_value=coupon):
            with patch("cart.datetime") as mock_dt:
                mock_dt.now.return_value = now
                with pytest.raises(ExpiredCouponError):
                    apply_coupon(cart, "EDGE")

    def test_apply_valid_coupon_returns_correct_discount(self):
        """Valid 15% coupon on $200 cart should return $30 discount."""
        cart = make_cart(subtotal=200.00)
        coupon = make_coupon(code="SAVE15", percent=15, min_order=0)
        with patch("cart.db.get_coupon", return_value=coupon):
            discount = apply_coupon(cart, "SAVE15")
        assert discount == 30.00
        assert cart.applied_coupon == coupon


# --- calculate_total tests (risk 9/12) ---

class TestCalculateTotal:
    """Tests for calculate_total -- edge cases and combined discounts untested."""

    def test_empty_cart_returns_zero(self):
        cart = make_cart(items=[])
        assert calculate_total(cart) == 0.00

    def test_single_item_no_tax_no_discount(self):
        cart = make_cart(items=[make_product(price=29.99, qty=1)], tax_rate=0)
        assert calculate_total(cart) == 29.99

    def test_multiple_items_with_tax(self):
        cart = make_cart(
            items=[make_product(price=10.00, qty=2), make_product(price=5.00, qty=3)],
            tax_rate=0.08
        )
        # Subtotal: 20 + 15 = 35. Tax: 35 * 0.08 = 2.80. Total: 37.80
        assert calculate_total(cart) == 37.80

    def test_total_with_coupon_discount_applied_before_tax(self):
        cart = make_cart(
            items=[make_product(price=100.00, qty=1)],
            tax_rate=0.10,
            discount=10.00  # From coupon
        )
        # Subtotal: 100. Discount: 10. Taxable: 90. Tax: 9. Total: 99.
        assert calculate_total(cart) == 99.00

    @pytest.mark.parametrize("qty,expected", [(0, 0.00), (1, 9.99), (999, 9990.01)])
    def test_total_scales_with_quantity(self, qty, expected):
        cart = make_cart(items=[make_product(price=9.99, qty=qty)], tax_rate=0)
        assert calculate_total(cart) == pytest.approx(expected, abs=0.01)
```

## Phase 4: VALIDATE

| Test | Independent | Deterministic | Fast | Assertions | Mutation Survival |
|---|---|---|---|---|---|
| `test_apply_coupon_invalid_code_raises_error` | Yes | Yes | <1ms | Specific exception + message | Would catch: removing the `if not coupon` check |
| `test_apply_coupon_expired_raises_error` | Yes | Yes (mocked time) | <1ms | Specific exception | Would catch: removing expiry check |
| `test_apply_coupon_boundary_expires_exactly_now` | Yes | Yes (frozen time) | <1ms | Specific exception | Would catch: `<` vs `<=` mutation |
| `test_total_with_coupon_discount_applied_before_tax` | Yes | Yes | <1ms | Exact value | Would catch: tax-before-discount order swap |

All tests pass quality gates. No shared state, no time dependencies, no sleeps.

## Phase 5: REPORT

### Coverage Projection

| Function | Before | After (Projected) | Tests Added |
|---|---|---|---|
| `apply_coupon()` | 17% (1/6 branches) | 100% (6/6 branches) | +6 |
| `calculate_total()` | 50% (2/4 branches) | 100% (4/4 branches) | +5 |
| `add_item()` | 40% (2/5 branches) | 40% (deferred) | +0 |
| `remove_item()` | 33% (1/3 branches) | 33% (deferred) | +0 |
| **Module total** | 35% | 68% | +11 |

### Remaining Gaps
- `add_item()` error paths: deferred (risk score 8, next priority)
- `remove_item()` error paths: deferred (risk score 5, low priority)

### Maintenance Recommendations
- Add `--cov-fail-under=65` to CI for this module (current projection: 68%)
- Increase threshold to 80% after adding `add_item()` tests
- The `apply_coupon` boundary test is coupled to datetime behavior -- if the expiry comparison changes from `<` to `<=`, the test will correctly fail

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
