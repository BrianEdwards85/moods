import uuid

from tests.conftest import gql

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
    assert body["data"]["user"] is None


async def test_archive_nonexistent_tag(client):
    body = await gql(client, ARCHIVE_TAG, {"name": "nope"}, expect_errors=True)
    assert body["data"] is None or body["data"]["archiveTag"] is None
    assert any("error" in e["message"].lower() or "not found" in e["message"].lower()
               for e in body["errors"])


async def test_archive_nonexistent_mood_entry(client):
    fake_id = str(uuid.uuid4())
    body = await gql(client, ARCHIVE_ENTRY, {"id": fake_id}, expect_errors=True)
    assert body["data"] is None or body["data"]["archiveMoodEntry"] is None
    assert any("not found" in e["message"].lower() or "error" in e["message"].lower()
               for e in body["errors"])


async def test_log_mood_nonexistent_user(client):
    fake_id = str(uuid.uuid4())
    body = await gql(client, LOG_MOOD, {
        "input": {"userId": fake_id, "mood": 5, "notes": "test", "tags": []}
    }, expect_errors=True)
    assert "errors" in body


async def test_create_duplicate_email(client):
    body = await gql(client, CREATE_USER, {"input": {"name": "A", "email": "same@test.com"}})
    assert body["data"]["createUser"]["id"]

    body = await gql(client, CREATE_USER, {
        "input": {"name": "B", "email": "same@test.com"}
    }, expect_errors=True)
    assert "errors" in body


async def test_archive_already_archived_tag(client):
    body = await gql(client, CREATE_USER, {"input": {"name": "T", "email": "t@test.com"}})
    uid = body["data"]["createUser"]["id"]
    await gql(client, LOG_MOOD, {
        "input": {"userId": uid, "mood": 5, "notes": "", "tags": ["dup"]}
    })

    body = await gql(client, ARCHIVE_TAG, {"name": "dup"})
    assert body["data"]["archiveTag"]["archivedAt"] is not None

    body = await gql(client, ARCHIVE_TAG, {"name": "dup"}, expect_errors=True)
    assert "errors" in body
