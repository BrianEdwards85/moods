import { useCallback, useRef, useState } from 'react';
import { useClient } from 'urql';
import { SEARCH_USERS_QUERY } from '@/lib/graphql/queries';

export interface SearchUser {
  id: string;
  name: string;
  email: string;
}

export function useUserSearch() {
  const urqlClient = useClient();
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (!text.trim()) {
        setSearchResults([]);
        return;
      }
      searchDebounceRef.current = setTimeout(async () => {
        setSearching(true);
        const result = await urqlClient.query(SEARCH_USERS_QUERY, { search: text }).toPromise();
        setSearchResults(result.data?.searchUsers ?? []);
        setSearching(false);
      }, 300);
    },
    [urqlClient],
  );

  const clear = useCallback(() => {
    setSearchText('');
    setSearchResults([]);
  }, []);

  return { searchText, searching, searchResults, handleSearch, clear };
}
