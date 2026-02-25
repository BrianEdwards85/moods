import { StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.fg,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.fgMuted,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.bgFloat,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.fg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: colors.fg,
    transform: [{ scale: 1.1 }],
  },
  clearText: {
    fontSize: 12,
    color: colors.fgDim,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#1f2335',
    fontWeight: '700',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 24,
  },
  description: {
    fontSize: 13,
    color: colors.fgDim,
    flex: 1,
  },
  sharingDescRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shareCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.fg,
  },
  filtersContainer: {
    marginTop: 10,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  filterInput: {
    flex: 1,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterLabel: {
    fontSize: 11,
    color: colors.fgDim,
  },
  removeBtn: {
    padding: 6,
  },
  removeBtnText: {
    color: colors.red,
    fontWeight: '700',
    fontSize: 14,
  },
  addFilterBtn: {
    marginTop: 4,
  },
  addFilterText: {
    fontSize: 13,
    color: colors.blue,
    fontWeight: '600',
  },
  searchResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 6,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.fg,
  },
  searchResultEmail: {
    fontSize: 12,
    color: colors.fgDim,
  },
  addText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.blue,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  signOutText: {
    color: colors.orange,
    fontWeight: '700',
    fontSize: 14,
  },
});
