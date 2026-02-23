import { useCallback, useEffect, useState } from 'react';
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
import { useMutation, useQuery } from 'urql';
import { useStore } from '@/lib/store';
import { TAGS_QUERY } from '@/lib/graphql/queries';
import { LOG_MOOD_MUTATION } from '@/lib/graphql/mutations';
import { moodColor } from '@/lib/utils';
import { colors } from '@/lib/theme';
import MoodTag from './MoodTag';

export default function MoodModal({ onSaved }: { onSaved: () => void }) {
  const open = useStore((s) => s.moodModalOpen);
  const close = useStore((s) => s.closeMoodModal);
  const userId = useStore((s) => s.currentUserId);

  const [mood, setMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');

  const [tagsResult] = useQuery({
    query: TAGS_QUERY,
    variables: { search: tagSearch || undefined, first: 50 },
    pause: !open,
  });

  const [logResult, logMood] = useMutation(LOG_MOOD_MUTATION);

  const allTags = (tagsResult.data?.tags?.edges ?? []).map(
    (e: { node: { name: string; metadata: Record<string, string> } }) => e.node
  );

  const toggleTag = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const addCustomTag = () => {
    const trimmed = tagSearch.trim().toLowerCase();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
      setTagSearch('');
    }
  };

  const submit = async () => {
    if (!mood || !userId) return;
    await logMood({
      input: {
        userId,
        mood,
        notes: notes || null,
        tags: selectedTags.length ? selectedTags : null,
      },
    });
    setMood(null);
    setNotes('');
    setSelectedTags([]);
    setTagSearch('');
    close();
    onSaved();
  };

  useEffect(() => {
    if (!open) {
      setMood(null);
      setNotes('');
      setSelectedTags([]);
      setTagSearch('');
    }
  }, [open]);

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Log Mood</Text>
            <Pressable onPress={close}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>How are you feeling?</Text>
            <View style={styles.moodGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                <Pressable
                  key={v}
                  style={[
                    styles.moodBtn,
                    { backgroundColor: moodColor(v) },
                    mood === v && styles.moodBtnActive,
                  ]}
                  onPress={() => setMood(v)}
                >
                  <Text style={styles.moodBtnText}>{v}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={styles.input}
              value={notes}
              onChangeText={setNotes}
              placeholder="How's your day going?"
              placeholderTextColor={colors.fgDim}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Tags</Text>
            {selectedTags.length > 0 && (
              <View style={styles.selectedTags}>
                {selectedTags.map((name) => {
                  const meta = allTags.find((t: { name: string }) => t.name === name)?.metadata;
                  return (
                    <Pressable key={name} onPress={() => toggleTag(name)}>
                      <MoodTag name={name} metadata={meta} />
                    </Pressable>
                  );
                })}
              </View>
            )}
            <View style={styles.tagSearchRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={tagSearch}
                onChangeText={setTagSearch}
                placeholder="Search or create tag..."
                placeholderTextColor={colors.fgDim}
                onSubmitEditing={addCustomTag}
                returnKeyType="done"
              />
            </View>
            <View style={styles.tagList}>
              {allTags
                .filter(
                  (t: { name: string }) => !selectedTags.includes(t.name)
                )
                .map((t: { name: string; metadata: Record<string, string> }) => (
                  <Pressable key={t.name} onPress={() => toggleTag(t.name)}>
                    <MoodTag name={t.name} metadata={t.metadata} />
                  </Pressable>
                ))}
              {tagSearch.trim() &&
                !allTags.some(
                  (t: { name: string }) => t.name === tagSearch.trim().toLowerCase()
                ) && (
                  <Pressable onPress={addCustomTag}>
                    <View style={styles.createTag}>
                      <Text style={styles.createTagText}>
                        Create "{tagSearch.trim().toLowerCase()}"
                      </Text>
                    </View>
                  </Pressable>
                )}
            </View>

            <Pressable
              style={[styles.submitBtn, (!mood || logResult.fetching) && styles.submitDisabled]}
              onPress={submit}
              disabled={!mood || logResult.fetching}
            >
              {logResult.fetching ? (
                <ActivityIndicator color="#1f2335" />
              ) : (
                <Text style={styles.submitText}>Log Mood</Text>
              )}
            </Pressable>
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
    maxHeight: '90%',
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.fgMuted,
    marginBottom: 8,
    marginTop: 12,
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
    color: '#1f2335',
  },
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
    color: '#1f2335',
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
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2335',
  },
});
