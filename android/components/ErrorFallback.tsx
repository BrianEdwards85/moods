import { Pressable, Text, View } from 'react-native';
import { styles } from '@/styles/ErrorFallback.styles';

interface Props {
  error: Error;
  retry: () => void;
}

export default function ErrorFallback({ error, retry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error.message || 'An unexpected error occurred.'}</Text>
      <Pressable style={styles.retryBtn} onPress={retry}>
        <Text style={styles.retryText}>Try Again</Text>
      </Pressable>
    </View>
  );
}
