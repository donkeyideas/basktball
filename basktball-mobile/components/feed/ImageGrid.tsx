import React, { useState } from 'react';
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
const GAP = 4;
const RADIUS = 12;

interface ImageGridProps {
  urls: string[];
}

export function ImageGrid({ urls }: ImageGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (urls.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  // Single image — full width, auto aspect
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

  // Two images — side by side
  if (urls.length === 2) {
    return (
      <>
        <View style={styles.row}>
          <TouchableOpacity style={styles.half} activeOpacity={0.9} onPress={() => openLightbox(0)}>
            <Image source={{ uri: urls[0] }} style={styles.fill} contentFit="cover" />
          </TouchableOpacity>
          <View style={{ width: GAP }} />
          <TouchableOpacity style={styles.half} activeOpacity={0.9} onPress={() => openLightbox(1)}>
            <Image source={{ uri: urls[1] }} style={styles.fill} contentFit="cover" />
          </TouchableOpacity>
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

  // Three images — 1 big left + 2 small right
  if (urls.length === 3) {
    return (
      <>
        <View style={styles.row}>
          <TouchableOpacity style={styles.twoThirds} activeOpacity={0.9} onPress={() => openLightbox(0)}>
            <Image source={{ uri: urls[0] }} style={styles.fill} contentFit="cover" />
          </TouchableOpacity>
          <View style={{ width: GAP }} />
          <View style={styles.oneThird}>
            <TouchableOpacity style={styles.stackTop} activeOpacity={0.9} onPress={() => openLightbox(1)}>
              <Image source={{ uri: urls[1] }} style={styles.fill} contentFit="cover" />
            </TouchableOpacity>
            <View style={{ height: GAP }} />
            <TouchableOpacity style={styles.stackBottom} activeOpacity={0.9} onPress={() => openLightbox(2)}>
              <Image source={{ uri: urls[2] }} style={styles.fill} contentFit="cover" />
            </TouchableOpacity>
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

  // Four images — 2x2 grid
  return (
    <>
      <View style={styles.grid}>
        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.gridCell} activeOpacity={0.9} onPress={() => openLightbox(0)}>
            <Image source={{ uri: urls[0] }} style={styles.fill} contentFit="cover" />
          </TouchableOpacity>
          <View style={{ width: GAP }} />
          <TouchableOpacity style={styles.gridCell} activeOpacity={0.9} onPress={() => openLightbox(1)}>
            <Image source={{ uri: urls[1] }} style={styles.fill} contentFit="cover" />
          </TouchableOpacity>
        </View>
        <View style={{ height: GAP }} />
        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.gridCell} activeOpacity={0.9} onPress={() => openLightbox(2)}>
            <Image source={{ uri: urls[2] }} style={styles.fill} contentFit="cover" />
          </TouchableOpacity>
          <View style={{ width: GAP }} />
          <TouchableOpacity style={styles.gridCell} activeOpacity={0.9} onPress={() => openLightbox(3)}>
            <Image source={{ uri: urls[3] }} style={styles.fill} contentFit="cover" />
          </TouchableOpacity>
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
  row: {
    flexDirection: 'row',
    height: 200,
    borderRadius: RADIUS,
    overflow: 'hidden',
    marginBottom: 8,
  },
  half: {
    flex: 1,
  },
  twoThirds: {
    flex: 2,
  },
  oneThird: {
    flex: 1,
  },
  stackTop: {
    flex: 1,
  },
  stackBottom: {
    flex: 1,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  grid: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    marginBottom: 8,
  },
  gridRow: {
    flexDirection: 'row',
    height: 120,
  },
  gridCell: {
    flex: 1,
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
