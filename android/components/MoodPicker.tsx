import { Pressable, Text, View } from 'react-native';
import { moodColor } from '@/lib/utils';
import { styles } from '@/styles/MoodPicker.styles';

interface MoodPickerProps {
  value: number | null;
  onChange: (value: number) => void;
}

export default function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <View style={styles.grid}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
        <Pressable
          key={v}
          style={[styles.btn, { backgroundColor: moodColor(v) }, value === v && styles.btnActive]}
          onPress={() => onChange(v)}
        >
          <Text style={styles.btnText}>{v}</Text>
        </Pressable>
      ))}
    </View>
  );
}
