import { Asset } from 'expo-asset';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';

import { theme } from '@/constants/theme';

const INTRO_VIDEO = require('../assets/video/diagnose-intro.mp4');
const AIBHIVE_LOGO = require('../assets/brand/aibhive-logo.png');

const WORDS = ['diagnose', 'anything,', 'anywhere,', 'anytime'] as const;

const WORD_START_MS = 500;
const WORD_STAGGER_MS = 700;
const LOGO_AT_MS = WORD_START_MS + WORDS.length * WORD_STAGGER_MS + 800;
const WORDS_HIDE_MS = LOGO_AT_MS - 250;
const EXIT_AT_MS = 6200;
const EXIT_FADE_MS = 550;

type Props = {
  onDone: () => void;
};

function WebVideo({ uri }: { uri: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    void el.play().catch(() => undefined);
  }, [uri]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {Platform.OS === 'web' ? (
        <View style={StyleSheet.absoluteFill}>
          {/**
           * Using a plain DOM video keeps the intro reliable in Expo web.
           */}
          {(() => {
            const React = require('react') as typeof import('react');
            return React.createElement('video', {
              ref,
              src: uri,
              muted: true,
              autoPlay: true,
              playsInline: true,
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              },
            });
          })()}
        </View>
      ) : null}
    </View>
  );
}

function NativeVideo() {
  const player = useVideoPlayer(INTRO_VIDEO, (instance) => {
    instance.loop = false;
    instance.muted = true;
  });

  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') player.play();
    });
    player.play();
    return () => sub.remove();
  }, [player]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
      allowsPictureInPicture={false}
      surfaceType={Platform.OS === 'android' ? 'textureView' : 'surfaceView'}
    />
  );
}

export function IntroSplash({ onDone }: Props) {
  const { width, height } = useWindowDimensions();
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [showWords, setShowWords] = useState(true);
  const [showLogo, setShowLogo] = useState(false);
  const screenOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.88);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const asset = Asset.fromModule(INTRO_VIDEO);
        await asset.downloadAsync();
        if (!cancelled) {
          setVideoUri(asset.localUri ?? asset.uri);
        }
      } catch {
        if (!cancelled && typeof INTRO_VIDEO === 'string') {
          setVideoUri(INTRO_VIDEO);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    WORDS.forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleCount(index + 1);
        }, WORD_START_MS + index * WORD_STAGGER_MS)
      );
    });

    timers.push(
      setTimeout(() => {
        setShowWords(false);
      }, WORDS_HIDE_MS)
    );

    timers.push(
      setTimeout(() => {
        setShowLogo(true);
        logoOpacity.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
        logoScale.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
      }, LOGO_AT_MS)
    );

    timers.push(
      setTimeout(() => {
        screenOpacity.value = withTiming(0, { duration: EXIT_FADE_MS });
      }, EXIT_AT_MS)
    );

    timers.push(
      setTimeout(() => {
        onDoneRef.current();
      }, EXIT_AT_MS + EXIT_FADE_MS)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [logoOpacity, logoScale, screenOpacity]);

  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <Animated.View style={[styles.root, { width, height }, screenStyle]}>
      {Platform.OS === 'web' ? (
        videoUri ? <WebVideo uri={videoUri} /> : <View style={[StyleSheet.absoluteFill, styles.fallbackBg]} />
      ) : (
        <NativeVideo />
      )}
      <View style={styles.scrim} />

      {showWords ? (
        <View style={styles.wordsBlock}>
          {WORDS.map((word, index) => (
            <Text
              key={word}
              style={[
                styles.word,
                {
                  opacity: index < visibleCount ? 1 : 0,
                  transform: [{ translateY: index < visibleCount ? 0 : 12 }],
                },
              ]}
            >
              {word}
            </Text>
          ))}
        </View>
      ) : null}

      {showLogo ? (
        <Animated.View style={[styles.logoBlock, logoStyle]}>
          <Image
            source={AIBHIVE_LOGO}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="AiBhive"
          />
          <Text style={styles.product}>Diagnose</Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fallbackBg: {
    backgroundColor: theme.colors.bg,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 15, 20, 0.45)',
  },
  wordsBlock: {
    position: 'absolute',
    left: 28,
    right: 28,
    alignItems: 'center',
    gap: 8,
  },
  word: {
    color: theme.colors.mist,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  logoBlock: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 176,
    height: 176,
    borderRadius: 38,
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
