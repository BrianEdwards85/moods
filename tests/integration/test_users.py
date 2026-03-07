from assertpy import assert_that

from tests.integration.conftest import auth_header, gql

H = auth_header("00000000-0000-0000-0000-000000000000")

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
    body = await gql(
        client, CREATE_USER, {"input": {"name": name, "email": email}}, headers=H
    )
    return body["data"]["createUser"]


async def test_create_user(client):
    user = await _create_user(client)
    assert_that(user["name"]).is_equal_to("Alice")
    assert_that(user["email"]).is_equal_to("alice@example.com")
    assert_that(user["id"]).is_not_empty()
    assert_that(user["settings"]).is_equal_to({})
    assert_that(user["archivedAt"]).is_none()


async def test_list_users(client):
    await _create_user(client, "Alice", "alice@example.com")
    await _create_user(client, "Bob", "bob@example.com")

    body = await gql(client, USERS_QUERY)
    users = body["data"]["users"]
    assert_that(users).is_length(2)
    names = {u["name"] for u in users}
    assert_that(names).is_equal_to({"Alice", "Bob"})


async def test_get_user_by_id(client):
    created = await _create_user(client)
    body = await gql(client, USER_QUERY, {"id": created["id"]})
    user = body["data"]["user"]
    assert_that(user["id"]).is_equal_to(created["id"])
    assert_that(user["name"]).is_equal_to("Alice")


async def test_update_user_settings(client):
    created = await _create_user(client)
    new_settings = {"theme": "dark", "notifications": True}
    body = await gql(
        client,
        UPDATE_SETTINGS,
        {"input": {"settings": new_settings}},
        headers=auth_header(created["id"]),
    )
    updated = body["data"]["updateUserSettings"]
    assert_that(updated["settings"]).is_equal_to(new_settings)

    body = await gql(client, USER_QUERY, {"id": created["id"]})
    assert_that(body["data"]["user"]["settings"]).is_equal_to(new_settings)


async def test_archive_user(client):
    created = await _create_user(client)
    body = await gql(client, ARCHIVE_USER, {"id": created["id"]}, headers=H)
    archived = body["data"]["archiveUser"]
    assert_that(archived["archivedAt"]).is_not_none()


async def test_list_users_excludes_archived(client):
    alice = await _create_user(client, "Alice", "alice@example.com")
    await _create_user(client, "Bob", "bob@example.com")
    await gql(client, ARCHIVE_USER, {"id": alice["id"]}, headers=H)

    body = await gql(client, USERS_QUERY)
    users = body["data"]["users"]
    assert_that(users).is_length(1)
    assert_that(users[0]["name"]).is_equal_to("Bob")

    body = await gql(client, USERS_QUERY, {"includeArchived": True})
    users = body["data"]["users"]
    assert_that(users).is_length(2)
