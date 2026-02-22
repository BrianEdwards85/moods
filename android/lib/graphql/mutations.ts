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
