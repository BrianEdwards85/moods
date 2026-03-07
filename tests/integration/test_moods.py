from assertpy import assert_that

from tests.integration.conftest import auth_header, gql

H = auth_header("00000000-0000-0000-0000-000000000000")

CREATE_USER = """
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) { id name }
}
"""

LOG_MOOD = """
mutation LogMood($input: LogMoodInput!) {
  logMood(input: $input) {
    id mood notes createdAt archivedAt
    user { id name }
    tags { name }
  }
}
"""

MOOD_ENTRIES_QUERY = """
query MoodEntries(
  $userIds: [ID!], $includeArchived: Boolean, $first: Int, $after: String
) {
  moodEntries(
    userIds: $userIds, includeArchived: $includeArchived,
    first: $first, after: $after
  ) {
    edges {
      cursor
      node { id mood notes createdAt archivedAt user { id name } tags { name } }
    }
    pageInfo { hasNextPage endCursor }
  }
}
"""

ARCHIVE_ENTRY = """
mutation ArchiveMoodEntry($id: ID!) {
  archiveMoodEntry(id: $id) {
    id archivedAt
  }
}
"""


async def _create_user(client, name="Alice", email="alice@test.com"):
    body = await gql(
        client, CREATE_USER, {"input": {"name": name, "email": email}}, headers=H
    )
    return body["data"]["createUser"]


async def _log_mood(client, user_id, mood=7, notes="feeling good", tags=None):
    body = await gql(
        client,
        LOG_MOOD,
        {"input": {"mood": mood, "notes": notes, "tags": tags or []}},
        headers=auth_header(user_id),
    )
    return body["data"]["logMood"]


async def test_log_mood(client):
    user = await _create_user(client)
    entry = await _log_mood(
        client, user["id"], mood=8, notes="great day", tags=["happy", "sunny"]
    )

    assert_that(entry["mood"]).is_equal_to(8)
    assert_that(entry["notes"]).is_equal_to("great day")
    assert_that(entry["createdAt"]).is_not_none()
    assert_that(entry["archivedAt"]).is_none()
    assert_that(entry["user"]["id"]).is_equal_to(user["id"])
    assert_that(entry["user"]["name"]).is_equal_to("Alice")
    tag_names = sorted(t["name"] for t in entry["tags"])
    assert_that(tag_names).is_equal_to(["happy", "sunny"])


async def test_query_mood_entries(client):
    user = await _create_user(client)
    h = auth_header(user["id"])
    await _log_mood(client, user["id"], mood=3, notes="rough")
    await _log_mood(client, user["id"], mood=9, notes="amazing")

    body = await gql(client, MOOD_ENTRIES_QUERY, headers=h)
    edges = body["data"]["moodEntries"]["edges"]
    assert_that(edges).is_length(2)


async def test_query_mood_entries_by_user(client):
    alice = await _create_user(client, "Alice", "alice@test.com")
    bob = await _create_user(client, "Bob", "bob@test.com")
    await _log_mood(client, alice["id"], mood=5, notes="meh")
    await _log_mood(client, bob["id"], mood=9, notes="great")

    body = await gql(
        client,
        MOOD_ENTRIES_QUERY,
        {"userIds": [alice["id"]]},
        headers=auth_header(alice["id"]),
    )
    edges = body["data"]["moodEntries"]["edges"]
    assert_that(edges).is_length(1)
    assert_that(edges[0]["node"]["mood"]).is_equal_to(5)
    assert_that(edges[0]["node"]["user"]["id"]).is_equal_to(alice["id"])


