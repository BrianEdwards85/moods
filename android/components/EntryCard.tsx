import { Image, StyleSheet, Text, View } from 'react-native';
import MoodTag from './MoodTag';
import { moodColor, gravatarUrl, formatRelativeTime } from '@/lib/utils';
import type { MoodEntry, User } from '@/lib/store';

interface Props {
  entry: MoodEntry;
  user?: User;
  mine: boolean;
}

export default function EntryCard({ entry, user, mine }: Props) {
  const bg = moodColor(entry.mood);
  const email = user?.email ?? '';
  const name = user?.name ?? entry.user?.name ?? '?';

  return (
    <View style={[styles.outer, mine ? styles.mine : styles.partner]}>
      <View style={[styles.card, { backgroundColor: bg }]}>
        <View style={styles.header}>
          <Image source={{ uri: gravatarUrl(email, 48) }} style={styles.avatar} />
          <Text style={styles.nameText}>
            {name} is at {entry.mood}
          </Text>
          <Text style={styles.time}>{formatRelativeTime(entry.createdAt)}</Text>
        </View>

        {entry.notes ? <Text style={styles.notes}>{entry.notes}</Text> : null}

        {entry.tags.length > 0 ? (
          <View style={styles.tags}>
            {entry.tags.map((t) => (
              <MoodTag key={t.name} name={t.name} metadata={t.metadata} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginBottom: 10,
  },
  mine: {
    paddingRight: 40,
  },
  partner: {
    paddingLeft: 40,
  },
  card: {
    borderRadius: 8,
    padding: 14,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  nameText: {
    fontWeight: '700',
    fontSize: 15,
    color: '#1f2335',
  },
  time: {
    fontSize: 11,
    color: '#1f2335',
    opacity: 0.6,
    marginTop: 2,
  },
  notes: {
    fontSize: 13,
    color: '#1f2335',
    opacity: 0.9,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
});
