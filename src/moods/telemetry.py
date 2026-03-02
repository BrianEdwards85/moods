"""OpenTelemetry setup for the Moods backend.

Reads OTEL config from dynaconf settings (settings.otel.endpoint,
settings.otel.auth_token). When endpoint is empty, telemetry is
silently disabled (local dev).
"""

import logging

from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from moods.config import settings

log = logging.getLogger(__name__)

_provider: TracerProvider | None = None


def setup_telemetry() -> None:
    global _provider

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
    if _provider is not None:
        _provider.shutdown()
        log.info("Telemetry shut down")
