import { StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.fg,
  },
  closeBtn: {
    fontSize: 20,
    color: colors.fgDim,
    padding: 4,
  },
  body: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.fgMuted,
    marginBottom: 8,
    marginTop: 12,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodBtn: {
    width: 52,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodBtnActive: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  moodBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2335',
  },
  input: {
    backgroundColor: colors.bgFloat,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.fg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tagSearchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  createTag: {
    backgroundColor: colors.blue,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  createTagText: {
    color: '#1f2335',
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2335',
  },
});
