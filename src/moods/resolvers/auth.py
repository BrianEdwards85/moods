from ariadne import MutationType
from graphql import GraphQLError

from moods.config import settings
from moods.orchestration import auth as auth_ops

mutation = MutationType()


def require_auth(info):
    if not info.context.get("auth_user_id"):
        raise GraphQLError("Authentication required")


@mutation.field("sendLoginCode")
async def resolve_send_login_code(_obj, info, *, email):
    success = await auth_ops.send_login_code(
        info.context["pool"], email, settings
    )
    return {"success": success}


@mutation.field("verifyLoginCode")
async def resolve_verify_login_code(_obj, info, *, email, code):
    result = await auth_ops.verify_login_code(
        info.context["pool"],
        email,
        code,
        settings.jwt_secret,
        settings.jwt_expiry_days,
    )
    if not result:
        raise GraphQLError("Invalid or expired code")
    return result


@mutation.field("refreshToken")
async def resolve_refresh_token(_obj, info):
    auth_header = info.context["request"].headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise GraphQLError("Authentication required")

    raw_token = auth_header[7:]
    new_token = auth_ops.refresh_token(
        raw_token, settings.jwt_secret, settings.jwt_expiry_days
    )
    if not new_token:
        raise GraphQLError("Token expired or invalid")
    return {"token": new_token}
