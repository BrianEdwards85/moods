from ariadne import MutationType
from graphql import GraphQLError

from moods.config import settings
from moods.data import auth as auth_data

mutation = MutationType()


def require_auth(info):
    if not info.context.get("auth_user_id"):
        raise GraphQLError("Authentication required")


@mutation.field("sendLoginCode")
async def resolve_send_login_code(_obj, info, *, email):
    success = await auth_data.send_login_code(
        info.context["pool"], email, settings
    )
    return {"success": success}


@mutation.field("verifyLoginCode")
async def resolve_verify_login_code(_obj, info, *, email, code):
    result = await auth_data.verify_login_code(
        info.context["pool"],
        email,
        code,
        settings.jwt_secret,
        settings.jwt_expiry_days,
    )
    if not result:
        raise GraphQLError("Invalid or expired code")
    return result
