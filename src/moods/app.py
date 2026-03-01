from contextlib import asynccontextmanager
from pathlib import Path

from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import FileResponse, JSONResponse, Response
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles

from moods.config import settings
from moods.db import apply_migrations, create_pool
from moods.resolvers import create_gql

COOKIE_NAME = "moods_token"
WEB_PUBLIC = Path(__file__).parent.parent.parent / "web" / "resources" / "public"


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


def create_app() -> Starlette:

    @asynccontextmanager
    async def lifespan(app):
        apply_migrations()
        app.state.pool = await create_pool()
        yield
        await app.state.pool.close()

    graphql_app = create_gql(create_pool(), settings)

    async def health(request):
        checks = {}

        # Database
        try:
            async with request.app.state.pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            checks["db"] = "ok"
        except Exception as exc:
            checks["db"] = str(exc)

        # Mailgun
        #        try:
        #            async with httpx.AsyncClient(timeout=5) as client:
        #                resp = await client.get(
        #                    f"https://api.mailgun.net/v3/{settings.mailgun.domain}",
        #                    auth=("api", settings.mailgun.api_key),
        #                )
        #                checks["mailgun"] = (
        #              "ok" if resp.status_code == 200 else f"status {resp.status_code}"
        #                )
        #        except Exception as exc:
        #            checks["mailgun"] = str(exc)

        healthy = all(v == "ok" for v in checks.values())
        return JSONResponse(
            {"status": "healthy" if healthy else "degraded", "checks": checks},
            status_code=200 if healthy else 503,
        )

    async def spa_fallback(request):
        return FileResponse(WEB_PUBLIC / "index.html")

    routes = [
        Route("/health", health, methods=["GET"]),
        Route("/graphql", graphql_app, methods=["GET", "POST"]),
    ]

    if (WEB_PUBLIC / "js").is_dir():
        routes.append(Mount("/js", StaticFiles(directory=WEB_PUBLIC / "js"), name="js"))
    if (WEB_PUBLIC / "css").is_dir():
        routes.append(
            Mount("/css", StaticFiles(directory=WEB_PUBLIC / "css"), name="css")
        )

    routes += [
        Route("/favicon.svg", spa_fallback),
        Route("/{path:path}", spa_fallback),
    ]

    return Starlette(
        lifespan=lifespan,
        routes=routes,
        middleware=[
            Middleware(
                CORSMiddleware,
                allow_origins=settings.cors.allow_origins,
                allow_credentials=settings.cors.allow_credentials,
                allow_methods=["GET", "POST", "OPTIONS"],
                allow_headers=["*"],
            ),
            Middleware(AuthCookieMiddleware),
        ],
    )


app = create_app()
