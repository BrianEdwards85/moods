import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useQuery } from 'urql';
import { TAGS_QUERY } from '@/lib/graphql/queries';
import { colors } from '@/styles/theme';
import { styles } from '@/styles/TagPicker.styles';
import { TAG_PICKER_PAGE_SIZE } from '@/lib/constants';
import type { Tag, TagEdge } from '@/lib/store';
import MoodTag from './MoodTag';

interface TagPickerProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  active: boolean;
}

export default function TagPicker({ selectedTags, onChange, active }: TagPickerProps) {
  const [tagSearch, setTagSearch] = useState('');

  const [tagsResult] = useQuery({
    query: TAGS_QUERY,
    variables: { search: tagSearch || undefined, first: TAG_PICKER_PAGE_SIZE },
    pause: !active,
  });

  const allTags = (tagsResult.data?.tags?.edges ?? []).map((e: TagEdge) => e.node);

  useEffect(() => {
    if (!active) setTagSearch('');
  }, [active]);

  const toggleTag = (name: string) => {
    onChange(
      selectedTags.includes(name)
        ? selectedTags.filter((t) => t !== name)
        : [...selectedTags, name],
    );
  };

  const addCustomTag = () => {
    const trimmed = tagSearch.trim().toLowerCase();
    if (trimmed && !selectedTags.includes(trimmed)) {
      onChange([...selectedTags, trimmed]);
      setTagSearch('');
    }
  };

  return (
    <>
      {selectedTags.length > 0 && (
        <View style={styles.selectedTags}>
          {selectedTags.map((name) => {
            const meta = allTags.find((t: Tag) => t.name === name)?.metadata;
            return (
              <Pressable key={name} onPress={() => toggleTag(name)}>
                <MoodTag name={name} metadata={meta} />
              </Pressable>
            );
          })}
        </View>
      )}
      <View style={styles.searchRow}>
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
      <View style={styles.list}>
        {allTags
          .filter((t: Tag) => !selectedTags.includes(t.name))
          .map((t: Tag) => (
            <Pressable key={t.name} onPress={() => toggleTag(t.name)}>
              <MoodTag name={t.name} metadata={t.metadata} />
            </Pressable>
          ))}
        {tagSearch.trim() &&
          !allTags.some((t: Tag) => t.name === tagSearch.trim().toLowerCase()) && (
            <Pressable onPress={addCustomTag}>
              <View style={styles.createTag}>
                <Text style={styles.createTagText}>
                  Create &quot;{tagSearch.trim().toLowerCase()}&quot;
                </Text>
              </View>
            </Pressable>
          )}
      </View>
    </>
  );
}
