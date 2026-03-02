import { StyleSheet } from 'react-native';
import { colors } from './theme';

export const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  btn: {
    width: 52,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkText,
  },
});
