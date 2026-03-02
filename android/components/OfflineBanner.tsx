import { Text, View } from 'react-native';
import { useStore } from '@/lib/store';
import { styles } from '@/styles/OfflineBanner.styles';

export default function OfflineBanner() {
  const isOnline = useStore((s) => s.isOnline);
  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}
