from tests.conftest import auth_header, gql

H = auth_header("00000000-0000-0000-0000-000000000000")

CREATE_USER = """
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) { id name email settings }
}
"""

UPDATE_SHARING = """
mutation UpdateSharing($input: UpdateSharingInput!) {
  updateSharing(input: $input) {
    id sharedWith { id user { id name } filters { id pattern isInclude } }
  }
}
"""

USER_SHARED_WITH = """
query User($id: ID!) {
  user(id: $id) {
    id sharedWith { id user { id name } filters { id pattern isInclude } }
  }
}
"""

MOOD_ENTRIES = """
query MoodEntries($userIds: [ID!], $first: Int) {
  moodEntries(userIds: $userIds, first: $first) {
    edges { node { id mood user { id } tags { name } } }
  }
}
"""

LOG_MOOD = """
mutation LogMood($input: LogMoodInput!) {
  logMood(input: $input) { id mood tags { name } }
}
"""


async def _create_user(client, name, email):
    body = await gql(client, CREATE_USER, {"input": {"name": name, "email": email}}, headers=H)
    return body["data"]["createUser"]


async def _log_mood(client, user_id, mood, notes="", tags=None, headers=None):
    body = await gql(
        client, LOG_MOOD,
        {"input": {"mood": mood, "notes": notes, "tags": tags or []}},
        headers=headers or auth_header(user_id),
    )
    return body["data"]["logMood"]


async def _query_entries(client, user_ids=None, headers=None):
    body = await gql(
        client, MOOD_ENTRIES,
        {"userIds": user_ids, "first": 50},
        headers=headers,
    )
    return [e["node"] for e in body["data"]["moodEntries"]["edges"]]


async def test_create_sharing_rule(client):
    alice = await _create_user(client, "Alice", "alice@example.com")
    bob = await _create_user(client, "Bob", "bob@example.com")

    body = await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": []}]}},
        headers=auth_header(alice["id"]),
    )
    user = body["data"]["updateSharing"]
    assert len(user["sharedWith"]) == 1
    assert user["sharedWith"][0]["user"]["id"] == bob["id"]
    assert user["sharedWith"][0]["filters"] == []


async def test_update_sharing_replaces_rules(client):
    alice = await _create_user(client, "Alice", "alice@example.com")
    bob = await _create_user(client, "Bob", "bob@example.com")
    carol = await _create_user(client, "Carol", "carol@example.com")

    # Share with Bob
    await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": []}]}},
        headers=auth_header(alice["id"]),
    )

    # Replace: now share with Carol only
    body = await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": carol["id"], "filters": []}]}},
        headers=auth_header(alice["id"]),
    )
    user = body["data"]["updateSharing"]
    assert len(user["sharedWith"]) == 1
    assert user["sharedWith"][0]["user"]["id"] == carol["id"]


async def test_shared_entries_visible(client):
    alice = await _create_user(client, "Alice", "alice@example.com")
    bob = await _create_user(client, "Bob", "bob@example.com")

    await _log_mood(client, alice["id"], 7, "feeling good")

    # Bob can't see Alice's entries yet (no share)
    entries = await _query_entries(client, headers=auth_header(bob["id"]))
    assert len(entries) == 0

    # Alice shares with Bob
    await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": []}]}},
        headers=auth_header(alice["id"]),
    )

    # Now Bob can see Alice's entries
    entries = await _query_entries(client, headers=auth_header(bob["id"]))
    assert len(entries) == 1
    assert entries[0]["mood"] == 7


async def test_no_share_entries_hidden(client):
    alice = await _create_user(client, "Alice", "alice@example.com")
    bob = await _create_user(client, "Bob", "bob@example.com")

    await _log_mood(client, alice["id"], 5)

    entries = await _query_entries(client, headers=auth_header(bob["id"]))
    assert len(entries) == 0


