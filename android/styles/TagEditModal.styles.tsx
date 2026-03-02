import { StyleSheet } from 'react-native';
import { colors } from './theme';
import { sharedStyles } from './shared-styles';

const local = StyleSheet.create({
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  archivedBanner: {
    backgroundColor: colors.orange,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  archivedBannerText: {
    color: colors.darkText,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  faceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  faceInput: {
    flex: 1,
    backgroundColor: colors.bgFloat,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.fg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 20,
  },
  clearFace: {
    fontSize: 18,
    color: colors.fgDim,
  },
  facePreview: {
    fontSize: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    marginBottom: 24,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkText,
  },
  archiveBtn: {
    flex: 1,
    backgroundColor: colors.red,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  archiveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkText,
  },
  unarchiveBtn: {
    flex: 1,
    backgroundColor: colors.green,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  unarchiveBtnText: {
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
  ...local,
};
