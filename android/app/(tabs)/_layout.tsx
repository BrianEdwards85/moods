import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image, Pressable, Text } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useStore } from '@/lib/store';
import { colors } from '@/styles/theme';

function TabIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={22} style={{ marginBottom: -3 }} {...props} />;
}

function UserHeaderButton() {
  const router = useRouter();
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const currentUser = users.find((u) => u.id === currentUserId);

  if (!currentUser) return null;

  return (
    <Pressable
      onPress={() => router.push('/(tabs)/settings')}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 12 }}
    >
      <Image
        source={{ uri: currentUser.icon }}
        style={{ width: 24, height: 24, borderRadius: 12 }}
      />
      <Text style={{ color: colors.fgMuted, fontSize: 14 }}>{currentUser.name}</Text>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.fgDim,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.fg,
        headerRight: () => <UserHeaderButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ color }) => <TabIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tags"
        options={{
          title: 'Tags',
          tabBarIcon: ({ color }) => <TabIcon name="tags" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          href: null,
        }}
      />
    </Tabs>
  );
}
