import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
import { styles } from './TagEditModal.styles';
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
    const result = await updateMeta({ input: { name: tag.name, metadata } });
    setSaving(false);
    if (result.error) {
      Alert.alert('Error', 'Failed to save tag. Please try again.');
      return;
    }
    onSaved();
  };

  const onArchive = async () => {
    if (!tag) return;
    setSaving(true);
    const result = await archiveTag({ name: tag.name });
    setSaving(false);
    if (result.error) {
      Alert.alert('Error', 'Failed to archive tag.');
      return;
    }
    onSaved();
  };

  const onUnarchive = async () => {
    if (!tag) return;
    setSaving(true);
    const result = await unarchiveTag({ name: tag.name });
    setSaving(false);
    if (result.error) {
      Alert.alert('Error', 'Failed to unarchive tag.');
      return;
    }
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