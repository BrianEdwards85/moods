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
    maxHeight: '85%',
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
  archivedBanner: {
    backgroundColor: colors.orange,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  archivedBannerText: {
    color: '#1f2335',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.fgMuted,
    marginBottom: 8,
    marginTop: 12,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  swatchActive: {
    borderWidth: 3,
    borderColor: '#fff',
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
  colorPreview: {
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  colorPreviewText: {
    color: '#1f2335',
    fontSize: 12,
    fontWeight: '600',
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
    color: '#1f2335',
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
    color: '#1f2335',
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
    color: '#1f2335',
  },
});
