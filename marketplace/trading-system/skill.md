# Trading System -- Algorithmic Trading Pipeline

Build and operate an algorithmic trading system with probability-based signal generation, regime classification, dual-patent governance validation, and position management.

## Execution Pattern: Phase Pipeline

```
PHASE 1: DATA          --> Load market data, verify feature computation (RSI, EMA, regime)
PHASE 2: SIGNALS       --> Run signal chain (probability model -> fallback strategies)
PHASE 3: VALIDATE      --> Governance gates, regime filter, entry window check
PHASE 4: EXECUTE       --> Position management (entry, sizing, stops, exits)
PHASE 5: REVIEW        --> Post-trade analysis, metric computation, strategy evaluation
```

## Inputs

- **market_data**: object -- OHLCV bars (5-minute) for target tickers, stored as parquets
- **model_artifacts**: object -- probability_model.joblib, regime_classifier.joblib
- **governance_config**: object -- ALG trust parameters, NeuroPRIN resonance thresholds
- **ticker_universe**: list[string] -- Target tickers (default: 50 -- SPY, QQQ, IWM, DIA + mega caps + sectors)

## Outputs

- **signals**: list[object] -- ProbabilitySignal with ticker, direction, probability, confidence, features, trigger
- **trades**: list[object] -- Executed trades with entry/exit prices, bars held, P&L
- **metrics**: object -- Win rate, Sharpe ratio, max drawdown, profit factor, avg bars held
- **regime_assessment**: object -- Pre-session regime classification with P(good_for_shorts)

## Execution

### Phase 1: DATA -- Load & Compute Features
**Entry criteria:** Market data available (historical parquets or live feed). Model artifacts loadable.
**Actions:**
1. Load OHLCV data for target tickers (5-minute bars)
2. Compute all 13 features in EXACT training order:
   ```python
   MODEL_FEATURES = [
       "win_streak", "lose_streak", "rsi_14", "vol_ratio", "vol_20",
       "mom_5", "mom_10", "mom_20", "range_pct", "body_pct",
       "ret", "bar_of_day", "trend"
   ]
   ```
3. **CRITICAL -- RSI 14 must use Wilder's EWM:**
   ```python
   delta = df["ret"].copy()  # NOT df["close"].diff()
   gain = delta.clip(lower=0)
   loss = (-delta.clip(upper=0))
   avg_gain = gain.ewm(alpha=1/14, min_periods=14, adjust=False).mean()
   avg_loss = loss.ewm(alpha=1/14, min_periods=14, adjust=False).mean()
   rs = avg_gain / avg_loss.replace(0, np.nan)
   rsi_14 = 100 - 100 / (1 + rs)
   ```
4. **CRITICAL -- Trend EMA must use adjust=False:**
   ```python
   ema_5 = df["close"].ewm(span=5, adjust=False).mean()
   ema_20 = df["close"].ewm(span=20, adjust=False).mean()
   trend = ema_5 / ema_20 - 1
   ```
5. Compute win/lose streaks from FULL bar history (not rolling window)
6. Run regime classifier at boot + 9:30 AM using 17 pre-session features
**Output:** Feature matrix with all 13 columns computed correctly. Regime classification for the session.
**Quality gate:** RSI uses `ewm(alpha=1/14, adjust=False)` NOT `rolling(14).mean()`. Trend uses `adjust=False`. Feature column order matches MODEL_FEATURES exactly. Regime classifier has loaded successfully.

### Phase 2: SIGNALS -- Generate Trading Signals
**Entry criteria:** Feature matrix computed with correct feature values. Models loaded.
**Actions:**
1. Run the primary signal chain: Probability Model
   - GBT classifier predicting P(short_win | features)
   - Threshold: 0.80 minimum probability to generate signal
   - Direction: SHORT only (every intraday long strategy failed)
2. If primary model produces no signal, run fallback: ExhaustReject
   - Hand-crafted pattern matching for overextended up-moves
   - Fallback only -- never overrides primary
