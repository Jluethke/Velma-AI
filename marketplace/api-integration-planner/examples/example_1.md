# API Integration Planner -- Integrating a Weather API

## Scenario

A logistics application needs real-time weather data to optimize delivery routes. They want to integrate a commercial weather API to get current conditions and 48-hour forecasts for delivery addresses. Stack: Python 3.12 / FastAPI.

## Phase 1: DISCOVER

### Required Endpoints

| # | Requirement | Endpoint | Method | Auth |
|---|---|---|---|---|
| 1 | Current weather for an address | `GET /v3/weather/current` | GET | API key |
| 2 | 48-hour hourly forecast | `GET /v3/weather/forecast/hourly` | GET | API key |
| 3 | Severe weather alerts by region | `GET /v3/alerts/active` | GET | API key |

### Auth Requirements
```
Type:     API Key
Header:   X-Weather-API-Key: <key>
Tier:     Business ($99/month)
Limits:   100 req/min, 50K req/day
```

### API Constraints
```
Rate limit:       100 req/min (header: X-RateLimit-Remaining)
Pagination:       None (single response per location)
Response format:  JSON
Max locations:    1 per request (no batch endpoint)
Versioning:       URL path (/v3/)
Caching hint:     Cache-Control: max-age=300 (5 min for current, 30 min for forecast)
```

### API Quirks Detected
1. Temperature returned as string "72.5" not number 72.5 in some responses
2. Wind direction uses custom codes ("NNE") not degrees -- needs translation table
3. The `feels_like` field is missing from response when wind speed is 0 (undocumented)
4. Severe alerts endpoint returns 200 with empty array (not 404) when no alerts active

### Data Models
```
CurrentWeather:
  temperature: float (Fahrenheit)
  feels_like: float | null (missing when wind=0)
  humidity: int (0-100)
  wind_speed: float (mph)
  wind_direction: string ("N", "NNE", "NE", ... 16 compass points)
  conditions: string ("clear", "cloudy", "rain", "snow", "storm")
  timestamp: string (ISO 8601)

HourlyForecast:
  hours: list[ForecastHour]  (48 entries)
  ForecastHour:
    time: string (ISO 8601)
    temperature: float
    precipitation_chance: int (0-100)
    conditions: string

WeatherAlert:
  severity: string ("watch", "warning", "emergency")
  type: string ("tornado", "flood", "ice", "heat", "wind")
  affected_area: string
  starts_at: string (ISO 8601)
  ends_at: string (ISO 8601)
  description: string
```

## Phase 2: DESIGN

### Pattern Choice: Direct HTTP with Caching

**Justification:** Low call volume (<100 routes/day, ~300 API calls), real-time data needed for route decisions, simple API key auth, no webhooks available.

### Data Flow
```
Route Optimizer
     |
     v
WeatherClient.get_current(lat, lng)
     |
     +-- Cache check (Redis, TTL=5min) --> Cache HIT --> return cached
     |
     +-- Cache MISS --> Rate limiter check --> API call --> parse --> cache --> return
                              |
                              +-- Rate limited? --> wait (backoff) --> retry
                              +-- Error? --> circuit breaker --> fallback (last known)
```

### Error Strategy

| HTTP Status | Classification | Action |
|---|---|---|
| 200 | Success | Parse response, cache, return |
| 400 | Fatal (bad request) | Log, raise `WeatherAPIError`, do not retry |
| 401 | Fatal (bad key) | Log, alert ops team, raise `AuthError` |
| 403 | Fatal (quota exceeded) | Log, alert, use fallback data |
| 404 | Fatal (invalid location) | Return `None`, do not retry |
| 429 | Retryable (rate limited) | Read `Retry-After`, wait, retry (max 3) |
| 500/502/503 | Retryable (server error) | Exponential backoff, retry (max 3) |
| Timeout | Retryable | Retry once with longer timeout |

## Phase 3: IMPLEMENT

