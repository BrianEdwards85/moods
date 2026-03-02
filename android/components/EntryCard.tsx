import React from 'react';
import { Image, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MoodTag from './MoodTag';
import { moodColor, formatRelativeTime } from '@/lib/utils';
import { styles } from '@/styles/EntryCard.styles';
import { colors } from '@/styles/theme';
import type { MoodEntry, User } from '@/lib/store';
import { DELTA_THRESHOLD_LARGE, DELTA_THRESHOLD_MEDIUM } from '@/lib/constants';

interface Props {
  entry: MoodEntry;
  user?: User;
  mine: boolean;
}

function deltaColor(delta: number): string {
  const mag = Math.abs(delta);
  if (delta > 0) {
    if (mag >= DELTA_THRESHOLD_LARGE) return colors.deltaUpLarge;
    if (mag >= DELTA_THRESHOLD_MEDIUM) return colors.deltaUpMedium;
    return colors.deltaUpSmall;
  }
  if (mag >= DELTA_THRESHOLD_LARGE) return colors.deltaDownLarge;
  if (mag >= DELTA_THRESHOLD_MEDIUM) return colors.deltaDownMedium;
  return colors.deltaDownSmall;
}

function deltaIconName(delta: number): 'arrow-up' | 'arrow-down' | 'minus' {
  if (delta > 0) return 'arrow-up';
  if (delta < 0) return 'arrow-down';
  return 'minus';
}

function EntryCard({ entry, user, mine }: Props) {
  const bg = moodColor(entry.mood);
  const name = user?.name ?? entry.user?.name ?? '?';
  const customAvatar = (user?.settings as Record<string, unknown>)?.avatarUrl as string | undefined;
  const avatarUri = customAvatar || user?.icon || '';
  const userColor = (user?.settings as Record<string, unknown>)?.color as string | undefined;

  return (
    <View style={[styles.outer, mine ? styles.mine : styles.partner]}>
      <View
        style={[
          styles.card,
          { backgroundColor: bg },
          userColor ? { borderLeftWidth: 4, borderLeftColor: userColor } : null,
        ]}
      >
        <View style={styles.header}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>
              {name} is at {entry.mood}
            </Text>
            {entry.delta != null && (
              <FontAwesome
                name={deltaIconName(entry.delta)}
                size={13}
                color={entry.delta === 0 ? colors.deltaNeutral : deltaColor(entry.delta)}
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

export default React.memo(EntryCard);
