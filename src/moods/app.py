from contextlib import asynccontextmanager
from pathlib import Path

from ariadne import load_schema_from_path, make_executable_schema
from ariadne.asgi import GraphQL
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.routing import Route

from moods.data.loaders import create_loaders
from moods.db import apply_migrations, create_pool
from moods.resolvers.mood import mood_entry
from moods.resolvers.mood import mutation as mood_mutation
from moods.resolvers.mood import query as mood_query
from moods.resolvers.scalars import datetime_scalar, json_scalar
from moods.resolvers.tag import mutation as tag_mutation
from moods.resolvers.tag import query as tag_query
from moods.resolvers.user import mutation as user_mutation
from moods.resolvers.user import query as user_query
from moods.resolvers.user import user_obj

SCHEMA_DIR = Path(__file__).parent / "schema"


def create_app() -> Starlette:
    type_defs = load_schema_from_path(str(SCHEMA_DIR))
    schema = make_executable_schema(
        type_defs,
        user_query,
        tag_query,
        mood_query,
        user_mutation,
        mood_mutation,
        tag_mutation,
        mood_entry,
        user_obj,
        datetime_scalar,
        json_scalar,
        convert_names_case=True,
    )

    @asynccontextmanager
    async def lifespan(app):
        apply_migrations()
        app.state.pool = await create_pool()
        yield
        await app.state.pool.close()

    async def get_context(request, _data=None):
        pool = request.app.state.pool
        return {"request": request, "pool": pool, **create_loaders(pool)}

    graphql_app = GraphQL(schema, context_value=get_context)

    return Starlette(
        lifespan=lifespan,
        routes=[
            Route("/graphql", graphql_app, methods=["GET", "POST"]),
        ],
        middleware=[
            Middleware(
                CORSMiddleware,
                allow_origins=["http://localhost:3000"],
                allow_credentials=True,
                allow_methods=["GET", "POST", "OPTIONS"],
                allow_headers=["*"],
            ),
        ],
    )


app = create_app()
