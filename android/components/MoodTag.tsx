import { Text, View } from 'react-native';
import { defaultTagColor } from '@/styles/theme';
import { styles } from '@/styles/MoodTag.styles';

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
