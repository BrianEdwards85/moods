import { StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';
import { sharedStyles } from '@/lib/shared-styles';

const local = StyleSheet.create({
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  list: {
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
});

export const styles = {
  input: sharedStyles.input,
  ...local,
};
