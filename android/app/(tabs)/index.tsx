import { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useQuery } from 'urql';
import keyBy from 'lodash.keyby';
import { useStore, type User } from '@/lib/store';
import { USERS_QUERY } from '@/lib/graphql/queries';
import { buildListItems, type ListItem } from '@/lib/utils';
import { colors } from '@/styles/theme';
import { styles } from '@/styles/index.styles';
import EntryCard from '@/components/EntryCard';
import DateDivider from '@/components/DateDivider';
import MoodModal from '@/components/MoodModal';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { usePaginatedEntries } from '@/lib/usePaginatedEntries';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TimelineScreen() {
  const currentUserId = useStore((s) => s.currentUserId);
  const authToken = useStore((s) => s.authToken);
  const users = useStore((s) => s.users);
  const setUsers = useStore((s) => s.setUsers);
  const openMoodModal = useStore((s) => s.openMoodModal);
  const insets = useSafeAreaInsets();
  const ready = !!authToken;

  const [usersResult] = useQuery<{ users: User[] }>({ query: USERS_QUERY, pause: !ready });
  useEffect(() => {
    if (usersResult.data?.users?.length) setUsers(usersResult.data.users);
  }, [usersResult.data, setUsers]);

  const userIds = useMemo(() => users.map((u) => u.id), [users]);
  const usersById = useMemo(() => keyBy(users, 'id') as Record<string, User>, [users]);

  const { allEdges, fetching, error, loadingMore, loadMore, onRefresh } = usePaginatedEntries(
    userIds,
    ready,
  );

  const listItems = useMemo(
    () => buildListItems(allEdges, currentUserId, usersById),
    [allEdges, currentUserId, usersById],
  );

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === 'divider') return <DateDivider label={item.label} />;
    return <EntryCard entry={item.entry} user={item.user} mine={item.mine} />;
  }, []);

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
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={fetching && allEdges.length > 0}
            onRefresh={onRefresh}
            tintColor={colors.blue}
            colors={[colors.blue]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          fetching ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.blue} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>Failed to load entries</Text>
              <Text style={styles.emptyDetail}>Pull down to retry.</Text>
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

      <Pressable
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 8 }]}
        onPress={openMoodModal}
      >
        <FontAwesome name="plus" size={22} color={colors.darkText} />
      </Pressable>

      <MoodModal onSaved={onRefresh} />
    </View>
  );
}
