import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation } from 'urql';
import {
  UPDATE_TAG_METADATA_MUTATION,
  ARCHIVE_TAG_MUTATION,
  UNARCHIVE_TAG_MUTATION,
} from '@/lib/graphql/mutations';
import { colors, tagPresetColors } from '@/lib/theme';
import type { Tag } from '@/lib/store';

interface Props {
  tag: Tag | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function TagEditModal({ tag, onClose, onSaved }: Props) {
  const [color, setColor] = useState('');
  const [face, setFace] = useState('');

  const [, updateMeta] = useMutation(UPDATE_TAG_METADATA_MUTATION);
  const [, archiveTag] = useMutation(ARCHIVE_TAG_MUTATION);
  const [, unarchiveTag] = useMutation(UNARCHIVE_TAG_MUTATION);
  const [saving, setSaving] = useState(false);

  const archived = !!tag?.archivedAt;

  useEffect(() => {
    if (tag) {
      setColor(tag.metadata?.color ?? '');
      setFace(tag.metadata?.face ?? '');
    }
  }, [tag]);

  const save = async () => {
    if (!tag) return;
    setSaving(true);
    const metadata: Record<string, string> = {};
    if (color) metadata.color = color;
    if (face) metadata.face = face;
    await updateMeta({ input: { name: tag.name, metadata } });
    setSaving(false);
    onSaved();
  };

  const onArchive = async () => {
    if (!tag) return;
    setSaving(true);
    await archiveTag({ name: tag.name });
    setSaving(false);
    onSaved();
  };

  const onUnarchive = async () => {
    if (!tag) return;
    setSaving(true);
    await unarchiveTag({ name: tag.name });
    setSaving(false);
    onSaved();
  };

  if (!tag) return null;

  return (
    <Modal visible={!!tag} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Edit: {tag.name}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body}>
            {archived && (
              <View style={styles.archivedBanner}>
                <Text style={styles.archivedBannerText}>
                  This tag is archived. Unarchive to edit.
                </Text>
              </View>
            )}

            <View style={archived ? styles.disabled : undefined}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.swatches}>
                {tagPresetColors.map((c) => (
                  <Pressable
                    key={c}
                    style={[
                      styles.swatch,
                      { backgroundColor: c },
                      color === c && styles.swatchActive,
                    ]}
                    onPress={() => !archived && setColor(c)}
                    disabled={archived}
                  />
                ))}
                <Pressable
                  style={[styles.swatch, styles.clearSwatch]}
                  onPress={() => !archived && setColor('')}
                  disabled={archived}
                >
                  <Text style={styles.clearSwatchText}>✕</Text>
                </Pressable>
              </View>
              {color ? (
                <View style={[styles.colorPreview, { backgroundColor: color }]}>
                  <Text style={styles.colorPreviewText}>{color}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>Face (emoji)</Text>
              <View style={styles.faceRow}>
                <TextInput
                  style={styles.faceInput}
                  value={face}
                  onChangeText={(text) => {
                    if (!archived) setFace(text);
                  }}
                  placeholder="Tap to enter emoji"
                  placeholderTextColor={colors.fgDim}
                  editable={!archived}
                />
                {face ? (
                  <Pressable onPress={() => !archived && setFace('')} disabled={archived}>
                    <Text style={styles.clearFace}>✕</Text>
                  </Pressable>
                ) : null}
                {face ? <Text style={styles.facePreview}>{face}</Text> : null}
              </View>
            </View>

            <View style={styles.actions}>
              {archived ? (
                <Pressable style={styles.unarchiveBtn} onPress={onUnarchive} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color={colors.bgDark} />
                  ) : (
                    <Text style={styles.unarchiveBtnText}>Unarchive</Text>
                  )}
                </Pressable>
              ) : (
                <>
                  <Pressable style={styles.archiveBtn} onPress={onArchive} disabled={saving}>
                    <Text style={styles.archiveBtnText}>Archive</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.saveBtn, saving && styles.submitDisabled]}
                    onPress={save}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#1f2335" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save</Text>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
