from ariadne import MutationType, ObjectType, QueryType

from moods.data import moods as mood_data
from moods.data import shares as share_data
from moods.data import users as user_data
from moods.resolvers.auth import require_auth

query = QueryType()
mutation = MutationType()
user_obj = ObjectType("User")
share_rule_obj = ObjectType("ShareRule")


@query.field("users")
async def resolve_users(_obj, info, *, include_archived=False):
    return await user_data.get_users(
        info.context["pool"], include_archived=include_archived
    )


@query.field("user")
async def resolve_user(_obj, info, *, id):
    return await info.context["user_loader"].load(id)


@query.field("searchUsers")
async def resolve_search_users(_obj, info, *, search):
    require_auth(info)
    return await user_data.search_users(info.context["pool"], query=search)


@mutation.field("createUser")
async def resolve_create_user(_obj, info, *, input):
    require_auth(info)
    return await user_data.create_user(
        info.context["pool"], name=input["name"], email=input["email"]
    )


@mutation.field("updateUserSettings")
async def resolve_update_user_settings(_obj, info, *, input):
    require_auth(info)
    return await user_data.update_user_settings(
        info.context["pool"],
        id=info.context["auth_user_id"],
        settings=input["settings"],
    )


@mutation.field("archiveUser")
async def resolve_archive_user(_obj, info, *, id):
    require_auth(info)
    return await user_data.archive_user(info.context["pool"], id=id)


@mutation.field("updateSharing")
async def resolve_update_sharing(_obj, info, *, input):
    require_auth(info)
    user_id = info.context["auth_user_id"]
    await share_data.set_shares(
        info.context["pool"], user_id=user_id, rules=input["rules"]
    )
    return await info.context["user_loader"].load(user_id)


@user_obj.field("entries")
async def resolve_user_entries(
    user, info, *, include_archived=False, first=None, after=None
):
    return await mood_data.get_mood_entries(
        info.context["pool"],
        user_ids=[str(user["id"])],
        include_archived=include_archived,
        first=first,
        after=after,
    )


@user_obj.field("sharedWith")
async def resolve_user_shared_with(user, info):
    return await share_data.get_shares(info.context["pool"], user_id=str(user["id"]))


@share_rule_obj.field("user")
async def resolve_share_rule_user(share, info):
    return await info.context["user_loader"].load(str(share["shared_with"]))


@share_rule_obj.field("filters")
async def resolve_share_rule_filters(share, _info):
    return share.get("filters", [])
