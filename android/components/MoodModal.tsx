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
import { useStore } from '@/lib/store';
import { LOG_MOOD_MUTATION } from '@/lib/graphql/mutations';
import { colors } from '@/styles/theme';
import { styles } from '@/styles/MoodModal.styles';
import MoodPicker from './MoodPicker';
import TagPicker from './TagPicker';
import { scheduleReminder } from '@/lib/useNotifications';
import { friendlyError } from '@/lib/errors';

export default function MoodModal({ onSaved }: { onSaved: () => void }) {
  const open = useStore((s) => s.moodModalOpen);
  const close = useStore((s) => s.closeMoodModal);
  const userId = useStore((s) => s.currentUserId);

  const [mood, setMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [logResult, logMood] = useMutation(LOG_MOOD_MUTATION);

  const submit = async () => {
    if (!mood || !userId) return;
    const result = await logMood({
      input: {
        mood,
        notes: notes || null,
        tags: selectedTags.length ? selectedTags : null,
      },
    });
    if (result.error) {
      Alert.alert('Error', friendlyError(result.error));
      return;
    }
    scheduleReminder();
    setMood(null);
    setNotes('');
    setSelectedTags([]);
    close();
    onSaved();
  };

  useEffect(() => {
    if (!open) {
      setMood(null);
      setNotes('');
      setSelectedTags([]);
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
            <MoodPicker value={mood} onChange={setMood} />

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
            <TagPicker selectedTags={selectedTags} onChange={setSelectedTags} active={open} />

            <Pressable
              style={[styles.submitBtn, (!mood || logResult.fetching) && styles.submitDisabled]}
              onPress={submit}
              disabled={!mood || logResult.fetching}
            >
              {logResult.fetching ? (
                <ActivityIndicator color={colors.darkText} />
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
