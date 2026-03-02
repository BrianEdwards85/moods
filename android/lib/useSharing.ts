import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useMutation } from 'urql';
import debounce from 'lodash.debounce';
import { UPDATE_SHARING_MUTATION } from '@/lib/graphql/mutations';
import type { User } from '@/lib/store';
import { AUTO_SAVE_DEBOUNCE } from '@/lib/constants';

export interface ShareFilter {
  pattern: string;
  isInclude: boolean;
}

export interface ShareConfig {
  shared: boolean;
  filters: ShareFilter[];
  name: string;
}

export function useSharing(currentUser: User | undefined) {
  const [shares, setShares] = useState<Record<string, ShareConfig>>({});
  const [, updateSharing] = useMutation(UPDATE_SHARING_MUTATION);
  const [savingSharing, setSavingSharing] = useState(false);
  const serverSharesRef = useRef('{}');

  useEffect(() => {
    if (currentUser) {
      const shareMap: Record<string, ShareConfig> = {};
      for (const rule of currentUser.sharedWith ?? []) {
        shareMap[rule.user.id] = {
          shared: true,
          filters: rule.filters.map((f) => ({
            pattern: f.pattern,
            isInclude: f.isInclude,
          })),
          name: rule.user.name,
        };
      }
      serverSharesRef.current = JSON.stringify(shareMap);
      setShares(shareMap);
    }
  }, [currentUser]);

  const debouncedSave = useMemo(
    () =>
      debounce(async (snapshot: Record<string, ShareConfig>) => {
        const current = JSON.stringify(snapshot);
        if (current === serverSharesRef.current) return;
        setSavingSharing(true);
        const rules = Object.entries(snapshot)
          .filter(([, cfg]) => cfg.shared)
          .map(([userId, cfg]) => ({
            userId,
            filters: cfg.filters,
          }));
        const result = await updateSharing({ input: { rules } });
        setSavingSharing(false);
        if (result.error) {
          Alert.alert('Error', 'Failed to save sharing settings.');
        } else {
          serverSharesRef.current = current;
        }
      }, AUTO_SAVE_DEBOUNCE),
    [updateSharing],
  );

  // Auto-save shares when they change (debounced, skips server-synced state)
  useEffect(() => {
    debouncedSave(shares);
    return () => debouncedSave.cancel();
  }, [shares, debouncedSave]);

  const toggleShare = (userId: string) => {
    setShares((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        shared: !prev[userId]?.shared,
        filters: prev[userId]?.filters ?? [],
        name: prev[userId]?.name ?? '',
      },
    }));
  };

  const addFilter = (userId: string) => {
    setShares((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        filters: [...(prev[userId]?.filters ?? []), { pattern: '', isInclude: true }],
      },
    }));
  };

  const removeFilter = (userId: string, idx: number) => {
    setShares((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        filters: prev[userId].filters.filter((_, i) => i !== idx),
      },
    }));
  };

  const updateFilter = (
    userId: string,
    idx: number,
    field: keyof ShareFilter,
    value: string | boolean,
  ) => {
    setShares((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        filters: prev[userId].filters.map((f, i) => (i === idx ? { ...f, [field]: value } : f)),
      },
    }));
  };

  const addShare = (userId: string, name: string) => {
    setShares((prev) => ({
      ...prev,
      [userId]: { shared: true, filters: [], name },
    }));
  };

  const activeShares = Object.entries(shares)
    .filter(([, cfg]) => cfg.shared)
    .sort(([, a], [, b]) => a.name.localeCompare(b.name));

  return {
    savingSharing,
    activeShares,
    toggleShare,
    addFilter,
    removeFilter,
    updateFilter,
    addShare,
  };
}
