import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/colors';

const HOME_HERO_VIDEO = require('../../assets/home-hero.mp4');

export const HERO_VIDEO_PLAY_MS = 5000;
export const HERO_VIDEO_FADE_MS = 900;

export const HOME_INTRO_TAGLINE = "Ask anything, if it doesn't exist we BUILD it";

type Props = {
  /** Height reserved at the bottom for the floating assistant bar */
  bottomOverlay: number;
  /** Skip video — intro already played this session */
  skip?: boolean;
  /** Fires when the fade finishes */
  onIntroComplete?: () => void;
};

/**
 * Full-viewport intro video (first visit only). After 5s cross-fades to tagline.
 */
export function HomeHeroVideo({ bottomOverlay, skip = false, onIntroComplete }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const videoOpacity = useRef(new Animated.Value(1)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const onIntroCompleteRef = useRef(onIntroComplete);
  const [videoMounted, setVideoMounted] = useState(!skip);
  const [taglineVisible, setTaglineVisible] = useState(false);
  const [finished, setFinished] = useState(skip);

  const player = useVideoPlayer(skip ? null : HOME_HERO_VIDEO, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  onIntroCompleteRef.current = onIntroComplete;

  const heroHeight = Math.max(height - insets.top - bottomOverlay, width * 0.55);

  useEffect(() => {
    if (skip || finished) return;
    const playSub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        player.play();
      }
    });
    player.play();
    return () => playSub.remove();
  }, [finished, player, skip]);

  useEffect(() => {
    if (skip) {
      onIntroCompleteRef.current?.();
      return;
    }
    const fadeTimer = setTimeout(() => {
      setTaglineVisible(true);
      Animated.parallel([
        Animated.timing(videoOpacity, {
          toValue: 0,
          duration: HERO_VIDEO_FADE_MS,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: HERO_VIDEO_FADE_MS,
          useNativeDriver: true,
        }),
      ]).start(() => {
        try {
          player.pause();
        } catch {
          // ignore
        }
        setVideoMounted(false);
        setFinished(true);
        onIntroCompleteRef.current?.();
      });
    }, HERO_VIDEO_PLAY_MS);

    return () => clearTimeout(fadeTimer);
  }, [player, skip, taglineOpacity, videoOpacity]);

  if (skip || finished) {
    return null;
  }

  return (
    <View style={[styles.wrap, { width, height: heroHeight }]}>
      {videoMounted ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: videoOpacity }]}>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="cover"
            nativeControls={false}
            allowsPictureInPicture={false}
            surfaceType={Platform.OS === 'android' ? 'textureView' : 'surfaceView'}
          />
          <View style={styles.scrim} pointerEvents="none" />
        </Animated.View>
      ) : null}

      {taglineVisible ? (
        <Animated.View style={[styles.taglineLayer, { opacity: taglineOpacity }]} pointerEvents="none">
          <Text style={styles.tagline}>{HOME_INTRO_TAGLINE}</Text>
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
  video: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.12)',
  },
  taglineLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  tagline: {
    color: colors.amberLight,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: 0.2,
  },
});