3. Map probability to confidence:
   ```python
   confidence = (prob - threshold) / (1.0 - threshold)
   confidence = max(0.3, min(1.0, confidence))
   ```
4. Generate ProbabilitySignal:
   ```python
   ProbabilitySignal(ticker, direction="short", probability, confidence, features, trigger)
   ```
**Output:** List of ProbabilitySignal objects for tickers meeting the threshold.
**Quality gate:** All signals have probability >= 0.80. All signals are SHORT direction. Confidence mapped correctly to [0.3, 1.0] range. Trigger string contains key feature values.

### Phase 3: VALIDATE -- Governance & Regime Gates
**Entry criteria:** Signal list generated from Phase 2.
**Actions:**
1. Check entry time window: 10:00 AM - 1:30 PM ET only
   - Hour 09 entries (9:30-10:00) consistently lose money -- BLOCK
2. Apply regime filter:
   ```python
   short_prob = regime_model.predict_proba(X)[0, 1]
   if short_prob < 0.3:
       block_all_shorts_today()  # Day unfavorable for shorts
   ```
3. Apply ALG (Adaptive Learning Governance):
   - Trust-based gate: trust score increases with wins, decreases with losses
   - Below threshold = reduced position sizing or trade blocking
4. Apply NeuroPRIN resonance scoring:
   - Compute resonance vector from returns window using FFT
   - Regimes: resonant (trade freely), transitional (reduced sizing), chaotic (block)
5. Run dual-patent validation on each signal:
   ```python
   approved = critic.validate_batch_with_resonance(signals, market_ref, strategy_expected, resonance_vector)
   ```
6. Filter out any signals that fail governance
**Output:** Governance-approved signal list (subset of Phase 2 output).
**Quality gate:** All remaining signals pass entry window, regime filter, ALG trust gate, and NeuroPRIN resonance check. No signals outside 10:00-13:30 ET window. Blocked-day flag respected.

### Phase 4: EXECUTE -- Position Management
**Entry criteria:** At least one governance-approved signal exists.
**Actions:**
1. Open positions based on approved signals:
   - Direction: SHORT
   - Position sizing based on trust level and regime
2. Set exit parameters:
   - Hold period: 6 bars (30 minutes at 5-min bars)
   - Trailing stop (tight): 0.3% from high-water mark
   - Trailing stop (wide): 0.2% for lower-vol regimes
   - Exit: whichever hits first -- bar count or trailing stop
3. Track positions:
   - Entry price, entry time, bars held
   - High-water mark for trailing stop
   - Original trigger string (for traceability)
4. Recover positions after restart:
   - Broker sync recovers original trigger from orders table
   - Positions restored with correct stop levels
5. Monitor PDT (Pattern Day Trader) compliance
**Output:** Active positions with stops set, or closed positions with P&L recorded.
**Quality gate:** All positions have stops set. Trigger string preserved (not lost on broker sync). PDT rules satisfied. Position sizing matches governance-allowed levels.

### Phase 5: REVIEW -- Post-Trade Analysis
**Entry criteria:** Positions closed (naturally or forced), or end-of-session review.
**Actions:**
1. Compute trade metrics:
   | Metric | Formula |
   |---|---|
   | Win Rate | winning_trades / total_trades |
   | Sharpe Ratio | (mean(profit_pct) / std(profit_pct)) * sqrt(252) |
   | Max Drawdown | max((peak - current) / peak) over equity curve |
   | Profit Factor | sum(winning_pcts) / abs(sum(losing_pcts)) |
   | Avg Bars Held | mean(bars_held) across all trades |
2. Generate per-ticker breakdowns
3. Analyze signal conversion rates:
   ```sql
   conversion_rate = trades_executed / signals_generated * 100
   -- Grouped by (resonance_regime, ticker)
   ```
4. Track governance phase impact on outcomes
5. Feed results back to learning loop (reward computation)
6. Update strategy memory (per-regime win rate tracking)
**Output:** Complete trade review with metrics, per-ticker breakdown, conversion analysis, and learning feedback.
**Quality gate:** All closed trades have P&L computed. Metrics use close-to-close returns (no intrabar look-ahead). Learning feedback submitted. Strategy memory updated.

