import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HOME_HERO_VIDEO = require('../../assets/home-hero.mp4');

export const HERO_VIDEO_PLAY_MS = 5000;
export const HERO_VIDEO_FADE_MS = 900;

type Props = {
  /** Height reserved at the bottom for the floating assistant bar (during video) */
  bottomOverlay: number;
  /** Shown as the video fades — typically the assistant hero panel */
  assistantSlot?: React.ReactNode;
  /** Fires when the 5s timer ends and the cross-fade begins */
  onFadeStart?: () => void;
  /** Fires when the fade finishes and the assistant owns the hero */
  onIntroComplete?: () => void;
};

/**
 * Full-viewport intro video. After 5s it cross-fades out and the assistant slot fades in.
 * Replace `assets/home-hero.mp4` with your upload before building.
 */
export function HomeHeroVideo({ bottomOverlay, assistantSlot, onFadeStart, onIntroComplete }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const videoOpacity = useRef(new Animated.Value(1)).current;
  const assistantOpacity = useRef(new Animated.Value(0)).current;
  const [videoMounted, setVideoMounted] = useState(true);
  const [assistantReady, setAssistantReady] = useState(false);

  const heroHeight = Math.max(height - insets.top - bottomOverlay, width * 0.55);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      onFadeStart?.();
      setAssistantReady(true);
      Animated.parallel([
        Animated.timing(videoOpacity, {
          toValue: 0,
          duration: HERO_VIDEO_FADE_MS,
          useNativeDriver: true,
        }),
        Animated.timing(assistantOpacity, {
          toValue: 1,
          duration: HERO_VIDEO_FADE_MS,
          useNativeDriver: true,
        }),
      ]).start(async () => {
        try {
          await videoRef.current?.stopAsync();
        } catch {
          // Player may already be unloaded
        }
        setVideoMounted(false);
        onIntroComplete?.();
      });
    }, HERO_VIDEO_PLAY_MS);

    return () => clearTimeout(fadeTimer);
  }, [assistantOpacity, onFadeStart, onIntroComplete, videoOpacity]);

  return (
    <View style={[styles.wrap, { width, height: heroHeight }]}>
      {videoMounted ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: videoOpacity }]}>
          <Video
            ref={videoRef}
            source={HOME_HERO_VIDEO}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping={false}
            isMuted
            useNativeControls={false}
          />
          <View style={styles.scrim} pointerEvents="none" />
        </Animated.View>
      ) : null}

      {assistantReady ? (
        <Animated.View style={[styles.assistantLayer, { opacity: assistantOpacity }]}>
          {assistantSlot}
        </Animated.View>
      ) : null}
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
  assistantLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
