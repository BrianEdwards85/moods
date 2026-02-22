import { Image, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MoodTag from './MoodTag';
import { moodColor, gravatarUrl, formatRelativeTime } from '@/lib/utils';
import type { MoodEntry, User } from '@/lib/store';

interface Props {
  entry: MoodEntry;
  user?: User;
  mine: boolean;
}

function deltaColor(delta: number): string {
  const mag = Math.abs(delta);
  if (delta > 0) {
    if (mag >= 5) return '#14532d';
    if (mag >= 3) return '#166534';
    return '#15803d';
  }
  if (mag >= 5) return '#7f1d1d';
  if (mag >= 3) return '#991b1b';
  return '#b91c1c';
}

function deltaIconName(delta: number): 'arrow-up' | 'arrow-down' | 'minus' {
  if (delta > 0) return 'arrow-up';
  if (delta < 0) return 'arrow-down';
  return 'minus';
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
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>
              {name} is at {entry.mood}
            </Text>
            {entry.delta != null && (
              <FontAwesome
                name={deltaIconName(entry.delta)}
                size={13}
                color={entry.delta === 0 ? '#9ca3af' : deltaColor(entry.delta)}
                style={styles.deltaIcon}
              />
            )}
          </View>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    fontWeight: '700',
    fontSize: 15,
    color: '#1f2335',
  },
  deltaIcon: {
    marginLeft: 5,
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
