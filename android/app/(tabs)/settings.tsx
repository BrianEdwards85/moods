import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from 'urql';
import { USERS_QUERY } from '@/lib/graphql/queries';
import { UPDATE_USER_SETTINGS_MUTATION } from '@/lib/graphql/mutations';
import { useStore, type User } from '@/lib/store';
import { scheduleReminder, cancelReminder } from '@/lib/useNotifications';
import { colors } from '@/lib/theme';
import { styles } from './settings.styles';
import { useSharing } from '@/lib/useSharing';
import { useUserSearch } from '@/lib/useUserSearch';
import ProfileSection from '@/components/ProfileSection';
import SharingSection from '@/components/SharingSection';

export default function SettingsScreen() {
  const router = useRouter();
  const currentUserId = useStore((s) => s.currentUserId);
  const clearAuth = useStore((s) => s.clearAuth);

  const [usersResult] = useQuery<{ users: User[] }>({ query: USERS_QUERY });
  const users = usersResult.data?.users ?? [];
  const currentUser = users.find((u) => u.id === currentUserId);

  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [, updateSettings] = useMutation(UPDATE_USER_SETTINGS_MUTATION);

  const sharing = useSharing(currentUser);
  const search = useUserSearch();

  useEffect(() => {
    if (currentUser) {
      setAvatarUrl(currentUser.settings?.avatarUrl ?? '');
      setSelectedColor(currentUser.settings?.color ?? null);
      const notifications = currentUser.settings?.notifications ?? [];
      setReminderEnabled(notifications.includes('reminder'));
    }
  }, [currentUser?.id]);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ProfileSection
        avatarUrl={avatarUrl}
        onAvatarUrlChange={setAvatarUrl}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        saving={savingSettings}
        onSave={handleSaveProfile}
      />

      <View style={styles.divider} />

      <Text style={styles.heading}>Notifications</Text>
      <View style={styles.shareCard}>
        <View style={styles.shareHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.shareName}>Mood Reminder</Text>
            <Text style={styles.description}>Remind me if I haven&apos;t logged in 18 hours</Text>
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

      <SharingSection sharing={sharing} search={search} currentUserId={currentUserId} />

      <View style={styles.divider} />

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}
