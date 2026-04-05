# Trading System Example: Computing Features for the Probability Model

## RSI 14 (Wilder's EWM -- MUST match training)
```python
delta = df["ret"].copy()
gain = delta.clip(lower=0)
loss = (-delta.clip(upper=0))
avg_gain = gain.ewm(alpha=1/14, min_periods=14, adjust=False).mean()
avg_loss = loss.ewm(alpha=1/14, min_periods=14, adjust=False).mean()
rs = avg_gain / avg_loss.replace(0, np.nan)
rsi_14 = 100 - 100 / (1 + rs)
```

## Trend (EMA crossover)
```python
ema_5 = df["close"].ewm(span=5, adjust=False).mean()
ema_20 = df["close"].ewm(span=20, adjust=False).mean()
trend = ema_5 / ema_20 - 1
```

## Signal Generation
```python
prob = model.predict_proba(X)[0, 1]
if prob >= 0.80:
    confidence = max(0.3, min(1.0, (prob - 0.80) / 0.20))
    signal = ProbabilitySignal(ticker="SPY", direction="short",
                                probability=prob, confidence=confidence)
```

## Key Points
- ALWAYS use `adjust=False` in EWM calls to match training
- RSI uses `ewm(alpha=1/14)`, NOT `rolling(14).mean()`
- Entry window: 10:00 AM - 1:30 PM ET only
- Exit: 6 bars or 0.3% trailing stop, whichever first
