from ariadne import MutationType, ObjectType, QueryType

from moods.data import Moods, Shares, Users
from moods.resolvers.auth import require_auth


async def resolve_user(_obj, info, *, id):
    return await info.context["user_loader"].load(id)


async def resolve_share_rule_user(share, info):
    return await info.context["user_loader"].load(str(share["shared_with"]))


async def resolve_share_rule_filters(share, _info):
    return share.get("filters", [])


class UserResolver:
    def __init__(self, moods: Moods, shares: Shares, users: Users):
        self.moods = moods
        self.shares = shares
        self.users = users

    async def resolve_users(self, _obj, info, *, include_archived=False):
        return await self.users.get_users(include_archived=include_archived)

    async def resolve_search_users(self, _obj, info, *, search):
        require_auth(info)
        return await self.users.search_users(query=search)

    async def resolve_create_user(self, _obj, info, *, input):
        require_auth(info)
        return await self.users.create_user(name=input["name"], email=input["email"])

    async def resolve_update_user_settings(self, _obj, info, *, input):
        user_id = require_auth(info)
        return await self.users.update_user_settings(
            id=user_id,
            settings=input["settings"],
        )

    async def resolve_archive_user(self, _obj, info, *, id):
        require_auth(info)
        return await self.users.archive_user(id=id)

    async def resolve_update_sharing(self, _obj, info, *, input):
        user_id = require_auth(info)
        await self.shares.set_shares(user_id=user_id, rules=input["rules"])
        return await info.context["user_loader"].load(user_id)

    async def resolve_user_entries(
        self, user, info, *, include_archived=False, first=None, after=None
    ):
        user_id = require_auth(info)
        return await self.moods.get_mood_entries(
            user_ids=[str(user["id"])],
            include_archived=include_archived,
            first=first,
            after=after,
            viewer_id=user_id,
        )

    async def resolve_user_shared_with(self, user, info):
        return await self.shares.get_shares(user_id=str(user["id"]))


def get_user_resolvers(moods: Moods, shares: Shares, users: Users) -> list[QueryType]:
    user_resolver = UserResolver(moods, shares, users)

    query = QueryType()
    mutation = MutationType()
    user_obj = ObjectType("User")
    share_rule_obj = ObjectType("ShareRule")

    query.set_field("users", user_resolver.resolve_users)
    query.set_field("user", resolve_user)
    query.set_field("searchUsers", user_resolver.resolve_search_users)
    mutation.set_field("createUser", user_resolver.resolve_create_user)
    mutation.set_field("updateUserSettings", user_resolver.resolve_update_user_settings)
    mutation.set_field("archiveUser", user_resolver.resolve_archive_user)
    mutation.set_field("updateSharing", user_resolver.resolve_update_sharing)
    user_obj.set_field("entries", user_resolver.resolve_user_entries)
    user_obj.set_field("sharedWith", user_resolver.resolve_user_shared_with)
    share_rule_obj.set_field("user", resolve_share_rule_user)
    share_rule_obj.set_field("filters", resolve_share_rule_filters)

    return [query, mutation, user_obj, share_rule_obj]
