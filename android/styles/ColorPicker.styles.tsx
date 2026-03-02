import { StyleSheet } from 'react-native';
import { colors } from './theme';

export const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  squareActive: {
    borderWidth: 3,
    borderColor: colors.white,
  },
  circleBorder: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  circleActive: {
    borderColor: colors.fg,
    transform: [{ scale: 1.1 }],
  },
  clearSwatch: {
    backgroundColor: colors.bgFloat,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSwatchText: {
    color: colors.fgDim,
    fontSize: 14,
  },
  clearText: {
    fontSize: 12,
    color: colors.fgDim,
    marginTop: 4,
  },
  preview: {
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  previewText: {
    color: colors.darkText,
    fontSize: 12,
    fontWeight: '600',
  },
});
