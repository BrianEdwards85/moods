(ns moods.gql
  "GraphQL query and mutation strings, plus re-graph initialization.")

(def users-query
  "{ users { id name email settings } }")

(def user-query
  "query User($id: ID!) { user(id: $id) { id name email settings } }")

(def mood-entries-query
  "query MoodEntries($userIds: [ID!], $first: Int, $after: String) {
     moodEntries(userIds: $userIds, first: $first, after: $after) {
       edges {
         cursor
         node { id mood delta notes createdAt archivedAt user { id name } tags { name metadata } }
       }
       pageInfo { hasNextPage endCursor }
     }
   }")

(def tags-query
  "query Tags($search: String, $includeArchived: Boolean, $first: Int, $after: String) {
     tags(search: $search, includeArchived: $includeArchived, first: $first, after: $after) {
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

(def update-tag-metadata-mutation
  "mutation UpdateTagMetadata($input: UpdateTagMetadataInput!) {
     updateTagMetadata(input: $input) { name metadata archivedAt }
   }")

(def archive-tag-mutation
  "mutation ArchiveTag($name: String!) {
     archiveTag(name: $name) { name metadata archivedAt }
   }")

(def unarchive-tag-mutation
  "mutation UnarchiveTag($name: String!) {
     unarchiveTag(name: $name) { name metadata archivedAt }
   }")

(def send-login-code-mutation
  "mutation SendLoginCode($email: String!) {
     sendLoginCode(email: $email) { success }
   }")

(def verify-login-code-mutation
  "mutation VerifyLoginCode($email: String!, $code: String!) {
     verifyLoginCode(email: $email, code: $code) {
       token user { id name email settings }
     }
   }")
