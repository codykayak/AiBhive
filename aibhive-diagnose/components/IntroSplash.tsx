import { Asset } from 'expo-asset';
import { useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import { theme } from '@/constants/theme';

const INTRO_VIDEO = require('../assets/video/diagnose-intro.mp4');
const AIBHIVE_LOGO = require('../assets/brand/aibhive-logo.png');

const WORDS = ['diagnose', 'anything,', 'anywhere,', 'anytime'] as const;

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

/**
 * Sequential branded intro:
 * video + words one-by-one → fade to AiBhive logo → dismiss.
 * Uses chained timeouts (not rAF) so web automation / background tabs can't skip.
 */
export function IntroSplash({ onDone }: Props) {
  const { width, height } = useWindowDimensions();
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const generationRef = useRef(0);

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('words');
  const [opacity, setOpacity] = useState(1);

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

    const safe = (fn: () => void) => () => {
      if (generationRef.current !== generation) return;
      fn();
    };

    const schedule = (fn: () => void, ms: number) => {
      timers.push(setTimeout(safe(fn), ms));
    };

    // Reset visual state for this generation
    setVisibleCount(0);
    setPhase('words');
    setOpacity(1);

    // Words one at a time
    WORDS.forEach((_, index) => {
      schedule(() => setVisibleCount(index + 1), 700 + index * 850);
    });

    // Hold last word, then logo
    schedule(() => setPhase('logo'), 700 + WORDS.length * 850 + 500);

    // Fade out
    schedule(() => {
      setPhase('exit');
      setOpacity(0);
    }, 700 + WORDS.length * 850 + 500 + 2200);

    // Done
    schedule(() => {
      onDoneRef.current();
    }, 700 + WORDS.length * 850 + 500 + 2200 + 600);

    return () => {
      // Invalidate this generation so late timers no-op.
      // Do NOT bump generation here — only clear timers.
      timers.forEach(clearTimeout);
      timers.length = 0;
    };
  }, []);

  const showWords = phase === 'words';
  const showLogo = phase === 'logo' || phase === 'exit';

  return (
    <View
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
                },
              ]}
            >
              {word}
            </Text>
          ))}
        </View>
      ) : null}

      {showLogo ? (
        <View style={styles.logoBlock}>
          <Image
            source={AIBHIVE_LOGO}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="AiBhive"
          />
          <Text style={styles.product}>Diagnose</Text>
        </View>
      ) : null}
    </View>
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
});
