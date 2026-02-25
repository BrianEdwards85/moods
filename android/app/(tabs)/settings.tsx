import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useClient, useMutation, useQuery } from 'urql';
import { USERS_QUERY, SEARCH_USERS_QUERY } from '@/lib/graphql/queries';
import {
  UPDATE_USER_SETTINGS_MUTATION,
  UPDATE_SHARING_MUTATION,
} from '@/lib/graphql/mutations';
import { useStore } from '@/lib/store';
import { scheduleReminder, cancelReminder } from '@/lib/useNotifications';
import { colors, tagPresetColors } from '@/lib/theme';
import { styles } from './settings.styles';

interface ShareFilter {
  pattern: string;
  isInclude: boolean;
}

interface ShareConfig {
  shared: boolean;
  filters: ShareFilter[];
  name: string;
}

interface SearchUser {
  id: string;
  name: string;
  email: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const urqlClient = useClient();
  const { currentUserId, clearAuth } = useStore();

  const [usersResult] = useQuery({ query: USERS_QUERY });
  const users = usersResult.data?.users ?? [];
  const currentUser = users.find((u: any) => u.id === currentUserId);

  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [shares, setShares] = useState<Record<string, ShareConfig>>({});

  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [, updateSettings] = useMutation(UPDATE_USER_SETTINGS_MUTATION);
  const [, updateSharing] = useMutation(UPDATE_SHARING_MUTATION);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingSharing, setSavingSharing] = useState(false);

  // Track the server-synced shares state to avoid saving on initial load
  const serverSharesRef = useRef('{}');

  useEffect(() => {
    if (currentUser) {
      const settings = currentUser.settings as Record<string, any> | undefined;
      setAvatarUrl((settings?.avatarUrl as string) ?? '');
      setSelectedColor((settings?.color as string) ?? null);
      const notifications = (settings?.notifications as string[]) ?? [];
      setReminderEnabled(notifications.includes('reminder'));

      const shareMap: Record<string, ShareConfig> = {};
      for (const rule of currentUser.sharedWith ?? []) {
        shareMap[rule.user.id] = {
          shared: true,
          filters: rule.filters.map((f: any) => ({
            pattern: f.pattern,
            isInclude: f.isInclude,
          })),
          name: rule.user.name,
        };
      }
      serverSharesRef.current = JSON.stringify(shareMap);
      setShares(shareMap);
    }
  }, [currentUser?.id]);

  // Auto-save shares when they change (debounced, skips server-synced state)
  useEffect(() => {
    const current = JSON.stringify(shares);
    if (current === serverSharesRef.current) return;

    const timer = setTimeout(async () => {
      setSavingSharing(true);
      const rules = Object.entries(shares)
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
    }, 1000);

    return () => clearTimeout(timer);
  }, [shares]);

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

  const handleSaveProfile = useCallback(async () => {
    if (!currentUserId) return;
    setSavingSettings(true);
    const settings: Record<string, unknown> = {};
    if (avatarUrl) settings.avatarUrl = avatarUrl;
    if (selectedColor) settings.color = selectedColor;
    const notifications: string[] = [];
    if (reminderEnabled) notifications.push('reminder');
    settings.notifications = notifications;
    const result = await updateSettings({ input: { settings } });
    setSavingSettings(false);
    if (result.error) {
      Alert.alert('Error', 'Failed to save profile settings.');
    }
  }, [currentUserId, avatarUrl, selectedColor, reminderEnabled]);

  const handleToggleReminder = useCallback((value: boolean) => {
    setReminderEnabled(value);
    if (!value) {
      cancelReminder();
    } else {
      scheduleReminder();
    }
  }, []);

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

  const updateFilter = (userId: string, idx: number, field: keyof ShareFilter, value: any) => {
    setShares((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        filters: prev[userId].filters.map((f, i) => (i === idx ? { ...f, [field]: value } : f)),
      },
    }));
  };

  const addShareFromSearch = (user: SearchUser) => {
    setShares((prev) => ({
      ...prev,
      [user.id]: { shared: true, filters: [], name: user.name },
    }));
    setSearchText('');
    setSearchResults([]);
  };

  const handleSignOut = async () => {
    await cancelReminder();
    await clearAuth();
    router.replace('/user-select');
  };

  if (usersResult.fetching && !currentUser) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.blue} size="large" />
      </View>
    );
  }

  const activeShares = Object.entries(shares)
    .filter(([, cfg]) => cfg.shared)
    .sort(([, a], [, b]) => a.name.localeCompare(b.name));
  const activeIds = new Set(activeShares.map(([id]) => id));

  const filteredResults = searchResults.filter(
    (u) => u.id !== currentUserId && !activeIds.has(u.id),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Profile</Text>

      <Text style={styles.label}>Avatar URL</Text>
      <TextInput
        style={styles.input}
        value={avatarUrl}
        onChangeText={setAvatarUrl}
        placeholder="https://example.com/avatar.png"
        placeholderTextColor={colors.fgDim}
        autoCapitalize="none"
      />

      <Text style={styles.label}>User Color</Text>
      <View style={styles.colorRow}>
        {tagPresetColors.map((c) => (
          <Pressable
            key={c}
            style={[
              styles.colorSwatch,
              { backgroundColor: c },
              selectedColor === c && styles.colorSelected,
            ]}
            onPress={() => setSelectedColor(c)}
          />
        ))}
      </View>
      {selectedColor && (
        <Pressable onPress={() => setSelectedColor(null)}>
          <Text style={styles.clearText}>Clear color</Text>
        </Pressable>
      )}

      <Pressable style={styles.saveButton} onPress={handleSaveProfile} disabled={savingSettings}>
        {savingSettings ? (
          <ActivityIndicator color={colors.fg} size="small" />
        ) : (
          <Text style={styles.saveButtonText}>Save Profile</Text>
        )}
      </Pressable>

      <View style={styles.divider} />

      <Text style={styles.heading}>Notifications</Text>

      <View style={styles.shareCard}>
        <View style={styles.shareHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.shareName}>Mood Reminder</Text>
            <Text style={styles.description}>Remind me if I haven't logged in 18 hours</Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={handleToggleReminder}
            trackColor={{ false: colors.border, true: colors.blue }}
            thumbColor={colors.fg}
          />
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.heading}>Sharing</Text>
      <View style={styles.sharingDescRow}>
        <Text style={styles.description}>
          Choose who can see your mood entries. Changes save automatically.
        </Text>
        {savingSharing && (
          <ActivityIndicator color={colors.blue} size="small" style={{ marginLeft: 8 }} />
        )}
      </View>

      {activeShares.map(([uid, cfg]) => (
        <View key={uid} style={styles.shareCard}>
          <View style={styles.shareHeader}>
            <Text style={styles.shareName}>{cfg.name}</Text>
            <Switch
              value={cfg.shared}
              onValueChange={() => toggleShare(uid)}
              trackColor={{ false: colors.border, true: colors.blue }}
              thumbColor={colors.fg}
            />
          </View>
          {cfg.shared && (
            <View style={styles.filtersContainer}>
              {cfg.filters.map((f, idx) => (
                <View key={idx} style={styles.filterRow}>
                  <TextInput
                    style={[styles.input, styles.filterInput]}
                    value={f.pattern}
                    onChangeText={(text) => updateFilter(uid, idx, 'pattern', text)}
                    placeholder="Tag regex"
                    placeholderTextColor={colors.fgDim}
                  />
                  <View style={styles.filterToggle}>
                    <Text style={styles.filterLabel}>
                      {f.isInclude ? 'Include' : 'Exclude'}
                    </Text>
                    <Switch
                      value={f.isInclude}
                      onValueChange={(val) => updateFilter(uid, idx, 'isInclude', val)}
                      trackColor={{ false: colors.red, true: colors.green }}
                      thumbColor={colors.fg}
                    />
                  </View>
                  <Pressable onPress={() => removeFilter(uid, idx)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>X</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={() => addFilter(uid)} style={styles.addFilterBtn}>
                <Text style={styles.addFilterText}>+ Add Filter</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}

      <Text style={styles.label}>Add user to share with</Text>
      <TextInput
        style={[styles.input, { marginBottom: 8 }]}
        value={searchText}
        onChangeText={handleSearch}
        placeholder="Search by name or email..."
        placeholderTextColor={colors.fgDim}
        autoCapitalize="none"
      />
      {searching && (
        <ActivityIndicator color={colors.blue} size="small" style={{ marginBottom: 8 }} />
      )}
      {filteredResults.map((u) => (
        <Pressable key={u.id} style={styles.searchResult} onPress={() => addShareFromSearch(u)}>
          <View>
            <Text style={styles.searchResultName}>{u.name}</Text>
            <Text style={styles.searchResultEmail}>{u.email}</Text>
          </View>
          <Text style={styles.addText}>+</Text>
        </Pressable>
      ))}

      <View style={styles.divider} />

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}