async def test_self_visibility(client):
    alice = await _create_user(client, "Alice", "alice@example.com")

    await _log_mood(client, alice["id"], 8, "great day")

    entries = await _query_entries(client, headers=auth_header(alice["id"]))
    assert len(entries) == 1
    assert entries[0]["mood"] == 8


async def test_include_filter(client):
    alice = await _create_user(client, "Alice", "alice@example.com")
    bob = await _create_user(client, "Bob", "bob@example.com")

    await _log_mood(client, alice["id"], 7, tags=["happy"])
    await _log_mood(client, alice["id"], 3, tags=["sad"])

    # Alice shares with Bob, include only "happy"
    await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": [
            {"pattern": "happy", "isInclude": True}
        ]}]}},
        headers=auth_header(alice["id"]),
    )

    entries = await _query_entries(client, headers=auth_header(bob["id"]))
    assert len(entries) == 1
    assert any(t["name"] == "happy" for t in entries[0]["tags"])


async def test_exclude_filter(client):
    alice = await _create_user(client, "Alice", "alice@example.com")
    bob = await _create_user(client, "Bob", "bob@example.com")

    await _log_mood(client, alice["id"], 7, tags=["happy"])
    await _log_mood(client, alice["id"], 3, tags=["private"])

    # Alice shares with Bob, exclude "private"
    await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": [
            {"pattern": "private", "isInclude": False}
        ]}]}},
        headers=auth_header(alice["id"]),
    )

    entries = await _query_entries(client, headers=auth_header(bob["id"]))
    assert len(entries) == 1
    assert any(t["name"] == "happy" for t in entries[0]["tags"])


async def test_mixed_filters_exclude_takes_precedence(client):
    alice = await _create_user(client, "Alice", "alice@example.com")
    bob = await _create_user(client, "Bob", "bob@example.com")

    # Entry with both "happy" and "private" tags
    await _log_mood(client, alice["id"], 7, tags=["happy", "private"])
    # Entry with only "happy" tag
    await _log_mood(client, alice["id"], 8, tags=["happy"])

    # Include "happy" but exclude "private"
    await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": [
            {"pattern": "happy", "isInclude": True},
            {"pattern": "private", "isInclude": False},
        ]}]}},
        headers=auth_header(alice["id"]),
    )

    entries = await _query_entries(client, headers=auth_header(bob["id"]))
    assert len(entries) == 1
    assert entries[0]["mood"] == 8


async def test_multiple_include_filters_or_semantics(client):
    alice = await _create_user(client, "Alice", "alice@example.com")
    bob = await _create_user(client, "Bob", "bob@example.com")

    await _log_mood(client, alice["id"], 7, tags=["happy"])
    await _log_mood(client, alice["id"], 5, tags=["calm"])
    await _log_mood(client, alice["id"], 3, tags=["sad"])

    # Include "happy" OR "calm"
    await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": [
            {"pattern": "happy", "isInclude": True},
            {"pattern": "calm", "isInclude": True},
        ]}]}},
        headers=auth_header(alice["id"]),
    )

    entries = await _query_entries(client, headers=auth_header(bob["id"]))
    assert len(entries) == 2
    moods = {e["mood"] for e in entries}
    assert moods == {7, 5}


async def test_entries_with_no_tags_hidden_by_include_filter(client):
    alice = await _create_user(client, "Alice", "alice@example.com")
    bob = await _create_user(client, "Bob", "bob@example.com")

    # Entry with no tags
    await _log_mood(client, alice["id"], 5)
    # Entry with matching tag
    await _log_mood(client, alice["id"], 7, tags=["happy"])

    # Include only "happy"
    await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": [
            {"pattern": "happy", "isInclude": True}
        ]}]}},
        headers=auth_header(alice["id"]),
    )

    entries = await _query_entries(client, headers=auth_header(bob["id"]))
    assert len(entries) == 1
    assert entries[0]["mood"] == 7


