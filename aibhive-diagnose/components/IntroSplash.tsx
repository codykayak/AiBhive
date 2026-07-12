import { Asset } from 'expo-asset';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import { theme } from '@/constants/theme';

const INTRO_VIDEO = require('../assets/video/diagnose-intro.mp4');
const AIBHIVE_LOGO = require('../assets/brand/aibhive-logo.png');

const WORDS = ['diagnose', 'anything,', 'anywhere,', 'anytime'] as const;
/** Hard ceiling so throttled tabs / stalled video never trap the user. */
const INTRO_MAX_MS = 8000;

type Phase = 'words' | 'logo' | 'exit';

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

  if (Platform.OS !== 'web') return null;

  const React = require('react') as typeof import('react');
  return (
    <View style={StyleSheet.absoluteFill}>
      {React.createElement('video', {
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
      })}
    </View>
  );
}

function NativeVideoFallback() {
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.bg }]} />;
}

class NativeVideoBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // Video decode / Expo Go quirks should never block the app.
  }

  render() {
    if (this.state.failed) return <NativeVideoFallback />;
    return this.props.children;
  }
}

function NativeVideoPlayer() {
  const player = useVideoPlayer(INTRO_VIDEO, (instance) => {
    instance.loop = false;
    instance.muted = true;
  });

  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        try {
          player.play();
        } catch {
          // ignore
        }
      }
    });
    try {
      player.play();
    } catch {
      // ignore
    }
    return () => sub.remove();
  }, [player]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
      allowsPictureInPicture={false}
    />
  );
}

function NativeVideo() {
  return (
    <NativeVideoBoundary>
      <NativeVideoPlayer />
    </NativeVideoBoundary>
  );
}

/**
 * Sequential branded intro:
 * video + words one-by-one → fade to AiBhive logo → dismiss.
 * Tap anywhere to skip. Hard-caps at INTRO_MAX_MS.
 */
export function IntroSplash({ onDone }: Props) {
  const { width, height } = useWindowDimensions();
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const generationRef = useRef(0);
  const finishedRef = useRef(false);

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('words');
  const [opacity, setOpacity] = useState(1);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    timersRef.current.forEach(clearTimeout);
    timersRef.current.length = 0;
    generationRef.current += 1;
    onDoneRef.current();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const asset = Asset.fromModule(INTRO_VIDEO);
        await asset.downloadAsync();
        if (!cancelled) setVideoUri(asset.localUri ?? asset.uri);
      } catch {
        if (!cancelled && typeof INTRO_VIDEO === 'string') setVideoUri(INTRO_VIDEO);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const generation = ++generationRef.current;
    const timers = timersRef.current;
    timers.forEach(clearTimeout);
    timers.length = 0;
    finishedRef.current = false;

    const safe = (fn: () => void) => () => {
      if (generationRef.current !== generation || finishedRef.current) return;
      fn();
    };

    const schedule = (fn: () => void, ms: number) => {
      timers.push(setTimeout(safe(fn), ms));
    };

    setVisibleCount(0);
    setPhase('words');
    setOpacity(1);

    WORDS.forEach((_, index) => {
      schedule(() => setVisibleCount(index + 1), 700 + index * 850);
    });

    schedule(() => setPhase('logo'), 700 + WORDS.length * 850 + 500);

    schedule(() => {
      setPhase('exit');
      setOpacity(0);
    }, 700 + WORDS.length * 850 + 500 + 2200);

    schedule(() => {
      finish();
    }, Math.min(700 + WORDS.length * 850 + 500 + 2200 + 600, INTRO_MAX_MS));

    // Absolute fail-open if timers are throttled (background / Simple Browser).
    schedule(() => finish(), INTRO_MAX_MS);

    return () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
    };
  }, [finish]);

  const showWords = phase === 'words';
  const showLogo = phase === 'logo' || phase === 'exit';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Skip intro"
      onPress={finish}
      style={[
        styles.root,
        {
          width: Math.max(width, 320),
          height: Math.max(height, 568),
          opacity,
        },
      ]}
    >
      {Platform.OS === 'web' ? (
        videoUri ? <WebVideo uri={videoUri} /> : <View style={[StyleSheet.absoluteFill, styles.fallbackBg]} />
      ) : (
        <NativeVideo />
      )}
      <View style={styles.scrim} pointerEvents="none" />

      {showWords ? (
        <View style={styles.wordsBlock} pointerEvents="none">
          {WORDS.map((word, index) => (
            <Text
              key={word}
              style={[
                styles.word,
                {
                  opacity: index < visibleCount ? 1 : 0,
                },
              ]}
            >
              {word}
            </Text>
          ))}
        </View>
      ) : null}

      {showLogo ? (
        <View style={styles.logoBlock} pointerEvents="none">
          <Image
            source={AIBHIVE_LOGO}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="AiBhive"
          />
          <Text style={styles.product}>Diagnose</Text>
        </View>
      ) : null}

      <Text style={styles.skipHint} pointerEvents="none">
        Tap to skip
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 9999,
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
  skipHint: {
    position: 'absolute',
    bottom: 36,
    color: 'rgba(232, 236, 241, 0.55)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
