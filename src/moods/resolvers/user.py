from ariadne import MutationType, ObjectType, QueryType

from moods.data import moods as mood_data
from moods.data import users as user_data

query = QueryType()
mutation = MutationType()
user_obj = ObjectType("User")


@query.field("users")
async def resolve_users(_obj, info):
    return await user_data.get_users(info.context["pool"])


@query.field("user")
async def resolve_user(_obj, info, *, id):
    return await info.context["user_loader"].load(id)


@mutation.field("createUser")
async def resolve_create_user(_obj, info, *, input):
    return await user_data.create_user(
        info.context["pool"], name=input["name"], email=input["email"]
    )


@mutation.field("updateUserSettings")
async def resolve_update_user_settings(_obj, info, *, input):
    return await user_data.update_user_settings(
        info.context["pool"], id=input["id"], settings=input["settings"]
    )


@user_obj.field("entries")
async def resolve_user_entries(
    user, info, *, include_archived=False, first=None, after=None
):
    return await mood_data.get_mood_entries(
        info.context["pool"],
        user_id=str(user["id"]),
        include_archived=include_archived,
        first=first,
        after=after,
    )
