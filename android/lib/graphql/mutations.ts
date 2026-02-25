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
      token user { id name email icon settings }
    }
  }
`;

export const UPDATE_USER_SETTINGS_MUTATION = `
  mutation UpdateUserSettings($input: UpdateUserSettingsInput!) {
    updateUserSettings(input: $input) { id settings }
  }
`;

export const UPDATE_SHARING_MUTATION = `
  mutation UpdateSharing($input: UpdateSharingInput!) {
    updateSharing(input: $input) {
      id sharedWith { id user { id name } filters { id pattern isInclude } }
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken {
    refreshToken { token }
  }
`;
