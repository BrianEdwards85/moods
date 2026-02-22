import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'urql';
import { useStore } from '@/lib/store';
import { USERS_QUERY } from '@/lib/graphql/queries';
import { gravatarUrl } from '@/lib/utils';
import { colors } from '@/lib/theme';

export default function UserSelectScreen() {
  const router = useRouter();
  const selectUser = useStore((s) => s.selectUser);
  const setUsers = useStore((s) => s.setUsers);
  const [result, reexecute] = useQuery({ query: USERS_QUERY });

  const users = result.data?.users ?? [];

  useEffect(() => {
    if (users.length) setUsers(users);
  }, [users]);

  const onSelect = async (id: string) => {
    await selectUser(id);
    router.replace('/(tabs)');
  };

  if (result.fetching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  if (result.error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load users</Text>
        <Text style={styles.errorDetail}>{result.error.message}</Text>
        <Pressable
          style={styles.retryBtn}
          onPress={() => reexecute({ requestPolicy: 'network-only' })}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Who are you?</Text>
      <View style={styles.cards}>
        {users.map((u: { id: string; name: string; email: string }) => (
          <Pressable key={u.id} style={styles.card} onPress={() => onSelect(u.id)}>
            <Image source={{ uri: gravatarUrl(u.email, 96) }} style={styles.avatar} />
            <Text style={styles.name}>{u.name}</Text>
            <Text style={styles.email}>{u.email}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  content: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.fg,
    marginBottom: 32,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.bgFloat,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: 160,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fg,
    marginBottom: 4,
  },
  email: {
    fontSize: 12,
    color: colors.fgDim,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.red,
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 13,
    color: colors.fgDim,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2335',
  },
});
