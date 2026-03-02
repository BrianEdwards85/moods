"""OpenTelemetry and log shipping setup for the Moods backend.

Reads config from dynaconf settings (settings.otel.endpoint,
settings.otel.auth_token). When endpoint is empty, telemetry is
silently disabled (local dev).
"""

import contextlib
import logging
import threading

import httpx
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from moods.config import settings

log = logging.getLogger(__name__)

_provider: TracerProvider | None = None
_log_handler: "OpenObserveLogHandler | None" = None


class OpenObserveLogHandler(logging.Handler):
    """Batching log handler that ships structured JSON to OpenObserve."""

    def __init__(
        self,
        url: str,
        headers: dict,
        capacity: int = 50,
        flush_interval: float = 10,
    ):
        super().__init__()
        self._url = url
        self._headers = {**headers, "Content-Type": "application/json"}
        self._capacity = capacity
        self._flush_interval = flush_interval
        self._buffer: list[dict] = []
        self._client = httpx.Client(timeout=5)
        self._timer: threading.Timer | None = None
        self._schedule_flush()

    def _schedule_flush(self) -> None:
        self._timer = threading.Timer(self._flush_interval, self._timed_flush)
        self._timer.daemon = True
        self._timer.start()

    def _timed_flush(self) -> None:
        self.flush()
        self._schedule_flush()

    def emit(self, record: logging.LogRecord) -> None:
        self.acquire()
        try:
            self._buffer.append(self._format_record(record))
            if len(self._buffer) >= self._capacity:
                self._ship()
        finally:
            self.release()

    def flush(self) -> None:
        self.acquire()
        try:
            self._ship()
        finally:
            self.release()

    def _ship(self) -> None:
        if not self._buffer:
            return
        batch = self._buffer
        self._buffer = []
        with contextlib.suppress(Exception):
            self._client.post(self._url, json=batch, headers=self._headers)

    def _format_record(self, record: logging.LogRecord) -> dict:
        return {
            "_timestamp": int(record.created * 1_000_000),
            "level": record.levelname,
            "message": self.format(record) if self.formatter else record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "func": record.funcName,
            "line": record.lineno,
        }

    def close(self) -> None:
        if self._timer:
            self._timer.cancel()
        self.flush()
        self._client.close()
        super().close()


def setup_telemetry() -> None:
    global _provider, _log_handler

    endpoint = settings.get("otel.endpoint", "")
    if not endpoint:
        log.info("settings.otel.endpoint not set, telemetry disabled")
        return

    from opentelemetry import trace
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
        OTLPSpanExporter,
    )

    auth_token = settings.get("otel.auth_token", "")
    headers = {}
    if auth_token:
        headers["Authorization"] = f"Basic {auth_token}"

    resource = Resource.create(
        {
            "service.name": settings.get("otel.service_name", "moods"),
        }
    )

    exporter = OTLPSpanExporter(endpoint=f"{endpoint}v1/traces", headers=headers)
    _provider = TracerProvider(resource=resource)
    _provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(_provider)

    # Set up log shipping to OpenObserve
    log_url = f"{endpoint}app_logs/_json"
    _log_handler = OpenObserveLogHandler(url=log_url, headers=headers)
    logging.getLogger().addHandler(_log_handler)

    log.info("Telemetry enabled, exporting to %s", endpoint)


def instrument_db() -> None:
    if _provider is None:
        return

    from opentelemetry.instrumentation.asyncpg import AsyncPGInstrumentor

    AsyncPGInstrumentor().instrument()
    log.info("asyncpg instrumentation enabled")


def instrument_app(app) -> None:
    if _provider is None:
        return

    from opentelemetry.instrumentation.starlette import StarletteInstrumentor

    StarletteInstrumentor.instrument_app(app)
    log.info("Starlette instrumentation enabled")


def shutdown_telemetry() -> None:
    global _log_handler

    if _log_handler is not None:
        logging.getLogger().removeHandler(_log_handler)
        _log_handler.close()
        _log_handler = None
        log.info("Log handler shut down")

    if _provider is not None:
        _provider.shutdown()
        log.info("Telemetry shut down")
