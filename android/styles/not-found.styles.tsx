import { StyleSheet } from 'react-native';
import { colors } from './theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgDark,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.fg,
  },
  link: {
    marginTop: 16,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: colors.blue,
  },
});
