import { Asset } from 'expo-asset';
import { useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import { theme } from '@/constants/theme';

const INTRO_VIDEO = require('../assets/video/diagnose-intro.mp4');
const AIBHIVE_LOGO = require('../assets/brand/aibhive-logo.png');

const WORDS = ['diagnose', 'anything,', 'anywhere,', 'anytime'] as const;

const WORD_AT = [500, 1200, 1900, 2600] as const;
const WORDS_HIDE_AT = 3400;
const LOGO_AT = 3600;
const EXIT_AT = 5600;
const DONE_AT = 6200;

/** Session lock — survives React Strict Mode remounts. */
let introFinishedThisSession = false;

export function hasIntroFinished() {
  return introFinishedThisSession;
}

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

export function IntroSplash({ onDone }: Props) {
  const { width, height } = useWindowDimensions();
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const startRef = useRef<number | null>(null);

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [showWords, setShowWords] = useState(true);
  const [showLogo, setShowLogo] = useState(false);
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
    if (introFinishedThisSession) {
      onDoneRef.current();
      return;
    }

    // Keep a stable start time across Strict Mode double-invoke.
    if (startRef.current == null) {
      startRef.current = Date.now();
    }
    const startedAt = startRef.current;
    let raf = 0;
    let done = false;

    const tick = () => {
      const elapsed = Date.now() - startedAt;

      let words = 0;
      for (let i = 0; i < WORD_AT.length; i += 1) {
        if (elapsed >= WORD_AT[i]) words = i + 1;
      }
      setVisibleCount(words);
      setShowWords(elapsed < WORDS_HIDE_AT);
      setShowLogo(elapsed >= LOGO_AT);

      if (elapsed >= EXIT_AT) {
        const fade = Math.max(0, 1 - (elapsed - EXIT_AT) / (DONE_AT - EXIT_AT));
        setOpacity(fade);
      }

      if (elapsed >= DONE_AT) {
        if (!done) {
          done = true;
          introFinishedThisSession = true;
          setOpacity(0);
          onDoneRef.current();
        }
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <View style={[styles.root, { width, height, opacity }]}>
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
                  transform: [{ translateY: index < visibleCount ? 0 : 10 }],
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
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 1000,
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
