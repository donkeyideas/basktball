import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text,
  PanResponder,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const RADIUS = 12;

interface ImageGridProps {
  urls: string[];
}

/** Single image that auto-sizes to its natural aspect ratio */
function AutoSizedImage({
  uri,
  onPress,
}: {
  uri: string;
  onPress?: () => void;
}) {
  const [aspect, setAspect] = useState(1.5);

  const img = (
    <Image
      source={{ uri }}
      style={{ width: '100%', aspectRatio: aspect }}
      contentFit="cover"
      onLoad={(e) => {
        const { width: w, height: h } = e.source;
        if (w && h) setAspect(w / h);
      }}
    />
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        {img}
      </TouchableOpacity>
    );
  }
  return img;
}

export function ImageGrid({ urls }: ImageGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Refs for PanResponder closure
  const urlsLenRef = useRef(urls.length);
  urlsLenRef.current = urls.length;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        // Only capture horizontal swipes (not vertical scroll)
        return Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 20;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -50) {
          // Swipe left → next
          setCurrentIndex((prev) => Math.min(prev + 1, urlsLenRef.current - 1));
        } else if (dx > 50) {
          // Swipe right → prev
          setCurrentIndex((prev) => Math.max(prev - 1, 0));
        }
      },
    })
  ).current;

  if (urls.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  // Single image — full width, natural aspect ratio
  if (urls.length === 1) {
    return (
      <>
        <View style={styles.singleContainer}>
          <AutoSizedImage uri={urls[0]} onPress={() => openLightbox(0)} />
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

  // Multiple images — state-based carousel with swipe
  return (
    <>
      <View style={styles.carouselContainer}>
        <View {...panResponder.panHandlers}>
          <AutoSizedImage
            uri={urls[currentIndex]}
            onPress={() => openLightbox(currentIndex)}
          />
        </View>

        {/* Counter badge */}
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {currentIndex + 1}/{urls.length}
          </Text>
        </View>
      </View>

      {/* Dot indicators */}
      <View style={styles.dots}>
        {urls.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
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
            const idx = Math.round(
              e.nativeEvent.contentOffset.x / SCREEN_WIDTH
            );
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
  singleContainer: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    marginBottom: 8,
  },
  carouselContainer: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
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
