from ariadne import MutationType

from moods.errors import AuthenticationError, ValidationError
from moods.orchestration.auth import Auth

COOKIE_NAME = "moods_token"


def require_auth(info) -> str:
    if not info.context.get("auth_user_id"):
        raise AuthenticationError("Authentication required")
    else:
        return str(info.context["auth_user_id"])


def get_token(request):
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    else:
        return request.cookies.get(COOKIE_NAME)


class AuthResolver:
    def __init__(self, auth: Auth):
        self.auth = auth

    async def resolve_send_login_code(self, _obj, info, *, email):
        success = await self.auth.send_login_code(email)
        return {"success": success}

    async def resolve_verify_login_code(self, _obj, info, *, email, code):
        result = await self.auth.verify_login_code(email, code)
        if not result:
            raise ValidationError("Invalid or expired code")
        info.context["request"].state.auth_cookie = result["token"]
        return result

    async def resolve_refresh_token(self, _obj, info):
        request = info.context["request"]
        token = get_token(request)
        if not token:
            raise AuthenticationError("Authentication required")

        new_token = self.auth.refresh_token(token)
        if not new_token:
            raise AuthenticationError("Token expired or invalid")
        request.state.auth_cookie = new_token
        return {"token": new_token}


def get_auth_resolvers(auth: Auth) -> list[MutationType]:
    mutation = MutationType()
    auth_resolver = AuthResolver(auth)
    mutation.set_field("sendLoginCode", auth_resolver.resolve_send_login_code)
    mutation.set_field("verifyLoginCode", auth_resolver.resolve_verify_login_code)
    mutation.set_field("refreshToken", auth_resolver.resolve_refresh_token)

    return [mutation]
