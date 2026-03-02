import { StyleSheet } from 'react-native';
import { colors } from './theme';

export const styles = StyleSheet.create({
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
