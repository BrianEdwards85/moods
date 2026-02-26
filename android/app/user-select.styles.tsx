import { StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: 300,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.fg,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.fgDim,
    marginBottom: 32,
  },
  emailInput: {
    width: '100%',
    backgroundColor: colors.bgFloat,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.fg,
    fontSize: 16,
    padding: 14,
    marginBottom: 16,
  },
  sendBtn: {
    width: '100%',
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkText,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.bgFloat,
    borderRadius: 12,
    padding: 24,
    width: 300,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.fg,
    marginBottom: 12,
  },
  modalSubtext: {
    fontSize: 14,
    color: colors.fgDim,
    marginBottom: 16,
  },
  codeInput: {
    backgroundColor: colors.bgDark,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.fg,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    padding: 12,
    letterSpacing: 8,
    marginBottom: 12,
  },
  errorMsg: {
    fontSize: 13,
    color: colors.red,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelText: {
    fontSize: 15,
    color: colors.fgDim,
  },
  verifyBtn: {
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  verifyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.darkText,
  },
});
