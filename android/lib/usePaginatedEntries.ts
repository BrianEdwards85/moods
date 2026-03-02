import { useCallback, useEffect, useState } from 'react';
import { useQuery } from 'urql';
import { MOOD_ENTRIES_QUERY } from '@/lib/graphql/queries';
import type { MoodEntry } from '@/lib/store';
import { ENTRIES_PAGE_SIZE, POLL_INTERVAL } from '@/lib/constants';

export function usePaginatedEntries(userIds: string[], ready: boolean) {
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [allEdges, setAllEdges] = useState<{ cursor: string; node: MoodEntry }[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [entriesResult, reexecute] = useQuery({
    query: MOOD_ENTRIES_QUERY,
    variables: { userIds: userIds.length ? userIds : undefined, first: ENTRIES_PAGE_SIZE },
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
  }, [ready, userIds.length, reexecute]);

  const [loadingMore, setLoadingMore] = useState(false);
  const [moreResult, executeMore] = useQuery({
    query: MOOD_ENTRIES_QUERY,
    variables: {
      userIds: userIds.length ? userIds : undefined,
      first: ENTRIES_PAGE_SIZE,
      after: endCursor,
    },
    pause: true,
  });

  const loadMore = useCallback(() => {
    if (!hasNextPage || loadingMore) return;
    setLoadingMore(true);
    executeMore({ requestPolicy: 'network-only' });
  }, [hasNextPage, loadingMore, executeMore]);

  useEffect(() => {
    const data = moreResult.data?.moodEntries;
    if (data && loadingMore) {
      setAllEdges((prev) => [...prev, ...data.edges]);
      setHasNextPage(data.pageInfo.hasNextPage);
      setEndCursor(data.pageInfo.endCursor);
      setLoadingMore(false);
    }
  }, [moreResult.data, loadingMore]);

  const onRefresh = useCallback(() => {
    reexecute({ requestPolicy: 'network-only' });
  }, [reexecute]);

  return {
    allEdges,
    fetching: entriesResult.fetching,
    loadingMore,
    loadMore,
    onRefresh,
  };
}
