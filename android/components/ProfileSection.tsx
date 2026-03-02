import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '@/styles/theme';
import { styles } from '@/styles/settings.styles';
import ColorPicker from './ColorPicker';

interface ProfileSectionProps {
  avatarUrl: string;
  onAvatarUrlChange: (url: string) => void;
  selectedColor: string | null;
  onColorChange: (color: string | null) => void;
  saving: boolean;
  onSave: () => void;
}

export default function ProfileSection({
  avatarUrl,
  onAvatarUrlChange,
  selectedColor,
  onColorChange,
  saving,
  onSave,
}: ProfileSectionProps) {
  return (
    <>
      <Text style={styles.heading}>Profile</Text>

      <Text style={styles.label}>Avatar URL</Text>
      <TextInput
        style={styles.input}
        value={avatarUrl}
        onChangeText={onAvatarUrlChange}
        placeholder="https://example.com/avatar.png"
        placeholderTextColor={colors.fgDim}
        autoCapitalize="none"
      />

      <Text style={styles.label}>User Color</Text>
      <View style={{ marginVertical: 8 }}>
        <ColorPicker value={selectedColor} onChange={onColorChange} variant="circle" size={32} />
      </View>

      <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={colors.fg} size="small" />
        ) : (
          <Text style={styles.saveButtonText}>Save Profile</Text>
        )}
      </Pressable>
    </>
  );
}