async def test_query_mood_entries_multiple_users(client):
    alice = await _create_user(client, "Alice", "alice@test.com")
    bob = await _create_user(client, "Bob", "bob@test.com")
    await _log_mood(client, alice["id"], mood=5, notes="alice entry")
    await _log_mood(client, bob["id"], mood=9, notes="bob entry")

    # Alice shares with Bob so Bob can see both
    SHARE = (
        "mutation UpdateSharing($input: UpdateSharingInput!)"
        " { updateSharing(input: $input) { id } }"
    )
    await gql(
        client,
        SHARE,
        {"input": {"rules": [{"userId": bob["id"], "filters": []}]}},
        headers=auth_header(alice["id"]),
    )

    body = await gql(
        client,
        MOOD_ENTRIES_QUERY,
        {"userIds": [alice["id"], bob["id"]]},
        headers=auth_header(bob["id"]),
    )
    edges = body["data"]["moodEntries"]["edges"]
    assert_that(edges).is_length(2)
    user_ids = {e["node"]["user"]["id"] for e in edges}
    assert_that(user_ids).contains(alice["id"], bob["id"])


async def test_archive_mood_entry(client):
    user = await _create_user(client)
    h = auth_header(user["id"])
    entry = await _log_mood(client, user["id"])
    body = await gql(client, ARCHIVE_ENTRY, {"id": entry["id"]}, headers=h)
    assert_that(body["data"]["archiveMoodEntry"]["archivedAt"]).is_not_none()

    body = await gql(client, MOOD_ENTRIES_QUERY, headers=h)
    assert_that(body["data"]["moodEntries"]["edges"]).is_empty()

    body = await gql(client, MOOD_ENTRIES_QUERY, {"includeArchived": True}, headers=h)
    assert_that(body["data"]["moodEntries"]["edges"]).is_length(1)


async def test_archive_mood_entry_wrong_user(client):
    alice = await _create_user(client, "Alice", "alice@test.com")
    bob = await _create_user(client, "Bob", "bob@test.com")
    entry = await _log_mood(client, alice["id"])

    # Bob cannot archive Alice's entry
    body = await gql(
        client,
        ARCHIVE_ENTRY,
        {"id": entry["id"]},
        headers=auth_header(bob["id"]),
        expect_errors=True,
    )
    assert_that(body).contains_key("errors")


async def test_mood_entry_has_user(client):
    user = await _create_user(client)
    h = auth_header(user["id"])
    await _log_mood(client, user["id"])

    body = await gql(client, MOOD_ENTRIES_QUERY, headers=h)
    node = body["data"]["moodEntries"]["edges"][0]["node"]
    assert_that(node["user"]["id"]).is_equal_to(user["id"])
    assert_that(node["user"]["name"]).is_equal_to("Alice")


async def test_mood_entry_has_tags(client):
    user = await _create_user(client)
    h = auth_header(user["id"])
    await _log_mood(client, user["id"], tags=["exercise", "meditation"])

    body = await gql(client, MOOD_ENTRIES_QUERY, headers=h)
    node = body["data"]["moodEntries"]["edges"][0]["node"]
    tag_names = sorted(t["name"] for t in node["tags"])
    assert_that(tag_names).is_equal_to(["exercise", "meditation"])


DELTA_QUERY = """
query MoodEntries($userIds: [ID!], $first: Int, $after: String) {
  moodEntries(userIds: $userIds, first: $first, after: $after) {
    edges {
      node { id mood delta user { id } }
    }
    pageInfo { hasNextPage endCursor }
  }
}
"""


async def test_mood_entry_delta(client):
    user = await _create_user(client)
    h = auth_header(user["id"])
    await _log_mood(client, user["id"], mood=5, notes="first")
    await _log_mood(client, user["id"], mood=8, notes="second")
    await _log_mood(client, user["id"], mood=3, notes="third")

    body = await gql(client, DELTA_QUERY, {"userIds": [user["id"]]}, headers=h)
    edges = body["data"]["moodEntries"]["edges"]

    # Returned newest-first: third(3), second(8), first(5)
    assert_that(edges[0]["node"]["mood"]).is_equal_to(3)
    assert_that(edges[0]["node"]["delta"]).is_equal_to(-5)  # 3 - 8
    assert_that(edges[1]["node"]["mood"]).is_equal_to(8)
    assert_that(edges[1]["node"]["delta"]).is_equal_to(3)  # 8 - 5
    assert_that(edges[2]["node"]["mood"]).is_equal_to(5)
    assert_that(edges[2]["node"]["delta"]).is_none()  # first entry, no prior


