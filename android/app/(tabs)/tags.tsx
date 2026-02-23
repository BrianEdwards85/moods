import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery } from 'urql';
import { TAGS_QUERY } from '@/lib/graphql/queries';
import { colors, defaultTagColor } from '@/lib/theme';
import type { Tag } from '@/lib/store';
import TagEditModal from '@/components/TagEditModal';

const PAGE_SIZE = 30;

export default function TagsScreen() {
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const [allEdges, setAllEdges] = useState<{ cursor: string; node: Tag }[]>([]);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [result, reexecute] = useQuery({
    query: TAGS_QUERY,
    variables: {
      search: search || undefined,
      includeArchived: showArchived,
      first: PAGE_SIZE,
    },
    requestPolicy: 'network-only',
  });

  const edges = result.data?.tags?.edges ?? [];
  const pageInfo = result.data?.tags?.pageInfo;

  const [loadingMore, setLoadingMore] = useState(false);
  const [moreResult, executeMore] = useQuery({
    query: TAGS_QUERY,
    variables: {
      search: search || undefined,
      includeArchived: showArchived,
      first: PAGE_SIZE,
      after: pageInfo?.endCursor,
    },
    pause: true,
  });

  const loadMore = useCallback(() => {
    if (!pageInfo?.hasNextPage || loadingMore) return;
    setLoadingMore(true);
    executeMore({ requestPolicy: 'network-only' });
  }, [pageInfo, loadingMore]);

  const onRefresh = useCallback(() => {
    reexecute({ requestPolicy: 'network-only' });
  }, [reexecute]);

  const toggleArchived = () => {
    setShowArchived((prev) => !prev);
  };

  const onTagSaved = () => {
    setEditingTag(null);
    onRefresh();
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search tags..."
          placeholderTextColor={colors.fgDim}
        />
        <View style={styles.archivedToggle}>
          <Text style={styles.archivedLabel}>Archived</Text>
          <Switch
            value={showArchived}
            onValueChange={toggleArchived}
            trackColor={{ false: colors.border, true: colors.blue }}
            thumbColor={colors.fg}
          />
        </View>
      </View>

      <FlatList
        data={edges}
        keyExtractor={(item) => item.node.name}
        renderItem={({ item }) => {
          const tag = item.node;
          const bg = tag.metadata?.color || defaultTagColor;
          const archived = !!tag.archivedAt;
          return (
            <Pressable onPress={() => setEditingTag(tag)}>
              <View style={[styles.tagRow, { backgroundColor: bg }]}>
                <View style={styles.tagContent}>
                  {tag.metadata?.face ? (
                    <Text style={styles.face}>{tag.metadata.face}</Text>
                  ) : null}
                  <Text
                    style={[
                      styles.tagName,
                      archived && styles.tagArchived,
                    ]}
                  >
                    {tag.name}
                  </Text>
                </View>
                {archived && <Text style={styles.archivedBadge}>archived</Text>}
              </View>
            </Pressable>
          );
        }}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          result.fetching ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.blue} size="large" />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tags found</Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color={colors.blue} />
          ) : null
        }
      />

      <TagEditModal
        tag={editingTag}
        onClose={() => setEditingTag(null)}
        onSaved={onTagSaved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.bgFloat,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.fg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  archivedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  archivedLabel: {
    fontSize: 12,
    color: colors.fgDim,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  face: {
    fontSize: 18,
  },
  tagName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2335',
  },
  tagArchived: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  archivedBadge: {
    fontSize: 10,
    color: '#1f2335',
    opacity: 0.5,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.fgDim,
  },
});
