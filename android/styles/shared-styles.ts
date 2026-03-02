import { StyleSheet } from 'react-native';
import { colors } from './theme';

export const sharedStyles = StyleSheet.create({
  // Modal overlay — full-screen dimmed background
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },

  // Bottom sheet container
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  // Modal header row (title + close button)
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Modal title text
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.fg,
  },

  // Modal close button text
  closeBtn: {
    fontSize: 20,
    color: colors.fgDim,
    padding: 4,
  },

  // Scrollable body area
  body: {
    padding: 16,
  },

  // Form label
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.fgMuted,
    marginBottom: 8,
    marginTop: 12,
  },

  // Text input field
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

  // Disabled/loading state
  disabled: {
    opacity: 0.5,
  },

  // Primary action button (blue)
  primaryBtn: {
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },

  // Primary button text
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkText,
  },
});
