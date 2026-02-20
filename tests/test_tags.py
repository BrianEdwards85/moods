from tests.conftest import gql

CREATE_USER = """
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) { id }
}
"""

LOG_MOOD = """
mutation LogMood($input: LogMoodInput!) {
  logMood(input: $input) { id tags { name } }
}
"""

TAGS_QUERY = """
query Tags($search: String, $includeArchived: Boolean, $first: Int, $after: String) {
  tags(search: $search, includeArchived: $includeArchived, first: $first, after: $after) {
    edges { cursor node { name metadata archivedAt } }
    pageInfo { hasNextPage endCursor }
  }
}
"""

UPDATE_TAG_METADATA = """
mutation UpdateTagMetadata($input: UpdateTagMetadataInput!) {
  updateTagMetadata(input: $input) {
    name metadata
  }
}
"""

ARCHIVE_TAG = """
mutation ArchiveTag($name: String!) {
  archiveTag(name: $name) {
    name archivedAt
  }
}
"""


async def _setup_tags(client, tag_names):
    """Create a user and log a mood with the given tags, returning tag names."""
    body = await gql(client, CREATE_USER, {"input": {"name": "Tagger", "email": "tag@test.com"}})
    user_id = body["data"]["createUser"]["id"]
    await gql(client, LOG_MOOD, {
        "input": {"userId": user_id, "mood": 5, "notes": "", "tags": tag_names}
    })


async def test_query_tags_empty(client):
    body = await gql(client, TAGS_QUERY)
    conn = body["data"]["tags"]
    assert conn["edges"] == []
    assert conn["pageInfo"]["hasNextPage"] is False
    assert conn["pageInfo"]["endCursor"] is None


async def test_query_tags(client):
    await _setup_tags(client, ["happy", "grateful"])
    body = await gql(client, TAGS_QUERY)
    names = [e["node"]["name"] for e in body["data"]["tags"]["edges"]]
    assert sorted(names) == ["grateful", "happy"]


async def test_search_tags(client):
    await _setup_tags(client, ["happy", "grateful", "anxious"])
    body = await gql(client, TAGS_QUERY, {"search": "happy"})
    names = [e["node"]["name"] for e in body["data"]["tags"]["edges"]]
    assert "happy" in names
    assert "anxious" not in names


async def test_update_tag_metadata(client):
    await _setup_tags(client, ["happy"])
    meta = {"color": "#9ece6a", "emoji": "😊"}
    body = await gql(client, UPDATE_TAG_METADATA, {
        "input": {"name": "happy", "metadata": meta}
    })
    updated = body["data"]["updateTagMetadata"]
    assert updated["name"] == "happy"
    assert updated["metadata"] == meta


async def test_archive_tag(client):
    await _setup_tags(client, ["happy"])
    body = await gql(client, ARCHIVE_TAG, {"name": "happy"})
    assert body["data"]["archiveTag"]["archivedAt"] is not None


async def test_tags_pagination(client):
    await _setup_tags(client, ["alpha", "bravo", "charlie", "delta", "echo"])

    body = await gql(client, TAGS_QUERY, {"first": 2})
    page1 = body["data"]["tags"]
    assert len(page1["edges"]) == 2
    assert page1["pageInfo"]["hasNextPage"] is True
    names1 = [e["node"]["name"] for e in page1["edges"]]
    assert names1 == ["alpha", "bravo"]

    body = await gql(client, TAGS_QUERY, {"first": 2, "after": page1["pageInfo"]["endCursor"]})
    page2 = body["data"]["tags"]
    assert len(page2["edges"]) == 2
    names2 = [e["node"]["name"] for e in page2["edges"]]
    assert names2 == ["charlie", "delta"]

    body = await gql(client, TAGS_QUERY, {"first": 2, "after": page2["pageInfo"]["endCursor"]})
    page3 = body["data"]["tags"]
    assert len(page3["edges"]) == 1
    assert page3["pageInfo"]["hasNextPage"] is False
