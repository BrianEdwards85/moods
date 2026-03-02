import { useCallback, useMemo, useState } from 'react';
import { useClient } from 'urql';
import debounce from 'lodash.debounce';
import { SEARCH_USERS_QUERY } from '@/lib/graphql/queries';
import { SEARCH_DEBOUNCE } from '@/lib/constants';

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

  const executeSearch = useMemo(
    () =>
      debounce(async (text: string) => {
        setSearching(true);
        try {
          const result = await urqlClient.query(SEARCH_USERS_QUERY, { search: text }).toPromise();
          setSearchResults(result.data?.searchUsers ?? []);
        } catch {
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      }, SEARCH_DEBOUNCE),
    [urqlClient],
  );

  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      if (!text.trim()) {
        executeSearch.cancel();
        setSearchResults([]);
        return;
      }
      executeSearch(text);
    },
    [executeSearch],
  );

  const clear = useCallback(() => {
    executeSearch.cancel();
    setSearchText('');
    setSearchResults([]);
  }, [executeSearch]);

  return { searchText, searching, searchResults, handleSearch, clear };
}
