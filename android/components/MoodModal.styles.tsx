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
