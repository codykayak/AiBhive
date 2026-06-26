import React, { useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HOME_HERO_VIDEO = require('../../assets/home-hero.mp4');

type Props = {
  /** Height reserved at the bottom for the floating assistant bar */
  bottomOverlay: number;
};

/**
 * Full-viewport hero video. Replace `assets/home-hero.mp4` with your upload before building.
 */
export function HomeHeroVideo({ bottomOverlay }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);

  const heroHeight = Math.max(height - insets.top - bottomOverlay, width * 0.55);

  return (
    <View style={[styles.wrap, { width, height: heroHeight }]}>
      <Video
        ref={videoRef}
        source={HOME_HERO_VIDEO}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
        useNativeControls={false}
      />
      <View style={styles.scrim} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#020617',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.18)',
  },
});
