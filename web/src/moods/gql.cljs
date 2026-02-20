(ns moods.gql
  "GraphQL query and mutation strings, plus re-graph initialization.")

(def users-query
  "{ users { id name email } }")

(def user-query
  "query User($id: ID!) { user(id: $id) { id name email } }")

(def mood-entries-query
  "query MoodEntries($userId: ID, $first: Int, $after: String) {
     moodEntries(userId: $userId, first: $first, after: $after) {
       edges {
         cursor
         node { id mood notes createdAt archivedAt tags { name metadata } }
       }
       pageInfo { hasNextPage endCursor }
     }
   }")

(def tags-query
  "query Tags($search: String, $first: Int, $after: String) {
     tags(search: $search, first: $first, after: $after) {
       edges { cursor node { name metadata archivedAt } }
       pageInfo { hasNextPage endCursor }
     }
   }")

(def log-mood-mutation
  "mutation LogMood($input: LogMoodInput!) {
     logMood(input: $input) {
       id mood notes createdAt tags { name metadata }
     }
   }")

(def archive-entry-mutation
  "mutation ArchiveEntry($id: ID!) {
     archiveMoodEntry(id: $id) { id archivedAt }
   }")
