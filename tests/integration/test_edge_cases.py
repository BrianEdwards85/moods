import uuid

from assertpy import assert_that

from tests.integration.conftest import auth_header, gql

H = auth_header("00000000-0000-0000-0000-000000000000")

CREATE_USER = """
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) { id }
}
"""

USER_QUERY = """
query User($id: ID!) {
  user(id: $id) { id name }
}
"""

LOG_MOOD = """
mutation LogMood($input: LogMoodInput!) {
  logMood(input: $input) { id }
}
"""

ARCHIVE_TAG = """
mutation ArchiveTag($name: String!) {
  archiveTag(name: $name) { name archivedAt }
}
"""

ARCHIVE_ENTRY = """
mutation ArchiveMoodEntry($id: ID!) {
  archiveMoodEntry(id: $id) { id archivedAt }
}
"""


async def test_user_not_found(client):
    fake_id = str(uuid.uuid4())
    body = await gql(client, USER_QUERY, {"id": fake_id})
    assert_that(body["data"]["user"]).is_none()


async def test_archive_nonexistent_tag(client):
    body = await gql(
        client, ARCHIVE_TAG, {"name": "nope"}, expect_errors=True, headers=H
    )
    assert_that(body["data"] is None or body["data"]["archiveTag"] is None).is_true()
    codes = [e.get("extensions", {}).get("code") for e in body["errors"]]
    assert_that(codes).contains("NOT_FOUND")


async def test_archive_nonexistent_mood_entry(client):
    fake_id = str(uuid.uuid4())
    body = await gql(
        client, ARCHIVE_ENTRY, {"id": fake_id}, expect_errors=True, headers=H
    )
    assert_that(body["data"] is None or body["data"]["archiveMoodEntry"] is None).is_true()
    codes = [e.get("extensions", {}).get("code") for e in body["errors"]]
    assert_that(codes).contains("NOT_FOUND")


async def test_log_mood_nonexistent_user(client):
    fake_id = str(uuid.uuid4())
    body = await gql(
        client,
        LOG_MOOD,
        {"input": {"mood": 5, "notes": "test", "tags": []}},
        expect_errors=True,
        headers=auth_header(fake_id),
    )
    assert_that(body).contains_key("errors")


async def test_create_duplicate_email(client):
    body = await gql(
        client,
        CREATE_USER,
        {"input": {"name": "A", "email": "same@test.com"}},
        headers=H,
    )
    assert_that(body["data"]["createUser"]["id"]).is_not_empty()

    body = await gql(
        client,
        CREATE_USER,
        {"input": {"name": "B", "email": "same@test.com"}},
        expect_errors=True,
        headers=H,
    )
    assert_that(body).contains_key("errors")


async def test_archive_already_archived_tag(client):
    body = await gql(
        client, CREATE_USER, {"input": {"name": "T", "email": "t@test.com"}}, headers=H
    )
    uid = body["data"]["createUser"]["id"]
    await gql(
        client,
        LOG_MOOD,
        {"input": {"mood": 5, "notes": "", "tags": ["dup"]}},
        headers=auth_header(uid),
    )

    body = await gql(client, ARCHIVE_TAG, {"name": "dup"}, headers=H)
    assert_that(body["data"]["archiveTag"]["archivedAt"]).is_not_none()

    body = await gql(
        client, ARCHIVE_TAG, {"name": "dup"}, expect_errors=True, headers=H
    )
    assert_that(body).contains_key("errors")
