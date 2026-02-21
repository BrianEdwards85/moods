import { StyleSheet, Text, View } from 'react-native';
import { defaultTagColor } from '@/lib/theme';

interface Props {
  name: string;
  metadata?: { color?: string; face?: string };
}

export default function MoodTag({ name, metadata }: Props) {
  const bg = metadata?.color || defaultTagColor;
  const face = metadata?.face;

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {face ? <Text style={styles.face}>{face}</Text> : null}
      <Text style={styles.name}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  face: {
    fontSize: 14,
    lineHeight: 16,
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2335',
  },
});
