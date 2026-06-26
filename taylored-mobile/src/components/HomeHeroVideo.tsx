import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
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
 * Uses expo-video (expo-av crashes on Android with New Architecture enabled).
 */
export function HomeHeroVideo({ bottomOverlay, assistantSlot, onFadeStart, onIntroComplete }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const videoOpacity = useRef(new Animated.Value(1)).current;
  const assistantOpacity = useRef(new Animated.Value(0)).current;
  const onFadeStartRef = useRef(onFadeStart);
  const onIntroCompleteRef = useRef(onIntroComplete);
  const [videoMounted, setVideoMounted] = useState(true);
  const [assistantReady, setAssistantReady] = useState(false);

  const player = useVideoPlayer(HOME_HERO_VIDEO, (instance) => {
    instance.loop = false;
    instance.muted = true;
    instance.play();
  });

  onFadeStartRef.current = onFadeStart;
  onIntroCompleteRef.current = onIntroComplete;

  const heroHeight = Math.max(height - insets.top - bottomOverlay, width * 0.55);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      onFadeStartRef.current?.();
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
      ]).start(() => {
        try {
          player.pause();
        } catch {
          // Player may already be released
        }
        setVideoMounted(false);
        onIntroCompleteRef.current?.();
      });
    }, HERO_VIDEO_PLAY_MS);

    return () => clearTimeout(fadeTimer);
  }, [assistantOpacity, player, videoOpacity]);

  return (
    <View style={[styles.wrap, { width, height: heroHeight }]}>
      {videoMounted ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: videoOpacity }]}>
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
            allowsPictureInPicture={false}
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
