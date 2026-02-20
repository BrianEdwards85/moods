from ariadne import MutationType, QueryType

from moods.data import tags as tag_data

query = QueryType()
mutation = MutationType()


@query.field("tags")
async def resolve_tags(
    _obj, info, *, search=None, include_archived=False, first=None, after=None
):
    return await tag_data.get_tags(
        info.context["pool"],
        search=search,
        include_archived=include_archived,
        first=first,
        after=after,
    )


@mutation.field("updateTagMetadata")
async def resolve_update_tag_metadata(_obj, info, *, input):
    return await tag_data.update_tag_metadata(
        info.context["pool"], name=input["name"], metadata=input["metadata"]
    )


@mutation.field("archiveTag")
async def resolve_archive_tag(_obj, info, *, name):
    return await tag_data.archive_tag(info.context["pool"], name)


@mutation.field("unarchiveTag")
async def resolve_unarchive_tag(_obj, info, *, name):
    return await tag_data.unarchive_tag(info.context["pool"], name)
