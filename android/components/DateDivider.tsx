import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/lib/theme';

export default function DateDivider({ label }: { label: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.fgDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
