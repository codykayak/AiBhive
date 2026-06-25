import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, ThumbsUp, Bell, LayoutGrid, Wand2 } from 'lucide-react-native';
import { HiveLogo } from './HiveLogo';
import { PrimaryButton } from './ui';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';

const HIVE_BG = require('../../assets/aibhive-background.png');

type Slide = {
  id: string;
  emoji: string;
  title: string;
  body: string;
  steps?: { icon: React.ComponentType<{ color: string; size: number }>; label: string }[];
  tip?: string;
};

const SLIDES: Slide[] = [
  {
    id: 'welcome',
    emoji: '🐝',
    title: 'Hey — welcome to the Hive',
    body: 'AiBhive is your personal app factory. Tell us what you want in plain English. We build it. You don\'t write a single line of code.',
    tip: 'Seriously. Describe it like you\'re texting a friend.',
  },
  {
    id: 'howto',
    emoji: '✨',
    title: 'How it works (30 seconds)',
    body: 'That\'s the whole loop. Magic mode does the heavy lifting.',
    steps: [
      { icon: MessageCircle, label: 'Describe your app or feature' },
      { icon: ThumbsUp, label: 'Tap Approve on the quote' },
      { icon: Bell, label: 'Phone dings — open My Apps' },
    ],
  },
  {
    id: 'where',
    emoji: '📱',
    title: 'Where to tap',
    body: 'Three tabs. That\'s it.',
    steps: [
      { icon: Wand2, label: 'Build — chat & create new apps' },
      { icon: LayoutGrid, label: 'My Apps — everything the Hive made' },
      { icon: MessageCircle, label: 'Settings — AI style & updates' },
    ],
    tip: 'Job Tracker & Resume kit are in My Apps — our first examples.',
  },
  {
    id: 'go',
    emoji: '🚀',
    title: 'You\'re in',
    body: 'Try something small first — a habit tracker, expense log, or interview flashcards. The Hive loves a good first project.',
    tip: 'Magic ON = builds. Magic OFF = chill chat.',
  },
];

type Props = {
  visible: boolean;
  onDone: () => void;
};

export function WelcomeTutorial({ visible, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const goTo = (next: number) => {
    Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  const next = () => {
    if (isLast) onDone();
    else goTo(step + 1);
  };

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <ImageBackground
        source={HIVE_BG}
        style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16, maxHeight: height }]}
        imageStyle={styles.bgImage}
      >
        <View style={styles.bgDim} />
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <ScrollView
          contentContainerStyle={[styles.scroll, { minHeight: height * 0.55 }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={{ opacity: fade, alignItems: 'center', width: '100%' }}>
            <HiveLogo size={step === 0 ? 112 : 88} glow animate={step === 0} />
            <Text style={styles.emoji}>{slide.emoji}</Text>
            <Text style={[styles.title, { maxWidth: width - 48 }]}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>

            {slide.steps && (
              <View style={styles.steps}>
                {slide.steps.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <View key={s.label} style={styles.stepRow}>
                      <View style={styles.stepNum}>
                        <Text style={styles.stepNumText}>{i + 1}</Text>
                      </View>
                      <View style={styles.stepIcon}>
                        <Icon color={colors.amberLight} size={20} />
                      </View>
                      <Text style={styles.stepLabel}>{s.label}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {slide.tip && (
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>💡 {slide.tip}</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((s, i) => (
              <TouchableOpacity key={s.id} onPress={() => goTo(i)} hitSlop={12}>
                <View style={[styles.dot, i === step && styles.dotOn]} />
              </TouchableOpacity>
            ))}
          </View>

          <PrimaryButton
            label={isLast ? "Let's build something" : 'Next'}
            onPress={next}
            style={styles.cta}
            icon={isLast ? Wand2 : undefined}
          />

          {!isLast && (
            <TouchableOpacity onPress={onDone} style={styles.skip}>
              <Text style={styles.skipText}>Skip — I got this</Text>
            </TouchableOpacity>
          )}
        </View>
      </ImageBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  bgImage: {
    opacity: 0.5,
  },
  bgDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
  },
  glowTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.amberGlow,
    opacity: 0.35,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 80,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  emoji: {
    fontSize: 28,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: colors.amberLight,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 340,
    marginBottom: spacing.lg,
  },
  steps: {
    width: '100%',
    maxWidth: 360,
    gap: 12,
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    paddingVertical: 14,
    paddingHorizontal: 14,
    ...shadows.soft,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: colors.black,
    fontWeight: '900',
    fontSize: 13,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    flex: 1,
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
  },
  tipBox: {
    backgroundColor: colors.amberSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    maxWidth: 360,
    width: '100%',
  },
  tipText: {
    color: colors.amberLight,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    paddingTop: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderMuted,
  },
  dotOn: {
    backgroundColor: colors.amber,
    width: 28,
  },
  cta: { alignSelf: 'stretch' },
  skip: { alignSelf: 'center', marginTop: spacing.md, padding: 10 },
  skipText: { color: colors.textDim, fontWeight: '600', fontSize: 14 },
});
