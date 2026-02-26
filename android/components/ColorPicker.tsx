import { Pressable, Text, View } from 'react-native';
import { tagPresetColors } from '@/lib/theme';
import { styles } from './ColorPicker.styles';

interface ColorPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
  variant?: 'square' | 'circle';
  size?: number;
  showPreview?: boolean;
  disabled?: boolean;
}

export default function ColorPicker({
  value,
  onChange,
  variant = 'square',
  size = 36,
  showPreview = false,
  disabled = false,
}: ColorPickerProps) {
  const isCircle = variant === 'circle';
  const borderRadius = isCircle ? size / 2 : 8;

  return (
    <View>
      <View style={styles.grid}>
        {tagPresetColors.map((c) => (
          <Pressable
            key={c}
            style={[
              { width: size, height: size, borderRadius, backgroundColor: c },
              isCircle && styles.circleBorder,
              value === c && (isCircle ? styles.circleActive : styles.squareActive),
            ]}
            onPress={() => onChange(c)}
            disabled={disabled}
          />
        ))}
        {!isCircle && (
          <Pressable
            style={[{ width: size, height: size, borderRadius }, styles.clearSwatch]}
            onPress={() => onChange(null)}
            disabled={disabled}
          >
            <Text style={styles.clearSwatchText}>✕</Text>
          </Pressable>
        )}
      </View>
      {isCircle && value && (
        <Pressable onPress={() => onChange(null)} disabled={disabled}>
          <Text style={styles.clearText}>Clear color</Text>
        </Pressable>
      )}
      {showPreview && value ? (
        <View style={[styles.preview, { backgroundColor: value }]}>
          <Text style={styles.previewText}>{value}</Text>
        </View>
      ) : null}
    </View>
  );
}
