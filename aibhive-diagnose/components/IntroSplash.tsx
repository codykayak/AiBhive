import { useEffect } from 'react';
import { Image, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';

import { theme } from '@/constants/theme';

const INTRO_VIDEO = require('../assets/video/diagnose-intro.mp4');
const AIBHIVE_LOGO = require('../assets/brand/aibhive-logo.png');

const WORDS = ['diagnose', 'anything,', 'anywhere,', 'anytime'] as const;

/** Word stagger + logo hold tuned to the ~6s intro clip. */
const WORD_START_MS = 450;
const WORD_STAGGER_MS = 650;
const WORD_FADE_MS = 420;
const LOGO_AT_MS = WORD_START_MS + WORDS.length * WORD_STAGGER_MS + 700;
const EXIT_AT_MS = 5600;
const EXIT_FADE_MS = 500;

type Props = {
  onDone: () => void;
};

export function IntroSplash({ onDone }: Props) {
  const { width, height } = useWindowDimensions();
  const screenOpacity = useSharedValue(1);
  const wordsOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.86);
  const w0 = useSharedValue(0);
  const w1 = useSharedValue(0);
  const w2 = useSharedValue(0);
  const w3 = useSharedValue(0);
  const wordValues = [w0, w1, w2, w3];

  const player = useVideoPlayer(INTRO_VIDEO, (instance) => {
    instance.loop = false;
    instance.muted = true;
  });

  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        player.play();
      }
    });
    player.play();
    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    wordsOpacity.value = withDelay(WORD_START_MS - 80, withTiming(1, { duration: 200 }));

    const hideWordsAt = LOGO_AT_MS - 200;

    wordValues.forEach((value, index) => {
      const appearAt = WORD_START_MS + index * WORD_STAGGER_MS;
      const visibleFor = Math.max(hideWordsAt - appearAt - WORD_FADE_MS, 200);
      value.value = withDelay(
        appearAt,
        withSequence(
          withTiming(1, { duration: WORD_FADE_MS, easing: Easing.out(Easing.cubic) }),
          withDelay(visibleFor, withTiming(0, { duration: 380, easing: Easing.in(Easing.quad) }))
        )
      );
    });

    wordsOpacity.value = withDelay(hideWordsAt, withTiming(0, { duration: 400 }));

    logoOpacity.value = withDelay(
      LOGO_AT_MS,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
    logoScale.value = withDelay(
      LOGO_AT_MS,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );

    const exitTimer = setTimeout(() => {
      screenOpacity.value = withTiming(0, { duration: EXIT_FADE_MS });
    }, EXIT_AT_MS);

    const doneTimer = setTimeout(() => {
      try {
        player.pause();
      } catch {
        // ignore
      }
      onDone();
    }, EXIT_AT_MS + EXIT_FADE_MS);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [logoOpacity, logoScale, onDone, player, screenOpacity, w0, w1, w2, w3, wordsOpacity]);

  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));
  const wordsWrapStyle = useAnimatedStyle(() => ({ opacity: wordsOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const wordStyles = [
    useAnimatedStyle(() => ({
      opacity: w0.value,
      transform: [{ translateY: interpolate(w0.value, [0, 1], [18, 0]) }],
    })),
    useAnimatedStyle(() => ({
      opacity: w1.value,
      transform: [{ translateY: interpolate(w1.value, [0, 1], [18, 0]) }],
    })),
    useAnimatedStyle(() => ({
      opacity: w2.value,
      transform: [{ translateY: interpolate(w2.value, [0, 1], [18, 0]) }],
    })),
    useAnimatedStyle(() => ({
      opacity: w3.value,
      transform: [{ translateY: interpolate(w3.value, [0, 1], [18, 0]) }],
    })),
  ];

  return (
    <Animated.View style={[styles.root, { width, height }, screenStyle]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
        surfaceType={Platform.OS === 'android' ? 'textureView' : 'surfaceView'}
      />
      <View style={styles.scrim} pointerEvents="none" />

      <Animated.View style={[styles.wordsBlock, wordsWrapStyle]}>
        {WORDS.map((word, index) => (
          <Animated.Text key={word} style={[styles.word, wordStyles[index]]}>
            {word}
          </Animated.Text>
        ))}
      </Animated.View>

      <Animated.View style={[styles.logoBlock, logoStyle]}>
        <Image source={AIBHIVE_LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="AiBhive" />
        <Text style={styles.product}>Diagnose</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 15, 20, 0.42)',
  },
  wordsBlock: {
    position: 'absolute',
    left: 28,
    right: 28,
    alignItems: 'center',
    gap: 6,
  },
  word: {
    color: theme.colors.mist,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  logoBlock: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 168,
    height: 168,
    borderRadius: 36,
  },
  product: {
    marginTop: 16,
    color: theme.colors.amber,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});
