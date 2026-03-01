from ariadne import MutationType, ObjectType, QueryType

from moods.data import Moods
from moods.resolvers.auth import require_auth

mood_entry = ObjectType("MoodEntry")


@mood_entry.field("user")
async def resolve_mood_entry_user(entry, info):
    return await info.context["user_loader"].load(entry["user_id"])


@mood_entry.field("tags")
async def resolve_mood_entry_tags(entry, info):
    return await info.context["mood_entry_tags_loader"].load(entry["id"])


class MoodsResolver:
    def __init__(self, moods: Moods):
        self.moods = moods

    async def resolve_mood_entries(
        self,
        _obj,
        info,
        *,
        user_ids=None,
        include_archived=False,
        first=None,
        after=None,
    ):
        user_id = require_auth(info)
        return await self.moods.get_mood_entries(
            user_ids=user_ids,
            include_archived=include_archived,
            first=first,
            after=after,
            viewer_id=user_id,
        )

    async def resolve_log_mood(self, _obj, info, *, input):
        user_id = require_auth(info)
        return await self.moods.create_mood_entry(
            user_id=user_id,
            mood=input["mood"],
            notes=input["notes"],
            tags=input.get("tags"),
        )

    async def resolve_archive_mood_entry(self, _obj, info, *, id):
        user_id = require_auth(info)
        return await self.moods.archive_mood_entry(entry_id=id, user_id=user_id)


def get_moods_resolver(moods: Moods) -> list[QueryType]:
    query = QueryType()
    mutation = MutationType()

    moods_resolver = MoodsResolver(moods)
    query.set_field("moodEntries", moods_resolver.resolve_mood_entries)
    mutation.set_field("logMood", moods_resolver.resolve_log_mood)
    mutation.set_field("archiveMoodEntry", moods_resolver.resolve_archive_mood_entry)

    return [query, mutation, mood_entry]
