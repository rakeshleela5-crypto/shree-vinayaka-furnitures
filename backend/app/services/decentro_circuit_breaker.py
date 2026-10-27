"""
backend/app/services/decentro_circuit_breaker.py
Production-grade Circuit Breaker & Resilient Outbound HTTP Client for Decentro Banking Hub.
Features #10, #11, #12, #13:
- Explicit Connect (5.0s) and Read (10.0s) timeouts.
- Tenacity exponential backoff retries on safe read / status-check requests.
- Automatic Circuit Breaker: Trips to OPEN if 5 consecutive 5xx/timeout errors occur within 60s.
- Automatically stays OPEN for 120s, returning fallback flag (decentro_degraded: true)
  so POS billing / COD screen instantly switches to Static QR / Manual UTR mode without hanging.
"""
import time
import logging
from typing import Optional, Dict, Any, Tuple
from enum import Enum
import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    RetryError
)

logger = logging.getLogger(__name__)


class CircuitState(str, Enum):
    CLOSED = "CLOSED"        # Normal operation: all outbound calls permitted
    OPEN = "OPEN"            # Gateway degraded: calls fail fast to fallback mode
    HALF_OPEN = "HALF_OPEN"  # Testing recovery: single probe call permitted


class DecentroCircuitOpenException(Exception):
    """Raised when an outbound Decentro call is attempted while the circuit is tripped OPEN."""
    def __init__(self, message: str = "Decentro Banking Hub circuit breaker is OPEN (degraded mode)", retry_after: int = 120):
        super().__init__(message)
        self.retry_after = retry_after
        self.decentro_degraded = True


class DecentroCircuitBreaker:
    def __init__(
        self,
        failure_threshold: int = 5,
        window_seconds: float = 60.0,
        recovery_timeout: float = 120.0
    ):
        self.failure_threshold = failure_threshold
        self.window_seconds = window_seconds
        self.recovery_timeout = recovery_timeout

        self._state: CircuitState = CircuitState.CLOSED
        self._failure_timestamps: list[float] = []
        self._consecutive_failures: int = 0
        self._last_state_change: float = time.time()
        self._last_failure_reason: str = ""
        self._total_trips: int = 0

    @property
    def state(self) -> CircuitState:
        now = time.time()
        # If OPEN and recovery timeout has expired, transition to HALF_OPEN to probe
        if self._state == CircuitState.OPEN and (now - self._last_state_change >= self.recovery_timeout):
            logger.info("[Decentro Circuit Breaker] Recovery timeout expired (120s). Transitioning OPEN -> HALF_OPEN to probe gateway health.")
            self._state = CircuitState.HALF_OPEN
            self._last_state_change = now
        return self._state

    def is_degraded(self) -> bool:
        """Returns True if Decentro is currently degraded or circuit is OPEN."""
        return self.state == CircuitState.OPEN

    def can_execute(self) -> bool:
        """Determines if an outbound Decentro call is allowed to proceed."""
        current_state = self.state
        if current_state == CircuitState.CLOSED:
            return True
        if current_state == CircuitState.HALF_OPEN:
            return True  # Allow canary probe
        return False  # OPEN: reject immediately to protect cashier checkout

    def record_success(self):
        """Called when an outbound Decentro call succeeds with 2xx status."""
        if self._state == CircuitState.HALF_OPEN:
            logger.info("[Decentro Circuit Breaker] Canary request succeeded! Decentro recovered. Transitioning HALF_OPEN -> CLOSED.")
            self._state = CircuitState.CLOSED
            self._consecutive_failures = 0
            self._failure_timestamps.clear()
            self._last_state_change = time.time()
        elif self._state == CircuitState.CLOSED:
            self._consecutive_failures = 0

    def record_failure(self, reason: str = ""):
        """Called when an outbound Decentro call fails with 5xx or connection/read timeout."""
        now = time.time()
        self._last_failure_reason = reason
        self._failure_timestamps.append(now)
        # Purge failure timestamps older than window_seconds
        self._failure_timestamps = [t for t in self._failure_timestamps if now - t <= self.window_seconds]
        self._consecutive_failures += 1

        logger.warning(
            f"[Decentro Circuit Breaker] Outbound failure recorded ({reason}). "
            f"Consecutive failures: {self._consecutive_failures}, Failures in last {self.window_seconds}s: {len(self._failure_timestamps)}"
        )

        if self._state == CircuitState.HALF_OPEN:
            logger.critical("[Decentro Circuit Breaker] Canary request failed! Re-tripping circuit HALF_OPEN -> OPEN for 120s.")
            self._trip_open(reason)
        elif self._state == CircuitState.CLOSED:
            if self._consecutive_failures >= self.failure_threshold or len(self._failure_timestamps) >= self.failure_threshold:
                logger.critical(
                    f"[Decentro Circuit Breaker] Trip threshold reached ({self._consecutive_failures} failures). "
                    f"Tripping circuit CLOSED -> OPEN for {self.recovery_timeout}s!"
                )
                self._trip_open(reason)

    def _trip_open(self, reason: str = ""):
        self._state = CircuitState.OPEN
        self._last_state_change = time.time()
        self._last_failure_reason = reason
        self._total_trips += 1

    def force_reset(self):
        """Manual administrative reset to CLOSED."""
        self._state = CircuitState.CLOSED
        self._consecutive_failures = 0
        self._failure_timestamps.clear()
        self._last_state_change = time.time()
        logger.info("[Decentro Circuit Breaker] Circuit manually reset to CLOSED.")

    def get_status(self) -> Dict[str, Any]:
        """Returns circuit health status dictionary for diagnostics and UI fallback flags."""
        curr_state = self.state
        remaining_open_sec = 0
        if curr_state == CircuitState.OPEN:
            elapsed = time.time() - self._last_state_change
            remaining_open_sec = max(0, int(self.recovery_timeout - elapsed))

        return {
            "state": curr_state.value,
            "decentro_degraded": curr_state == CircuitState.OPEN,
            "consecutive_failures": self._consecutive_failures,
            "recent_failures_count": len(self._failure_timestamps),
            "last_failure_reason": self._last_failure_reason,
            "remaining_open_seconds": remaining_open_sec,
            "total_trips": self._total_trips,
            "fallback_mode_active": curr_state == CircuitState.OPEN,
            "fallback_instruction": "Use Static Store QR or Manual Bank UTR entry." if curr_state == CircuitState.OPEN else None
        }


