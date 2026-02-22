export const LOG_MOOD_MUTATION = `
  mutation LogMood($input: LogMoodInput!) {
    logMood(input: $input) {
      id mood notes createdAt tags { name metadata }
    }
  }
`;

export const UPDATE_TAG_METADATA_MUTATION = `
  mutation UpdateTagMetadata($input: UpdateTagMetadataInput!) {
    updateTagMetadata(input: $input) { name metadata archivedAt }
  }
`;

export const ARCHIVE_TAG_MUTATION = `
  mutation ArchiveTag($name: String!) {
    archiveTag(name: $name) { name metadata archivedAt }
  }
`;

export const UNARCHIVE_TAG_MUTATION = `
  mutation UnarchiveTag($name: String!) {
    unarchiveTag(name: $name) { name metadata archivedAt }
  }
`;

export const SEND_LOGIN_CODE_MUTATION = `
  mutation SendLoginCode($email: String!) {
    sendLoginCode(email: $email) { success }
  }
`;

export const VERIFY_LOGIN_CODE_MUTATION = `
  mutation VerifyLoginCode($email: String!, $code: String!) {
    verifyLoginCode(email: $email, code: $code) {
      token user { id name email settings }
    }
  }
`;
