export const USERS_QUERY = `
  { users { id name email icon settings sharedWith { id user { id name } filters { id pattern isInclude } } } }
`;

export const MOOD_ENTRIES_QUERY = `
  query MoodEntries($userIds: [ID!], $first: Int, $after: String) {
    moodEntries(userIds: $userIds, first: $first, after: $after) {
      edges {
        cursor
        node { id mood delta notes createdAt archivedAt user { id name } tags { name metadata } }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const SEARCH_USERS_QUERY = `
  query SearchUsers($search: String!) {
    searchUsers(search: $search) { id name email icon }
  }
`;

export const TAGS_QUERY = `
  query Tags($search: String, $includeArchived: Boolean, $first: Int, $after: String) {
    tags(search: $search, includeArchived: $includeArchived, first: $first, after: $after) {
      edges { cursor node { name metadata archivedAt } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;
