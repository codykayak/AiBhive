import { Asset } from 'expo-asset';
import { useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import { theme } from '@/constants/theme';

const INTRO_VIDEO = require('../assets/video/diagnose-intro.mp4');
const AIBHIVE_LOGO = require('../assets/brand/aibhive-logo.png');

const WORDS = ['diagnose', 'anything,', 'anywhere,', 'anytime'] as const;
const STORAGE_KEY = 'aibhive.diagnose.introPlayed';

const WORD_AT = [600, 1400, 2200, 3000];
const WORDS_HIDE_AT = 3800;
const LOGO_AT = 4000;
const EXIT_AT = 5800;
const DONE_AT = 6500;

export function shouldPlayIntro(): boolean {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('intro') === '1') return true;
    // Always play in Expo web/dev so reloads show the branded intro.
    if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
    try {
      return window.sessionStorage.getItem(STORAGE_KEY) !== '1';
    } catch {
      return true;
    }
  }
  return true;
}

function markIntroPlayed() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('intro') === '1') return;
    if (typeof __DEV__ !== 'undefined' && __DEV__) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  }
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
  const startedAtRef = useRef(Date.now());
  const finishedRef = useRef(false);

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
    startedAtRef.current = Date.now();
    finishedRef.current = false;

    const id = setInterval(() => {
      if (finishedRef.current) return;
      const elapsed = Date.now() - startedAtRef.current;

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
        finishedRef.current = true;
        markIntroPlayed();
        setOpacity(0);
        onDoneRef.current();
      }
    }, 50);

    return () => {
      clearInterval(id);
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
