import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  face: {
    fontSize: 14,
    lineHeight: 16,
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2335',
  },
});
