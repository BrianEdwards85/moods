from pathlib import Path

from ariadne import load_schema_from_path, make_executable_schema
from ariadne.asgi import GraphQL
from ariadne.asgi.handlers import GraphQLHTTPHandler
from ariadne.contrib.tracing.opentelemetry import opentelemetry_extension
from asyncpg import Pool

from moods.data import Moods, Shares, Tags, Users, create_loaders
from moods.orchestration.auth import Auth
from moods.services.email import Email

from .auth import get_auth_resolvers, get_token
from .mood import get_moods_resolver
from .scalars import scalars
from .tag import get_tag_resolvers
from .user import get_user_resolvers

SCHEMA_DIR = Path(__file__).parent.parent / "schema"


def create_gql(pool: Pool, settings) -> GraphQL:
    moods = Moods(pool)
    shares = Shares(pool)
    tags = Tags(pool)
    users = Users(pool)
    email = Email(settings)
    auth = Auth(users, email, settings)

    type_defs = load_schema_from_path(str(SCHEMA_DIR))

    schema = make_executable_schema(
        type_defs,
        get_auth_resolvers(auth),
        get_moods_resolver(moods),
        scalars,
        get_tag_resolvers(tags),
        get_user_resolvers(moods, shares, users),
        convert_names_case=True,
    )

    async def get_context(request, _data=None):
        token = get_token(request)
        auth_user_id = auth.decode_token(token)

        return {
            "request": request,
            "auth_user_id": auth_user_id,
            **create_loaders(pool),
        }

    _SENSITIVE_ARGS = {"code", "token", "password"}

    def _arg_filter(args, info):
        return {k: "[REDACTED]" if k in _SENSITIVE_ARGS else v for k, v in args.items()}

    return GraphQL(
        schema,
        context_value=get_context,
        http_handler=GraphQLHTTPHandler(
            extensions=[
                opentelemetry_extension(arg_filter=_arg_filter),
            ],
        ),
    )


__all__ = ["create_gql"]