async def test_mood_entry_delta_per_user(client):
    alice = await _create_user(client, "Alice", "alice@test.com")
    bob = await _create_user(client, "Bob", "bob@test.com")

    await _log_mood(client, alice["id"], mood=4, notes="a1")
    await _log_mood(client, bob["id"], mood=7, notes="b1")
    await _log_mood(client, alice["id"], mood=9, notes="a2")

    # Alice shares with Bob so Bob can see both users' entries
    SHARE = (
        "mutation UpdateSharing($input: UpdateSharingInput!)"
        " { updateSharing(input: $input) { id } }"
    )
    await gql(
        client,
        SHARE,
        {"input": {"rules": [{"userId": bob["id"], "filters": []}]}},
        headers=auth_header(alice["id"]),
    )

    body = await gql(client, DELTA_QUERY, headers=auth_header(bob["id"]))
    edges = body["data"]["moodEntries"]["edges"]

    # Newest-first: alice 9, bob 7, alice 4
    deltas = {
        (e["node"]["user"]["id"], e["node"]["mood"]): e["node"]["delta"] for e in edges
    }
    assert_that(deltas[(alice["id"], 9)]).is_equal_to(5)  # 9 - 4
    assert_that(deltas[(bob["id"], 7)]).is_none()  # bob's first
    assert_that(deltas[(alice["id"], 4)]).is_none()  # alice's first


async def test_mood_entry_delta_across_pages(client):
    user = await _create_user(client)
    h = auth_header(user["id"])
    await _log_mood(client, user["id"], mood=2, notes="first")
    await _log_mood(client, user["id"], mood=6, notes="second")
    await _log_mood(client, user["id"], mood=10, notes="third")

    # Page 1: newest two entries
    body = await gql(
        client, DELTA_QUERY, {"userIds": [user["id"]], "first": 2}, headers=h
    )
    page1 = body["data"]["moodEntries"]
    assert_that(page1["edges"][0]["node"]["delta"]).is_equal_to(4)  # 10 - 6
    assert_that(page1["edges"][1]["node"]["delta"]).is_equal_to(4)  # 6 - 2

    # Page 2: oldest entry — delta still computed correctly via CTE
    body = await gql(
        client,
        DELTA_QUERY,
        {"userIds": [user["id"]], "first": 2, "after": page1["pageInfo"]["endCursor"]},
        headers=h,
    )
    page2 = body["data"]["moodEntries"]
    assert_that(page2["edges"]).is_length(1)
    assert_that(page2["edges"][0]["node"]["delta"]).is_none()  # first entry


async def test_mood_entries_pagination(client):
    user = await _create_user(client)
    h = auth_header(user["id"])
    for i in range(5):
        await _log_mood(client, user["id"], mood=i + 1, notes=f"entry {i}")

    body = await gql(client, MOOD_ENTRIES_QUERY, {"first": 2}, headers=h)
    page1 = body["data"]["moodEntries"]
    assert_that(page1["edges"]).is_length(2)
    assert_that(page1["pageInfo"]["hasNextPage"]).is_true()

    body = await gql(
        client,
        MOOD_ENTRIES_QUERY,
        {"first": 2, "after": page1["pageInfo"]["endCursor"]},
        headers=h,
    )
    page2 = body["data"]["moodEntries"]
    assert_that(page2["edges"]).is_length(2)
    assert_that(page2["pageInfo"]["hasNextPage"]).is_true()

    body = await gql(
        client,
        MOOD_ENTRIES_QUERY,
        {"first": 2, "after": page2["pageInfo"]["endCursor"]},
        headers=h,
    )
    page3 = body["data"]["moodEntries"]
    assert_that(page3["edges"]).is_length(1)
    assert_that(page3["pageInfo"]["hasNextPage"]).is_false()