## Exit Criteria

- All features computed correctly (RSI Wilder's EWM, trend adjust=False, correct column order)
- Signals generated only for SHORT direction with probability >= 0.80
- All governance gates applied (entry window, regime, ALG trust, NeuroPRIN resonance)
- Positions managed with stops (6-bar hold + 0.3%/0.2% trailing)
- Post-trade metrics computed with close-to-close returns
- Learning feedback loop closed (outcomes -> reward -> strategy memory)

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| DATA | Feature computation mismatch (wrong RSI formula) | **Abort** -- wrong features produce wrong signals, never trade on mismatched features |
| DATA | Regime classifier fails to load | **Adjust** -- proceed without regime filter, increase caution on position sizing |
| SIGNALS | No signals generated (all below threshold) | **Skip** -- no action needed, wait for next bar |
| VALIDATE | Governance blocks all signals | **Skip** -- respect governance, do not override |
| EXECUTE | Broker connection lost mid-trade | **Escalate** -- log position state, attempt reconnection, flag for human review |
| REVIEW | Backtest shows look-ahead bias | **Abort** -- fix exit logic to use close-to-close only, re-run backtest |

## State Persistence

- Model artifacts (probability_model.joblib, regime_classifier.joblib)
- Live trades database (live_trades.db -- all trades, signals, outcomes)
- Regime classification for current session
- Strategy memory (per-regime win rates)
- Position state (for recovery after restart)

## Reference

### Architecture: 5-Agent Pipeline

```
Scout -> Synth -> Critic -> Activator -> Trader
```

| Agent | Role | Key Responsibility |
|---|---|---|
| Scout | Market Intelligence | Loads OHLCV data, computes resonance vectors, emits MarketState |
| Synth | Pattern Synthesizer | Generates candidate TradingSignals from MarketState |
| Critic | Risk Analyst | Validates signals against ALG governance + NeuroPRIN |
| Activator | Signal -> Position | Opens/closes positions, manages trailing stops |
| Trader | Orchestration | Runs the full pipeline over historical data or live bars |

### Live Signal Chain (Simplified)

```
Probability Model (PRIMARY) -> ExhaustReject (FALLBACK)
```

### Regime Classifier -- 17 Pre-Session Features

All computed from yesterday's close or today's open:
```
prev_ret, prev_range, prev_close_pos, mom_5, mom_10,
vol_ratio, realvol_20, overnight_gap, rsi_14, dow,
spy_qqq_rs_5d, spy_iwm_rs_5d, spy_ma20_dist, avg_range_5d,
prev_body_ratio, ret_2d, prev_upper_wick
```

### Critical Bugs Found (and Fixed)

1. **RSI Mismatch**: Live used `rolling(14).mean()`, model trained with Wilder's `ewm(alpha=1/14)`. RSI is 3rd most important feature. FIXED.
2. **Trend EMA Mismatch**: Live used `adjust=True`, training used `adjust=False`. FIXED.
3. **Trigger Preservation**: Broker sync lost original trigger string. FIXED -- recover from orders table.
4. **Backtest Look-Ahead**: Initial PF 2.33 used intrabar high/low. Real close-to-close PF was 0.94-1.49.
5. **Model Inversion Claim**: DEBUNKED -- 4-day sample artifact, not real on full 62-day dataset.
6. **Entry Time Gate**: Hour 09 entries consistently lost money. Moved from 9:45 AM to 10:00 AM.

### Quick Reference

- **Start live**: `python -m value_engine.V2.live.run_live`
- **Train regime classifier**: `python -m value_engine.V2.research.regime_classifier --save`
- **Entry window**: 10:00 AM - 1:30 PM ET
- **Direction**: SHORT only (intraday)
- **Probability threshold**: 0.80
- **Regime block**: P(good_for_shorts) < 0.3
- **Hold**: 6 bars + 0.3%/0.2% trailing stop
