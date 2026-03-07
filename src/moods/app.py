import logging
from contextlib import asynccontextmanager
from pathlib import Path

import asyncpg
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from moods.config import settings
from moods.db import apply_migrations, create_pool
from moods.resolvers import create_gql
from moods.resolvers.auth import COOKIE_NAME
from moods.telemetry import (
    configure_logging,
    instrument_app,
    instrument_db,
    setup_telemetry,
    shutdown_telemetry,
)

logger = logging.getLogger(__name__)

WEB_PUBLIC = Path(__file__).parent.parent.parent / "web" / "resources" / "public"


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if settings.cookie_secure:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response


class AuthCookieMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request.state.auth_cookie = None
        response = await call_next(request)
        token = request.state.auth_cookie
        if token:
            response.set_cookie(
                key=COOKIE_NAME,
                value=token,
                httponly=True,
                secure=settings.cookie_secure,
                samesite="lax",
                max_age=settings.jwt_expiry_days * 86400,
                path="/",
            )
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(json_output=settings.get("log_json", False))
    setup_telemetry()
    instrument_db()
    apply_migrations()
    pool = await create_pool()
    app.state.pool = pool
    app.state.graphql = create_gql(pool, settings)
    logger.info("moods started")
    yield
    await pool.close()
    shutdown_telemetry()
    logger.info("moods stopped")


app = FastAPI(title="moods", lifespan=lifespan)
instrument_app(app)

app.add_middleware(AuthCookieMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors.allow_origins,
    allow_credentials=settings.cors.allow_credentials,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health(request: Request) -> Response:
    checks = {}
    try:
        async with request.app.state.pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        checks["db"] = "ok"
    except (asyncpg.PostgresError, OSError):
        logger.exception("Health check DB failure")
        checks["db"] = "error"

    healthy = all(v == "ok" for v in checks.values())
    return JSONResponse(
        {"status": "healthy" if healthy else "degraded", "checks": checks},
        status_code=200 if healthy else 503,
    )


@app.api_route("/graphql", methods=["GET", "POST", "OPTIONS"])
async def graphql_endpoint(request: Request) -> Response:
    return await request.app.state.graphql.handle_request(request)


if (WEB_PUBLIC / "js").is_dir():
    app.mount("/js", StaticFiles(directory=WEB_PUBLIC / "js"), name="js")
if (WEB_PUBLIC / "css").is_dir():
    app.mount("/css", StaticFiles(directory=WEB_PUBLIC / "css"), name="css")


@app.get("/favicon.svg")
async def favicon(request: Request) -> Response:
    return FileResponse(WEB_PUBLIC / "index.html")


@app.get("/{path:path}")
async def spa_fallback(request: Request, path: str) -> Response:
    return FileResponse(WEB_PUBLIC / "index.html")
