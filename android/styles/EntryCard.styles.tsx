import { StyleSheet } from 'react-native';
import { colors } from './theme';

export const styles = StyleSheet.create({
  outer: {
    marginBottom: 10,
  },
  mine: {
    paddingRight: 40,
  },
  partner: {
    paddingLeft: 40,
  },
  card: {
    borderRadius: 8,
    padding: 14,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.darkText,
  },
  deltaIcon: {
    marginLeft: 5,
  },
  time: {
    fontSize: 11,
    color: colors.darkText,
    opacity: 0.6,
    marginTop: 2,
  },
  notes: {
    fontSize: 13,
    color: colors.darkText,
    opacity: 0.9,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
});