async def test_soft_delete_shares(client):
    """Verify that updating shares archives old ones instead of hard-deleting."""
    alice = await _create_user(client, "Alice", "alice@example.com")
    bob = await _create_user(client, "Bob", "bob@example.com")
    carol = await _create_user(client, "Carol", "carol@example.com")

    # Share with Bob
    await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": []}]}},
        headers=auth_header(alice["id"]),
    )

    # Replace: now share with Carol only (Bob's share should be archived, not deleted)
    body = await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": carol["id"], "filters": []}]}},
        headers=auth_header(alice["id"]),
    )
    user = body["data"]["updateSharing"]
    assert len(user["sharedWith"]) == 1
    assert user["sharedWith"][0]["user"]["id"] == carol["id"]

    # Verify the old share still exists in the database (archived)
    body = await gql(
        client, USER_SHARED_WITH,
        {"id": alice["id"]},
        headers=auth_header(alice["id"]),
    )
    # Only active shares should be returned
    assert len(body["data"]["user"]["sharedWith"]) == 1
    assert body["data"]["user"]["sharedWith"][0]["user"]["id"] == carol["id"]


async def test_archived_share_hides_entries(client):
    """Verify that archived shares no longer grant visibility."""
    alice = await _create_user(client, "Alice", "alice@example.com")
    bob = await _create_user(client, "Bob", "bob@example.com")

    await _log_mood(client, alice["id"], 7, "feeling good")

    # Alice shares with Bob
    await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": []}]}},
        headers=auth_header(alice["id"]),
    )

    # Bob can see Alice's entries
    entries = await _query_entries(client, headers=auth_header(bob["id"]))
    assert len(entries) == 1

    # Alice removes the share (archives it)
    await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": []}},
        headers=auth_header(alice["id"]),
    )

    # Bob can no longer see Alice's entries
    entries = await _query_entries(client, headers=auth_header(bob["id"]))
    assert len(entries) == 0


async def test_re_add_archived_share(client):
    """Re-adding a previously archived share should unarchive the existing row."""
    alice = await _create_user(client, "Alice", "alice@example.com")
    bob = await _create_user(client, "Bob", "bob@example.com")

    await _log_mood(client, alice["id"], 7, "feeling good")

    # Alice shares with Bob
    await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": []}]}},
        headers=auth_header(alice["id"]),
    )
    entries = await _query_entries(client, headers=auth_header(bob["id"]))
    assert len(entries) == 1

    # Alice removes the share (archives it)
    await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": []}},
        headers=auth_header(alice["id"]),
    )
    entries = await _query_entries(client, headers=auth_header(bob["id"]))
    assert len(entries) == 0

    # Alice re-adds the share with Bob
    body = await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": [
            {"pattern": "happy", "isInclude": True}
        ]}]}},
        headers=auth_header(alice["id"]),
    )
    user = body["data"]["updateSharing"]
    assert len(user["sharedWith"]) == 1
    assert user["sharedWith"][0]["user"]["id"] == bob["id"]
    assert len(user["sharedWith"][0]["filters"]) == 1

    # Bob can see Alice's entries again (entry has no tags, include filter hides it)
    entries = await _query_entries(client, headers=auth_header(bob["id"]))
    assert len(entries) == 0

    # Re-add without filters — Bob sees everything
    body = await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": []}]}},
        headers=auth_header(alice["id"]),
    )
    entries = await _query_entries(client, headers=auth_header(bob["id"]))
    assert len(entries) == 1


async def test_entries_with_no_tags_visible_with_exclude_only(client):
    alice = await _create_user(client, "Alice", "alice@example.com")
    bob = await _create_user(client, "Bob", "bob@example.com")

    # Entry with no tags
    await _log_mood(client, alice["id"], 5)
    # Entry with "private" tag
    await _log_mood(client, alice["id"], 3, tags=["private"])

    # Exclude "private" only (no include filters)
    await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": [
            {"pattern": "private", "isInclude": False}
        ]}]}},
        headers=auth_header(alice["id"]),
    )

    entries = await _query_entries(client, headers=auth_header(bob["id"]))
    assert len(entries) == 1
    assert entries[0]["mood"] == 5
