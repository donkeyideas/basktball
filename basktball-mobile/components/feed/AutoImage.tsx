import React, { useState } from 'react';
import { Image, ImageProps } from 'expo-image';

/**
 * Image that auto-sizes to its natural aspect ratio.
 * Shows full image without cropping, with rounded corners.
 */
export function AutoImage({ style, ...props }: ImageProps) {
  const [aspect, setAspect] = useState(1);

  return (
    <Image
      {...props}
      style={[
        { width: '100%', borderRadius: 12, marginBottom: 8 },
        style,
        { aspectRatio: aspect },
      ]}
      contentFit="cover"
      onLoad={(e) => {
        const { width, height } = e.source;
        if (width && height) setAspect(width / height);
      }}
    />
  );
}
