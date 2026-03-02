import { StyleSheet } from 'react-native';
import { colors } from './theme';

export const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.red,
    paddingVertical: 6,
    alignItems: 'center',
  },
  text: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
