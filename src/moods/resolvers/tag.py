from ariadne import MutationType, ObjectType, QueryType

from moods.data import Tags
from moods.resolvers.auth import require_auth


class TagsResolver:
    def __init__(self, tags: Tags):
        self.tags = tags

    async def resolve_tags(
        self, _obj, info, *, search=None, include_archived=False, first=None, after=None
    ):
        require_auth(info)
        return await self.tags.get_tags(
            search=search,
            include_archived=include_archived,
            first=first,
            after=after,
        )

    async def resolve_update_tag_metadata(self, _obj, info, *, input):
        require_auth(info)
        return await self.tags.update_tag_metadata(
            name=input["name"], metadata=input["metadata"]
        )

    async def resolve_archive_tag(self, _obj, info, *, name):
        require_auth(info)
        return await self.tags.archive_tag(name)

    async def resolve_unarchive_tag(self, _obj, info, *, name):
        require_auth(info)
        return await self.tags.unarchive_tag(name)


def get_tag_resolvers(tags: Tags) -> list[ObjectType]:
    tags_resolver = TagsResolver(tags)

    query = QueryType()
    mutation = MutationType()

    query.set_field("tags", tags_resolver.resolve_tags)
    mutation.set_field("updateTagMetadata", tags_resolver.resolve_update_tag_metadata)
    mutation.set_field("archiveTag", tags_resolver.resolve_archive_tag)
    mutation.set_field("unarchiveTag", tags_resolver.resolve_unarchive_tag)

    return [query, mutation]
