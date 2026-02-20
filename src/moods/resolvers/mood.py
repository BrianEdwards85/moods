from ariadne import MutationType, ObjectType, QueryType

from moods.data import moods as mood_data

query = QueryType()
mutation = MutationType()
mood_entry = ObjectType("MoodEntry")


@query.field("moodEntries")
async def resolve_mood_entries(
    _obj, info, *, user_id=None, include_archived=False, first=None, after=None
):
    return await mood_data.get_mood_entries(
        info.context["pool"],
        user_id=user_id,
        include_archived=include_archived,
        first=first,
        after=after,
    )


@mutation.field("logMood")
async def resolve_log_mood(_obj, info, *, input):
    return await mood_data.create_mood_entry(
        info.context["pool"],
        user_id=input["user_id"],
        mood=input["mood"],
        notes=input["notes"],
        tags=input.get("tags"),
    )


@mutation.field("archiveMoodEntry")
async def resolve_archive_mood_entry(_obj, info, *, id):
    return await mood_data.archive_mood_entry(info.context["pool"], id)


@mood_entry.field("user")
async def resolve_mood_entry_user(entry, info):
    return await info.context["user_loader"].load(entry["user_id"])


@mood_entry.field("tags")
async def resolve_mood_entry_tags(entry, info):
    return await info.context["mood_entry_tags_loader"].load(entry["id"])