# Global singleton instance for Decentro circuit protection
decentro_circuit_breaker = DecentroCircuitBreaker()

# Standard timeouts: explicit connect=5.0s, read=10.0s (#10)
DECENTRO_TIMEOUT = httpx.Timeout(10.0, connect=5.0, read=10.0, write=10.0)


# Safe read retry wrapper with tenacity (#11)
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((httpx.ConnectTimeout, httpx.ReadTimeout, httpx.ConnectError)),
    reraise=True
)
async def _execute_retrying_request(client: httpx.AsyncClient, method: str, url: str, **kwargs) -> httpx.Response:
    """Executes safe status / query requests with exponential backoff retries."""
    return await client.request(method=method, url=url, **kwargs)


async def execute_decentro_call(
    method: str,
    url: str,
    headers: Dict[str, str],
    json_body: Optional[Dict[str, Any]] = None,
    is_safe_read: bool = False,
    is_idempotent: bool = False
) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """
    Executes an outbound call to Decentro with:
    1. Circuit breaker pre-check: fast-fail if OPEN without hanging the caller.
    2. Explicit connect=5.0s, read=10.0s timeouts.
    3. Tenacity exponential backoff retries on safe read / idempotent requests.
    4. Automatic failure registration on 5xx and timeouts to trip the circuit if needed.

    Returns:
        (success: bool, response_json: dict | None, error_message: str | None)
    """
    if not decentro_circuit_breaker.can_execute():
        logger.warning(f"[Decentro Outbound] Request to {url} blocked: Circuit Breaker is OPEN.")
        return False, None, "CIRCUIT_OPEN: Decentro Banking Hub is temporarily degraded. POS fallback active."

    try:
        async with httpx.AsyncClient(timeout=DECENTRO_TIMEOUT) as client:
            if is_safe_read or is_idempotent:
                # Use tenacity retry on safe reads
                resp = await _execute_retrying_request(
                    client=client,
                    method=method,
                    url=url,
                    headers=headers,
                    json=json_body
                )
            else:
                # Non-idempotent or state-changing mutation: single attempt with strict timeout
                resp = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=json_body
                )

            # Check status code
            if resp.status_code >= 500:
                err_text = f"Decentro 5xx Server Error ({resp.status_code}): {resp.text[:200]}"
                decentro_circuit_breaker.record_failure(err_text)
                return False, None, err_text

            decentro_circuit_breaker.record_success()
            try:
                data = resp.json()
            except Exception:
                data = {"raw_content": resp.text}
            return (resp.status_code in (200, 201), data, None if resp.status_code in (200, 201) else f"Decentro returned status {resp.status_code}")

    except (httpx.ConnectTimeout, httpx.ReadTimeout) as timeout_ex:
        err_msg = f"Decentro Timeout ({type(timeout_ex).__name__}): {timeout_ex}"
        decentro_circuit_breaker.record_failure(err_msg)
        return False, None, err_msg
    except httpx.ConnectError as conn_ex:
        err_msg = f"Decentro Connection Error: {conn_ex}"
        decentro_circuit_breaker.record_failure(err_msg)
        return False, None, err_msg
    except RetryError as retry_ex:
        err_msg = f"Decentro retries exhausted (tenacity): {retry_ex}"
        decentro_circuit_breaker.record_failure(err_msg)
        return False, None, err_msg
    except Exception as ex:
        err_msg = f"Decentro outbound unexpected error: {ex}"
        decentro_circuit_breaker.record_failure(err_msg)
        return False, None, err_msg
