import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors, Fonts } from '@/constants/Colors';

const GIPHY_API_KEY = 'ULsF7uPdlYb27ajYAB2pS0R9Yd4nLVkP';

interface GifResult {
  id: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
}

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

function formatResults(results: any[]): GifResult[] {
  return results.map((r: any) => ({
    id: r.id,
    url: r.images?.original?.url || '',
    previewUrl: r.images?.fixed_width_small?.url || r.images?.fixed_width?.url || '',
    width: parseInt(r.images?.original?.width || '200', 10),
    height: parseInt(r.images?.original?.height || '200', 10),
  }));
}

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchGifs('');
  }, []);

  const fetchGifs = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const endpoint = q.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=24&rating=pg-13`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=24&rating=pg-13`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setGifs(formatResults(data.data || []));
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (val: string) => {
      setQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchGifs(val), 400);
    },
    [fetchGifs]
  );

  const renderItem = useCallback(
    ({ item }: { item: GifResult }) => (
      <TouchableOpacity
        style={styles.gifItem}
        onPress={() => onSelect(item.url)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.previewUrl || item.url }}
          style={styles.gifImage}
          contentFit="cover"
        />
      </TouchableOpacity>
    ),
    [onSelect]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search GIFs..."
          placeholderTextColor={Colors.textTertiary}
          value={query}
          onChangeText={handleQueryChange}
          autoFocus
        />
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>

      {loading && gifs.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.orange} />
        </View>
      ) : (
        <FlatList
          data={gifs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <Text style={styles.attribution}>Powered by GIPHY</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 320,
    backgroundColor: Colors.darkGray,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: Colors.textTertiary,
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    padding: 4,
  },
  gifItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
  attribution: {
    fontFamily: Fonts.barlow,
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'right',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
