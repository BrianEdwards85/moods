from tests.conftest import gql

CREATE_USER = """
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id name email settings archivedAt
  }
}
"""

USERS_QUERY = """
query Users($includeArchived: Boolean) {
  users(includeArchived: $includeArchived) {
    id name email settings archivedAt
  }
}
"""

USER_QUERY = """
query User($id: ID!) {
  user(id: $id) {
    id name email settings archivedAt
  }
}
"""

UPDATE_SETTINGS = """
mutation UpdateSettings($input: UpdateUserSettingsInput!) {
  updateUserSettings(input: $input) {
    id settings
  }
}
"""

ARCHIVE_USER = """
mutation ArchiveUser($id: ID!) {
  archiveUser(id: $id) {
    id archivedAt
  }
}
"""


async def _create_user(client, name="Alice", email="alice@example.com"):
    body = await gql(client, CREATE_USER, {"input": {"name": name, "email": email}})
    return body["data"]["createUser"]


async def test_create_user(client):
    user = await _create_user(client)
    assert user["name"] == "Alice"
    assert user["email"] == "alice@example.com"
    assert user["id"]
    assert user["settings"] == {}
    assert user["archivedAt"] is None


async def test_list_users(client):
    await _create_user(client, "Alice", "alice@example.com")
    await _create_user(client, "Bob", "bob@example.com")

    body = await gql(client, USERS_QUERY)
    users = body["data"]["users"]
    assert len(users) == 2
    names = {u["name"] for u in users}
    assert names == {"Alice", "Bob"}


async def test_get_user_by_id(client):
    created = await _create_user(client)
    body = await gql(client, USER_QUERY, {"id": created["id"]})
    user = body["data"]["user"]
    assert user["id"] == created["id"]
    assert user["name"] == "Alice"


async def test_update_user_settings(client):
    created = await _create_user(client)
    new_settings = {"theme": "dark", "notifications": True}
    body = await gql(
        client, UPDATE_SETTINGS,
        {"input": {"id": created["id"], "settings": new_settings}},
    )
    updated = body["data"]["updateUserSettings"]
    assert updated["settings"] == new_settings

    body = await gql(client, USER_QUERY, {"id": created["id"]})
    assert body["data"]["user"]["settings"] == new_settings


async def test_archive_user(client):
    created = await _create_user(client)
    body = await gql(client, ARCHIVE_USER, {"id": created["id"]})
    archived = body["data"]["archiveUser"]
    assert archived["archivedAt"] is not None


async def test_list_users_excludes_archived(client):
    alice = await _create_user(client, "Alice", "alice@example.com")
    await _create_user(client, "Bob", "bob@example.com")
    await gql(client, ARCHIVE_USER, {"id": alice["id"]})

    body = await gql(client, USERS_QUERY)
    users = body["data"]["users"]
    assert len(users) == 1
    assert users[0]["name"] == "Bob"

    body = await gql(client, USERS_QUERY, {"includeArchived": True})
    users = body["data"]["users"]
    assert len(users) == 2
