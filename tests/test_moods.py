from tests.conftest import auth_header, gql

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
query MoodEntries($userIds: [ID!], $includeArchived: Boolean, $first: Int, $after: String) {
  moodEntries(userIds: $userIds, includeArchived: $includeArchived, first: $first, after: $after) {
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
    body = await gql(client, CREATE_USER, {"input": {"name": name, "email": email}}, headers=H)
    return body["data"]["createUser"]


async def _log_mood(client, user_id, mood=7, notes="feeling good", tags=None):
    body = await gql(client, LOG_MOOD, {
        "input": {"userId": user_id, "mood": mood, "notes": notes, "tags": tags or []}
    }, headers=H)
    return body["data"]["logMood"]


async def test_log_mood(client):
    user = await _create_user(client)
    entry = await _log_mood(client, user["id"], mood=8, notes="great day", tags=["happy", "sunny"])

    assert entry["mood"] == 8
    assert entry["notes"] == "great day"
    assert entry["createdAt"] is not None
    assert entry["archivedAt"] is None
    assert entry["user"]["id"] == user["id"]
    assert entry["user"]["name"] == "Alice"
    tag_names = sorted(t["name"] for t in entry["tags"])
    assert tag_names == ["happy", "sunny"]


async def test_query_mood_entries(client):
    user = await _create_user(client)
    await _log_mood(client, user["id"], mood=3, notes="rough")
    await _log_mood(client, user["id"], mood=9, notes="amazing")

    body = await gql(client, MOOD_ENTRIES_QUERY, headers=H)
    edges = body["data"]["moodEntries"]["edges"]
    assert len(edges) == 2


async def test_query_mood_entries_by_user(client):
    alice = await _create_user(client, "Alice", "alice@test.com")
    bob = await _create_user(client, "Bob", "bob@test.com")
    await _log_mood(client, alice["id"], mood=5, notes="meh")
    await _log_mood(client, bob["id"], mood=9, notes="great")

    body = await gql(client, MOOD_ENTRIES_QUERY, {"userIds": [alice["id"]]}, headers=H)
    edges = body["data"]["moodEntries"]["edges"]
    assert len(edges) == 1
    assert edges[0]["node"]["mood"] == 5
    assert edges[0]["node"]["user"]["id"] == alice["id"]


async def test_query_mood_entries_multiple_users(client):
    alice = await _create_user(client, "Alice", "alice@test.com")
    bob = await _create_user(client, "Bob", "bob@test.com")
    await _log_mood(client, alice["id"], mood=5, notes="alice entry")
    await _log_mood(client, bob["id"], mood=9, notes="bob entry")

    body = await gql(client, MOOD_ENTRIES_QUERY, {"userIds": [alice["id"], bob["id"]]}, headers=H)
    edges = body["data"]["moodEntries"]["edges"]
    assert len(edges) == 2
    user_ids = {e["node"]["user"]["id"] for e in edges}
    assert alice["id"] in user_ids
    assert bob["id"] in user_ids


async def test_archive_mood_entry(client):
    user = await _create_user(client)
    entry = await _log_mood(client, user["id"])
    body = await gql(client, ARCHIVE_ENTRY, {"id": entry["id"]}, headers=H)
    assert body["data"]["archiveMoodEntry"]["archivedAt"] is not None

    body = await gql(client, MOOD_ENTRIES_QUERY, headers=H)
    assert len(body["data"]["moodEntries"]["edges"]) == 0

    body = await gql(client, MOOD_ENTRIES_QUERY, {"includeArchived": True}, headers=H)
    assert len(body["data"]["moodEntries"]["edges"]) == 1


async def test_mood_entry_has_user(client):
    user = await _create_user(client)
    await _log_mood(client, user["id"])

    body = await gql(client, MOOD_ENTRIES_QUERY, headers=H)
    node = body["data"]["moodEntries"]["edges"][0]["node"]
    assert node["user"]["id"] == user["id"]
    assert node["user"]["name"] == "Alice"


async def test_mood_entry_has_tags(client):
    user = await _create_user(client)
    await _log_mood(client, user["id"], tags=["exercise", "meditation"])

    body = await gql(client, MOOD_ENTRIES_QUERY, headers=H)
    node = body["data"]["moodEntries"]["edges"][0]["node"]
    tag_names = sorted(t["name"] for t in node["tags"])
    assert tag_names == ["exercise", "meditation"]


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
    await _log_mood(client, user["id"], mood=5, notes="first")
    await _log_mood(client, user["id"], mood=8, notes="second")
    await _log_mood(client, user["id"], mood=3, notes="third")

    body = await gql(client, DELTA_QUERY, {"userIds": [user["id"]]}, headers=H)
    edges = body["data"]["moodEntries"]["edges"]

    # Returned newest-first: third(3), second(8), first(5)
    assert edges[0]["node"]["mood"] == 3
    assert edges[0]["node"]["delta"] == -5  # 3 - 8
    assert edges[1]["node"]["mood"] == 8
    assert edges[1]["node"]["delta"] == 3   # 8 - 5
    assert edges[2]["node"]["mood"] == 5
    assert edges[2]["node"]["delta"] is None  # first entry, no prior


async def test_mood_entry_delta_per_user(client):
    alice = await _create_user(client, "Alice", "alice@test.com")
    bob = await _create_user(client, "Bob", "bob@test.com")

    await _log_mood(client, alice["id"], mood=4, notes="a1")
    await _log_mood(client, bob["id"], mood=7, notes="b1")
    await _log_mood(client, alice["id"], mood=9, notes="a2")

    body = await gql(client, DELTA_QUERY, headers=H)
    edges = body["data"]["moodEntries"]["edges"]

    # Newest-first: alice 9, bob 7, alice 4
    deltas = {(e["node"]["user"]["id"], e["node"]["mood"]): e["node"]["delta"] for e in edges}
    assert deltas[(alice["id"], 9)] == 5    # 9 - 4
    assert deltas[(bob["id"], 7)] is None   # bob's first
    assert deltas[(alice["id"], 4)] is None  # alice's first


async def test_mood_entry_delta_across_pages(client):
    user = await _create_user(client)
    await _log_mood(client, user["id"], mood=2, notes="first")
    await _log_mood(client, user["id"], mood=6, notes="second")
    await _log_mood(client, user["id"], mood=10, notes="third")

    # Page 1: newest two entries
    body = await gql(client, DELTA_QUERY, {"userIds": [user["id"]], "first": 2}, headers=H)
    page1 = body["data"]["moodEntries"]
    assert page1["edges"][0]["node"]["delta"] == 4   # 10 - 6
    assert page1["edges"][1]["node"]["delta"] == 4   # 6 - 2

    # Page 2: oldest entry — delta still computed correctly via CTE
    body = await gql(client, DELTA_QUERY, {
        "userIds": [user["id"]], "first": 2, "after": page1["pageInfo"]["endCursor"]
    }, headers=H)
    page2 = body["data"]["moodEntries"]
    assert len(page2["edges"]) == 1
    assert page2["edges"][0]["node"]["delta"] is None  # first entry


async def test_mood_entries_pagination(client):
    user = await _create_user(client)
    for i in range(5):
        await _log_mood(client, user["id"], mood=i + 1, notes=f"entry {i}")

    body = await gql(client, MOOD_ENTRIES_QUERY, {"first": 2}, headers=H)
    page1 = body["data"]["moodEntries"]
    assert len(page1["edges"]) == 2
    assert page1["pageInfo"]["hasNextPage"] is True

    body = await gql(client, MOOD_ENTRIES_QUERY, {"first": 2, "after": page1["pageInfo"]["endCursor"]}, headers=H)
    page2 = body["data"]["moodEntries"]
    assert len(page2["edges"]) == 2
    assert page2["pageInfo"]["hasNextPage"] is True

    body = await gql(client, MOOD_ENTRIES_QUERY, {"first": 2, "after": page2["pageInfo"]["endCursor"]}, headers=H)
    page3 = body["data"]["moodEntries"]
    assert len(page3["edges"]) == 1
    assert page3["pageInfo"]["hasNextPage"] is False
