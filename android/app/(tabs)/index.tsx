import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useQuery } from 'urql';
import { useStore, type MoodEntry, type User } from '@/lib/store';
import { USERS_QUERY, MOOD_ENTRIES_QUERY } from '@/lib/graphql/queries';
import { dateKey, dateLabel } from '@/lib/utils';
import { colors } from '@/lib/theme';
import { styles } from './index.styles';
import EntryCard from '@/components/EntryCard';
import DateDivider from '@/components/DateDivider';
import MoodModal from '@/components/MoodModal';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const PAGE_SIZE = 20;
const POLL_INTERVAL = 60_000;

type ListItem =
  | { type: 'divider'; key: string; label: string }
  | { type: 'entry'; key: string; entry: MoodEntry; mine: boolean; user?: User };

export default function TimelineScreen() {
  const currentUserId = useStore((s) => s.currentUserId);
  const authToken = useStore((s) => s.authToken);
  const users = useStore((s) => s.users);
  const setUsers = useStore((s) => s.setUsers);
  const openMoodModal = useStore((s) => s.openMoodModal);
  const ready = !!authToken;

  const [usersResult] = useQuery({ query: USERS_QUERY, pause: !ready });
  useEffect(() => {
    if (usersResult.data?.users?.length) setUsers(usersResult.data.users);
  }, [usersResult.data]);

  const userIds = users.map((u) => u.id);
  const usersById: Record<string, User> = {};
  users.forEach((u) => (usersById[u.id] = u));

  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [allEdges, setAllEdges] = useState<{ cursor: string; node: MoodEntry }[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [entriesResult, reexecute] = useQuery({
    query: MOOD_ENTRIES_QUERY,
    variables: { userIds: userIds.length ? userIds : undefined, first: PAGE_SIZE },
    pause: !ready || !userIds.length,
    requestPolicy: 'network-only',
  });

  useEffect(() => {
    const data = entriesResult.data?.moodEntries;
    if (data) {
      setAllEdges(data.edges);
      setHasNextPage(data.pageInfo.hasNextPage);
      setEndCursor(data.pageInfo.endCursor);
    }
  }, [entriesResult.data]);

  // Polling
  useEffect(() => {
    if (!ready || !userIds.length) return;
    const interval = setInterval(() => reexecute({ requestPolicy: 'network-only' }), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [ready, userIds.length]);

  const [loadingMore, setLoadingMore] = useState(false);
  const [moreResult, executeMore] = useQuery({
    query: MOOD_ENTRIES_QUERY,
    variables: {
      userIds: userIds.length ? userIds : undefined,
      first: PAGE_SIZE,
      after: endCursor,
    },
    pause: true,
  });

  const loadMore = useCallback(() => {
    if (!hasNextPage || loadingMore) return;
    setLoadingMore(true);
    executeMore({ requestPolicy: 'network-only' });
  }, [hasNextPage, loadingMore, endCursor]);

  useEffect(() => {
    const data = moreResult.data?.moodEntries;
    if (data && loadingMore) {
      setAllEdges((prev) => [...prev, ...data.edges]);
      setHasNextPage(data.pageInfo.hasNextPage);
      setEndCursor(data.pageInfo.endCursor);
      setLoadingMore(false);
    }
  }, [moreResult.data]);

  const listItems: ListItem[] = [];
  allEdges.forEach((edge, idx) => {
    const curDate = dateKey(edge.node.createdAt);
    const prevDate = idx > 0 ? dateKey(allEdges[idx - 1].node.createdAt) : null;
    if (idx === 0 || curDate !== prevDate) {
      listItems.push({
        type: 'divider',
        key: `d-${curDate}`,
        label: dateLabel(edge.node.createdAt),
      });
    }
    const mine = edge.node.user?.id === currentUserId;
    listItems.push({
      type: 'entry',
      key: edge.node.id,
      entry: edge.node,
      mine,
      user: usersById[edge.node.user?.id],
    });
  });

  const onRefresh = useCallback(() => {
    reexecute({ requestPolicy: 'network-only' });
  }, [reexecute]);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={listItems}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          if (item.type === 'divider') return <DateDivider label={item.label} />;
          return <EntryCard entry={item.entry} user={item.user} mine={item.mine} />;
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={entriesResult.fetching && allEdges.length > 0}
            onRefresh={onRefresh}
            tintColor={colors.blue}
            colors={[colors.blue]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          entriesResult.fetching ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.blue} />
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No entries yet</Text>
              <Text style={styles.emptyDetail}>Mood entries will appear here.</Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color={colors.blue} />
          ) : null
        }
      />

      <Pressable style={styles.fab} onPress={openMoodModal}>
        <FontAwesome name="plus" size={22} color={colors.darkText} />
      </Pressable>

      <MoodModal onSaved={onRefresh} />
    </View>
  );
}
