import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors, Fonts } from '@/constants/Colors';

interface AutocompleteUser {
  id: string;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  image: string | null;
}

interface MentionAutocompleteProps {
  query: string;
  onSelect: (handle: string) => void;
  visible: boolean;
  apiBase: string;
}

export function MentionAutocomplete({ query, onSelect, visible, apiBase }: MentionAutocompleteProps) {
  const [users, setUsers] = useState<AutocompleteUser[]>([]);

  useEffect(() => {
    if (!visible || !query) {
      setUsers([]);
      return;
    }

    const controller = new AbortController();
    fetch(`${apiBase}/api/users/autocomplete?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch(() => {});

    return () => controller.abort();
  }, [query, visible, apiBase]);

  if (!visible || users.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => item.handle && onSelect(item.handle)}
            activeOpacity={0.7}
          >
            <View style={styles.avatar}>
              {item.avatarUrl || item.image ? (
                <Image source={{ uri: item.avatarUrl || item.image || '' }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarText}>
                  {(item.displayName || '?').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {item.displayName || item.handle}
              </Text>
              {item.handle && (
                <Text style={styles.handle} numberOfLines={1}>
                  @{item.handle}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 180,
    backgroundColor: Colors.darkGray,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 12,
    color: Colors.white,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  handle: {
    fontFamily: Fonts.barlow,
    fontSize: 11,
    color: Colors.orange,
  },
});
