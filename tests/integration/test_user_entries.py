from tests.integration.conftest import auth_header, gql

H = auth_header("00000000-0000-0000-0000-000000000000")

CREATE_USER = """
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) { id }
}
"""

LOG_MOOD = """
mutation LogMood($input: LogMoodInput!) {
  logMood(input: $input) { id }
}
"""

USER_WITH_ENTRIES = """
query UserEntries($id: ID!, $first: Int, $after: String, $includeArchived: Boolean) {
  user(id: $id) {
    id name
    entries(first: $first, after: $after, includeArchived: $includeArchived) {
      edges { cursor node { id mood notes } }
      pageInfo { hasNextPage endCursor }
    }
  }
}
"""


async def _create_user(client, name="Alice", email="alice@test.com"):
    body = await gql(
        client, CREATE_USER, {"input": {"name": name, "email": email}}, headers=H
    )
    return body["data"]["createUser"]["id"]


async def _log_mood(client, user_id, mood=7, notes="ok"):
    await gql(
        client,
        LOG_MOOD,
        {"input": {"mood": mood, "notes": notes, "tags": []}},
        headers=auth_header(user_id),
    )


async def test_user_entries_connection(client):
    uid = await _create_user(client)
    await _log_mood(client, uid, mood=8, notes="good")
    await _log_mood(client, uid, mood=3, notes="bad")

    h = auth_header(uid)
    body = await gql(client, USER_WITH_ENTRIES, {"id": uid}, headers=h)
    user = body["data"]["user"]
    assert user["name"] == "Alice"
    edges = user["entries"]["edges"]
    assert len(edges) == 2


async def test_user_entries_excludes_other_users(client):
    alice_id = await _create_user(client, "Alice", "alice@test.com")
    bob_id = await _create_user(client, "Bob", "bob@test.com")
    await _log_mood(client, alice_id, mood=8, notes="alice entry")
    await _log_mood(client, bob_id, mood=4, notes="bob entry")

    h_alice = auth_header(alice_id)
    body = await gql(client, USER_WITH_ENTRIES, {"id": alice_id}, headers=h_alice)
    edges = body["data"]["user"]["entries"]["edges"]
    assert len(edges) == 1
    assert edges[0]["node"]["notes"] == "alice entry"

    h_bob = auth_header(bob_id)
    body = await gql(client, USER_WITH_ENTRIES, {"id": bob_id}, headers=h_bob)
    edges = body["data"]["user"]["entries"]["edges"]
    assert len(edges) == 1
    assert edges[0]["node"]["notes"] == "bob entry"


async def test_user_entries_pagination(client):
    uid = await _create_user(client)
    for i in range(5):
        await _log_mood(client, uid, mood=i + 1, notes=f"entry {i}")

    h = auth_header(uid)
    body = await gql(client, USER_WITH_ENTRIES, {"id": uid, "first": 2}, headers=h)
    page1 = body["data"]["user"]["entries"]
    assert len(page1["edges"]) == 2
    assert page1["pageInfo"]["hasNextPage"] is True

    body = await gql(
        client,
        USER_WITH_ENTRIES,
        {"id": uid, "first": 2, "after": page1["pageInfo"]["endCursor"]},
        headers=h,
    )
    page2 = body["data"]["user"]["entries"]
    assert len(page2["edges"]) == 2
    assert page2["pageInfo"]["hasNextPage"] is True

    body = await gql(
        client,
        USER_WITH_ENTRIES,
        {"id": uid, "first": 2, "after": page2["pageInfo"]["endCursor"]},
        headers=h,
    )
    page3 = body["data"]["user"]["entries"]
    assert len(page3["edges"]) == 1
    assert page3["pageInfo"]["hasNextPage"] is False
