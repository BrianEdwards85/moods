import { StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.bgFloat,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.fg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  archivedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  archivedLabel: {
    fontSize: 12,
    color: colors.fgDim,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  face: {
    fontSize: 18,
  },
  tagName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.darkText,
  },
  tagArchived: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  archivedBadge: {
    fontSize: 10,
    color: colors.darkText,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.fgDim,
  },
});
