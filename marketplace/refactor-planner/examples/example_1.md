# Refactor Planner -- Decomposing a God Class

## Scenario

A SaaS application has a `UserService` class at 850 lines that handles authentication, profile management, billing, notification preferences, and usage analytics. Every feature request touches this file. Three developers have merge conflicts in it weekly.

## Phase 1: ASSESS

### Code Smells Detected

| # | Smell | Severity | Location | Description |
|---|---|---|---|---|
| 1 | Large Class | Critical | `UserService` (850 lines) | Single class with 5 distinct responsibilities |
| 2 | Divergent Change | Critical | `UserService` | Modified for auth changes AND billing changes AND notification changes |
| 3 | Long Method | High | `UserService.register()` (95 lines) | Handles validation, creation, welcome email, trial setup, analytics event |
| 4 | Feature Envy | Medium | `UserService.calculate_invoice()` | Uses 8 fields from `Plan` but only 1 from `User` |
| 5 | Data Clumps | Medium | Multiple methods | `stripe_customer_id`, `plan_id`, `billing_email` always passed together |
| 6 | Duplicate Code | Medium | `update_email()` and `update_billing_email()` | Same validation logic duplicated |
| 7 | Primitive Obsession | Low | `status` field | Uses strings "active"/"suspended"/"cancelled" instead of enum |

### Complexity Metrics

| Method | Cyclomatic | Cognitive | Lines | Params |
|---|---|---|---|---|
| `register()` | 18 | 24 | 95 | 6 |
| `calculate_invoice()` | 14 | 19 | 72 | 3 |
| `process_webhook()` | 22 | 31 | 110 | 2 |
| `update_preferences()` | 8 | 11 | 45 | 4 |
| `get_usage_stats()` | 6 | 8 | 38 | 2 |

## Phase 2: PLAN

### Refactoring Goals

| Goal | Approach | Effort | Breaking Changes |
|---|---|---|---|
| G1: Extract AuthService | Extract Class | M (4h) | None -- internal consumers only |
| G2: Extract BillingService | Strangler Fig | L (2d) | Billing API changes -- needs deprecation |
| G3: Extract NotificationPreferenceService | Extract Class | S (1h) | None |
| G4: Decompose register() | Extract Method (x4) | S (1.5h) | None |
| G5: Replace status strings with enum | Replace Type Code | XS (20m) | Migration needed |

### Success Criteria
- `UserService` reduced from 850 lines to <200 lines (profile management only)
- No method has cyclomatic complexity >10
- Each extracted service has its own test file
- All 47 existing tests pass unchanged

## Phase 3: SEQUENCE

```
Step 1:  Write characterization tests for UserService         [TESTS FIRST]
Step 2:  Extract NotificationPreferenceService (lowest risk)   [G3]
Step 3:  Run full test suite                                   [VERIFY]
Step 4:  Extract AuthService (auth methods only)               [G1]
Step 5:  Run full test suite                                   [VERIFY]
Step 6:  Decompose register() into 4 small methods             [G4]
Step 7:  Run full test suite                                   [VERIFY]
Step 8:  Introduce BillingService interface (Strangler Fig)     [G2 start]
Step 9:  Migrate first caller to BillingService                [G2 cont]
Step 10: Migrate remaining callers (one at a time)             [G2 cont]
Step 11: Remove billing methods from UserService               [G2 end]
Step 12: Run full test suite                                   [VERIFY]
Step 13: Replace status strings with UserStatus enum            [G5]
Step 14: Run full test suite + migration test                   [VERIFY]
```

Parallelizable: Steps 2 and 4 (different responsibilities, different files).

## Phase 4: EXECUTE (Step 4 Example)

### Step 4: Extract AuthService

**What to do:** Extract `authenticate()`, `verify_token()`, `reset_password()`, `change_password()`, and `logout()` from `UserService` into a new `AuthService` class.

**Before:**
```python
class UserService:
    def __init__(self, db, cache, mailer, stripe_client):
        self.db = db
        self.cache = cache
        self.mailer = mailer
        self.stripe = stripe_client

    def authenticate(self, email, password):
        user = self.db.query(User).filter_by(email=email).first()
        if not user:
            raise AuthError("Invalid credentials")
        if not bcrypt.checkpw(password.encode(), user.password_hash):
            raise AuthError("Invalid credentials")
        if user.status == "suspended":
            raise AuthError("Account suspended")
        token = jwt.encode({"user_id": user.id, "exp": time.time() + 3600}, SECRET)
        self.cache.set(f"session:{user.id}", token, ttl=3600)
        return {"token": token, "user": user.to_dict()}

    def verify_token(self, token):
        # ... 25 lines of token verification ...

    def reset_password(self, email):
        # ... 30 lines of password reset ...

    # ... 600 more lines of profile, billing, notifications, analytics ...
```

**After:**
```python
# auth_service.py (new file)
class AuthService:
    def __init__(self, db, cache):
        self.db = db
        self.cache = cache

    def authenticate(self, email, password):
        user = self.db.query(User).filter_by(email=email).first()
        if not user:
            raise AuthError("Invalid credentials")
        if not bcrypt.checkpw(password.encode(), user.password_hash):
            raise AuthError("Invalid credentials")
        if user.status == "suspended":
            raise AuthError("Account suspended")
        token = jwt.encode({"user_id": user.id, "exp": time.time() + 3600}, SECRET)
        self.cache.set(f"session:{user.id}", token, ttl=3600)
        return {"token": token, "user": user.to_dict()}

    def verify_token(self, token):
        # ... moved from UserService ...

    def reset_password(self, email):
        # ... moved from UserService ...

# user_service.py (slimmed down)
class UserService:
    def __init__(self, db, cache, mailer, stripe_client):
        self.db = db
        self.cache = cache
        self.mailer = mailer
        self.stripe = stripe_client
        self.auth = AuthService(db, cache)  # Delegate for backward compat

    # Backward-compatible delegations (deprecate over time)
    def authenticate(self, email, password):
        return self.auth.authenticate(email, password)

    # ... remaining profile, billing, notifications methods ...
```

**Verification:** `pytest tests/test_user_service.py tests/test_auth_service.py -v`

**Rollback:** `git checkout -- services/user_service.py && git rm services/auth_service.py`

**Commit:** `Refactor: extract AuthService from UserService (auth methods only)`

## Phase 5: VERIFY

### Regression Checklist
- [ ] User login returns valid JWT (authenticate)
- [ ] Invalid password returns 401 (authenticate)
- [ ] Suspended account returns 403 (authenticate)
- [ ] Token verification accepts valid tokens (verify_token)
- [ ] Token verification rejects expired tokens (verify_token)
- [ ] Password reset sends email (reset_password)
- [ ] Profile update works (UserService -- unchanged)
- [ ] Billing invoice calculation works (UserService -- unchanged)
- [ ] Notification preferences update works (extracted service)

### Improvement Metrics (Expected)
| Metric | Before | After |
|---|---|---|
| UserService lines | 850 | ~180 |
| Max cyclomatic complexity | 22 | 10 |
| Responsibilities per class | 5 | 1 |
| Files with merge conflicts/week | 3+ | ~0 |
| Test files | 1 (test_user_service.py) | 5 (one per service) |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
