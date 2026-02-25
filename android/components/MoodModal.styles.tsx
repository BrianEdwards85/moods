import { StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';
import { sharedStyles } from '@/lib/shared-styles';

const local = StyleSheet.create({
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
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
    color: colors.darkText,
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
    color: colors.darkText,
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
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkText,
  },
});

export const styles = {
  overlay: sharedStyles.overlay,
  headerRow: sharedStyles.headerRow,
  title: sharedStyles.modalTitle,
  closeBtn: sharedStyles.closeBtn,
  body: sharedStyles.body,
  label: sharedStyles.label,
  input: sharedStyles.input,
  submitDisabled: sharedStyles.disabled,
  ...local,
};
