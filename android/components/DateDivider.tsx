import { Text, View } from 'react-native';
import { styles } from './DateDivider.styles';

export default function DateDivider({ label }: { label: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}