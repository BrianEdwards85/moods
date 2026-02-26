import { ActivityIndicator, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { colors } from '@/lib/theme';
import { styles } from '@/app/(tabs)/settings.styles';
import type { useSharing, ShareFilter } from '@/lib/useSharing';
import type { useUserSearch, SearchUser } from '@/lib/useUserSearch';

interface SharingSectionProps {
  sharing: ReturnType<typeof useSharing>;
  search: ReturnType<typeof useUserSearch>;
  currentUserId: string | null;
}

export default function SharingSection({ sharing, search, currentUserId }: SharingSectionProps) {
  const {
    activeShares,
    savingSharing,
    toggleShare,
    addFilter,
    removeFilter,
    updateFilter,
    addShare,
  } = sharing;
  const { searchText, searching, searchResults, handleSearch, clear } = search;

  const activeIds = new Set(activeShares.map(([id]) => id));
  const filteredResults = searchResults.filter(
    (u) => u.id !== currentUserId && !activeIds.has(u.id),
  );

  const handleAddShare = (user: SearchUser) => {
    addShare(user.id, user.name);
    clear();
  };

  return (
    <>
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
              {cfg.filters.map((f: ShareFilter, idx: number) => (
                <View key={idx} style={styles.filterRow}>
                  <TextInput
                    style={[styles.input, styles.filterInput]}
                    value={f.pattern}
                    onChangeText={(text) => updateFilter(uid, idx, 'pattern', text)}
                    placeholder="Tag regex"
                    placeholderTextColor={colors.fgDim}
                  />
                  <View style={styles.filterToggle}>
                    <Text style={styles.filterLabel}>{f.isInclude ? 'Include' : 'Exclude'}</Text>
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
      {filteredResults.map((u: SearchUser) => (
        <Pressable key={u.id} style={styles.searchResult} onPress={() => handleAddShare(u)}>
          <View>
            <Text style={styles.searchResultName}>{u.name}</Text>
            <Text style={styles.searchResultEmail}>{u.email}</Text>
          </View>
          <Text style={styles.addText}>+</Text>
        </Pressable>
      ))}
    </>
  );
}
