import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_PADDING = 14; // matches TakeCard padding
const IMAGE_WIDTH = SCREEN_WIDTH - 2 * CARD_PADDING - 2; // account for card border
const RADIUS = 12;

interface ImageGridProps {
  urls: string[];
}

export function ImageGrid({ urls }: ImageGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  if (urls.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  // Single image — full width
  if (urls.length === 1) {
    return (
      <>
        <TouchableOpacity activeOpacity={0.9} onPress={() => openLightbox(0)}>
          <Image
            source={{ uri: urls[0] }}
            style={styles.single}
            contentFit="cover"
          />
        </TouchableOpacity>
        <Lightbox
          urls={urls}
          visible={lightboxIndex !== null}
          initialIndex={lightboxIndex ?? 0}
          onClose={closeLightbox}
        />
      </>
    );
  }

  // Multiple images — swipeable carousel
  return (
    <>
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={urls}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / IMAGE_WIDTH);
            setCurrentIndex(idx);
          }}
          keyExtractor={(_, i) => i.toString()}
          getItemLayout={(_, index) => ({
            length: IMAGE_WIDTH,
            offset: IMAGE_WIDTH * index,
            index,
          })}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => openLightbox(index)}
              style={{ width: IMAGE_WIDTH }}
            >
              <Image
                source={{ uri: item }}
                style={styles.carouselImage}
                contentFit="cover"
              />
            </TouchableOpacity>
          )}
        />

        {/* Counter badge */}
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {currentIndex + 1}/{urls.length}
          </Text>
        </View>

        {/* Dot indicators */}
        <View style={styles.dots}>
          {urls.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <Lightbox
        urls={urls}
        visible={lightboxIndex !== null}
        initialIndex={lightboxIndex ?? 0}
        onClose={closeLightbox}
      />
    </>
  );
}

// Fullscreen lightbox with swipe
function Lightbox({
  urls,
  visible,
  initialIndex,
  onClose,
}: {
  urls: string[];
  visible: boolean;
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!visible) return null;

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <StatusBar backgroundColor="black" barStyle="light-content" />
      <View style={lightboxStyles.backdrop}>
        <TouchableOpacity style={lightboxStyles.closeBtn} onPress={onClose}>
          <Text style={lightboxStyles.closeText}>✕</Text>
        </TouchableOpacity>

        <FlatList
          data={urls}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(idx);
          }}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={lightboxStyles.slide}>
              <Image
                source={{ uri: item }}
                style={lightboxStyles.image}
                contentFit="contain"
              />
            </View>
          )}
        />

        {urls.length > 1 && (
          <View style={lightboxStyles.dots}>
            {urls.map((_, i) => (
              <View
                key={i}
                style={[
                  lightboxStyles.dot,
                  i === currentIndex && lightboxStyles.dotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  single: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: RADIUS,
    marginBottom: 8,
  },
  carouselContainer: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    aspectRatio: 1.2,
  },
  counterBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  counterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  dots: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
  },
});

const lightboxStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  dots: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
});
