import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Sparkles, Wand2, Bell } from 'lucide-react-native';
import { HiveOrb } from './HiveOrb';
import { PrimaryButton } from './ui';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Welcome to Taylored',
    body: 'Describe any app or tool in plain English. The Hive quotes time and cost — you tap once, we build it.',
    icon: Sparkles,
  },
  {
    title: 'Hive Magic',
    body: 'Turn Magic ON on the Build tab. Approve the estimate. Go live your life. Your phone dings when it\'s ready.',
    icon: Wand2,
  },
  {
    title: 'Your factory',
    body: 'Job tracker, resume kit, and every app you create live in My Apps. Iterate anytime — same flow.',
    icon: Bell,
  },
];

type Props = {
  visible: boolean;
  onDone: () => void;
};

export function OnboardingOverlay({ visible, onDone }: Props) {
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const Icon = slide.icon;
  const isLast = step === SLIDES.length - 1;

  const next = () => {
    if (isLast) onDone();
    else setStep((s) => s + 1);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.orbRow}>
            <HiveOrb size={72} />
          </View>
          <View style={styles.iconBadge}>
            <Icon color={colors.black} size={22} />
          </View>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>

          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotOn]} />
            ))}
          </View>

          <PrimaryButton
            label={isLast ? "Let's build" : 'Next'}
            onPress={next}
            style={styles.cta}
          />
          {!isLast && (
            <TouchableOpacity onPress={onDone} style={styles.skip}>
              <Text style={styles.skipText}>Skip intro</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg + 4,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    alignItems: 'center',
    maxWidth: Math.min(width - 48, 420),
    alignSelf: 'center',
    width: '100%',
    ...shadows.amber,
  },
  orbRow: { marginBottom: spacing.md },
  iconBadge: {
    position: 'absolute',
    top: spacing.lg + 8,
    right: spacing.lg + 8,
    backgroundColor: colors.amber,
    borderRadius: radii.pill,
    padding: 8,
  },
  title: {
    ...typography.h2,
    color: colors.amberLight,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderMuted,
  },
  dotOn: {
    backgroundColor: colors.amber,
    width: 24,
  },
  cta: { alignSelf: 'stretch' },
  skip: { marginTop: spacing.md, padding: 8 },
  skipText: { color: colors.textDim, fontWeight: '600', fontSize: 14 },
});