```python
"""Weather API client with caching, retry, rate limiting, and circuit breaker."""

import time
import random
import logging
from dataclasses import dataclass
from typing import Optional
import httpx

logger = logging.getLogger(__name__)


@dataclass
class CurrentWeather:
    temperature: float
    feels_like: Optional[float]
    humidity: int
    wind_speed: float
    wind_direction: str
    conditions: str
    timestamp: str


class WeatherAPIError(Exception):
    """Non-retryable API error."""
    def __init__(self, status: int, message: str):
        self.status = status
        super().__init__(f"Weather API {status}: {message}")


class WeatherClient:
    BASE_URL = "https://api.weather.example.com/v3"

    def __init__(self, api_key: str, cache, timeout: float = 10.0):
        self.api_key = api_key
        self.cache = cache  # Redis or dict-like with get/set/ttl
        self.timeout = timeout
        self._circuit_state = "closed"
        self._failure_count = 0
        self._last_failure_time = 0
        self._rate_remaining = 100

    def get_current(self, lat: float, lng: float) -> Optional[CurrentWeather]:
        """Get current weather for a location. Returns None if location invalid."""
        cache_key = f"weather:current:{lat:.4f}:{lng:.4f}"

        # Cache check
        cached = self.cache.get(cache_key)
        if cached:
            logger.debug(f"Cache hit for {cache_key}")
            return cached

        # Circuit breaker check
        if self._circuit_state == "open":
            if time.time() - self._last_failure_time > 30:
                self._circuit_state = "half_open"
            else:
                logger.warning("Circuit open, returning fallback")
                return self._get_fallback(cache_key)

        # API call with retry
        data = self._request_with_retry(
            "GET", "/weather/current",
            params={"lat": lat, "lng": lng, "units": "imperial"}
        )
        if data is None:
            return None

        # Parse (handle quirks: temperature as string, missing feels_like)
        result = CurrentWeather(
            temperature=float(data["temperature"]),
            feels_like=float(data["feels_like"]) if data.get("feels_like") else None,
            humidity=int(data["humidity"]),
            wind_speed=float(data["wind_speed"]),
            wind_direction=data["wind_direction"],
            conditions=data["conditions"],
            timestamp=data["timestamp"],
        )

        # Cache for 5 minutes
        self.cache.set(cache_key, result, ttl=300)
        return result

    def _request_with_retry(self, method, path, params=None, max_retries=3):
        """Make an API request with retry, backoff, and rate limit awareness."""
        url = f"{self.BASE_URL}{path}"

        for attempt in range(max_retries + 1):
            try:
                # Pre-emptive rate limit check
                if self._rate_remaining < 5:
                    time.sleep(1)

                response = httpx.request(
                    method, url,
                    params=params,
                    headers={"X-Weather-API-Key": self.api_key},
                    timeout=self.timeout,
                )

                # Track rate limit
                self._rate_remaining = int(
                    response.headers.get("X-RateLimit-Remaining", 100)
                )

                # Success
                if response.status_code == 200:
                    self._circuit_success()
                    return response.json()

                # Non-retryable errors
                if response.status_code == 404:
                    return None
                if response.status_code in (400, 401, 403):
                    raise WeatherAPIError(response.status_code, response.text)

                # Retryable errors
                if response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", 5))
                    logger.warning(f"Rate limited, waiting {retry_after}s")
                    time.sleep(retry_after)
                    continue

                if response.status_code >= 500:
                    self._circuit_failure()
                    if attempt < max_retries:
                        delay = min(1.0 * (2 ** attempt), 30)
                        delay += random.uniform(0, delay * 0.5)
                        logger.warning(f"Server error {response.status_code}, "
                                      f"retry in {delay:.1f}s")
                        time.sleep(delay)
                        continue
                    raise WeatherAPIError(response.status_code, "Max retries exceeded")

            except httpx.TimeoutException:
                self._circuit_failure()
                if attempt < max_retries:
                    logger.warning(f"Timeout, retry {attempt + 1}/{max_retries}")
                    continue
                raise WeatherAPIError(0, "Request timed out after retries")

            except httpx.ConnectError:
                self._circuit_failure()
                if attempt < max_retries:
                    time.sleep(2)
                    continue
                raise WeatherAPIError(0, "Connection failed after retries")

    def _circuit_success(self):
        self._failure_count = 0
        self._circuit_state = "closed"

    def _circuit_failure(self):
        self._failure_count += 1
        self._last_failure_time = time.time()
        if self._failure_count >= 5:
            self._circuit_state = "open"
            logger.error("Circuit breaker OPEN -- weather API appears down")

    def _get_fallback(self, cache_key):
        """Return stale cached data if available during circuit open."""
        stale = self.cache.get(cache_key, allow_stale=True)
        if stale:
            logger.info("Serving stale weather data during API outage")
        return stale
```

## Phase 4: VALIDATE

### Test Results

| Test | Result | Notes |
|---|---|---|
| Happy path: get current weather | PASS | Response parsed correctly, cached |
| Cache hit returns cached data | PASS | No API call made on second request |
| 404 returns None | PASS | Invalid location handled |
| 429 respects Retry-After header | PASS | Waited 5s then retried successfully |
| 500 retries with backoff | PASS | 3 retries, exponential delay observed |
| Timeout retries once | PASS | Second attempt succeeded |
| Circuit opens after 5 failures | PASS | 6th request fails immediately |
| Circuit half-opens after 30s | PASS | Test request sent, circuit closed on success |
| Temperature as string parsed to float | PASS | Quirk handled |
| Missing feels_like returns None | PASS | Quirk handled |

## Phase 5: HARDEN

### Production Configuration

```yaml
weather_api:
  circuit_breaker:
    failure_threshold: 5
    reset_timeout_seconds: 30
  cache:
    current_ttl_seconds: 300     # 5 min (matches Cache-Control)
    forecast_ttl_seconds: 1800   # 30 min
    stale_serve_seconds: 3600    # Serve stale for up to 1 hour during outage
  timeouts:
    connect_seconds: 5
    read_seconds: 10
  monitoring:
    alert_error_rate_threshold: 0.05   # Alert if > 5% errors
    alert_latency_p95_ms: 5000         # Alert if p95 > 5s
    alert_rate_limit_remaining: 10     # Alert if < 10 req remaining
```

### Operational Runbook
1. **API key rotation**: Update `WEATHER_API_KEY` env var, restart service, verify with health check
2. **During API outage**: Circuit breaker serves stale data. No action needed unless outage > 1 hour. If > 1 hour: switch to backup provider or disable weather-dependent route optimization
3. **Quota exceeded**: Check dashboard for unexpected spike. If legitimate growth, upgrade API tier. If abuse, check for missing cache hits

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
