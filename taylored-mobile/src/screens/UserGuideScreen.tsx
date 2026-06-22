import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BookOpen, Rocket } from 'lucide-react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { GlassCard, PrimaryButton } from '../components/ui';
import {
  DELIVERY_OPTIONS_SUMMARY,
  USER_GUIDE_INTRO,
  USER_GUIDE_SECTIONS,
} from '../constants/userGuide';
import { colors, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

export default function UserGuideScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScreenLayout title="User Guide" subtitle="How builds become apps you can use" contentStyle={styles.content}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <GlassCard style={styles.introCard} glow>
          <View style={styles.introRow}>
            <BookOpen color={colors.amberLight} size={28} />
            <Text style={styles.introText}>{USER_GUIDE_INTRO}</Text>
          </View>
        </GlassCard>

        <Text style={styles.sectionLabel}>Delivery options</Text>
        <View style={styles.optionRow}>
          {DELIVERY_OPTIONS_SUMMARY.map((opt) => (
            <GlassCard key={opt.key} style={styles.optionCard}>
              <Text style={styles.optionStatus}>{opt.status}</Text>
              <Text style={styles.optionLabel}>{opt.label}</Text>
              <Text style={styles.optionDesc}>{opt.desc}</Text>
            </GlassCard>
          ))}
        </View>

        {USER_GUIDE_SECTIONS.map((section) => (
          <GlassCard key={section.id} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
            {section.bullets?.map((b) => (
              <View key={b} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </GlassCard>
        ))}

        <GlassCard style={styles.tipCard}>
          <View style={styles.tipRow}>
            <Rocket color={colors.amberLight} size={20} />
            <Text style={styles.tipTitle}>Recommended for most people</Text>
          </View>
          <Text style={styles.tipBody}>
            Start with in-app modules inside AiBhive. They are fastest to build, one install, and you can always ask
            for a web or standalone version later once you love the prototype.
          </Text>
          <PrimaryButton
            label="Go to Build"
            onPress={() => navigation.navigate('Main', { screen: 'Build' })}
            style={styles.tipBtn}
          />
        </GlassCard>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md },
  scroll: { paddingBottom: 40 },
  introCard: { marginBottom: spacing.lg },
  introRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  introText: { ...typography.body, color: colors.textMuted, flex: 1, lineHeight: 22 },
  sectionLabel: {
    ...typography.caption,
    color: colors.amberLight,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  optionCard: { flex: 1, minWidth: 100, padding: spacing.sm },
  optionStatus: { color: colors.success, fontSize: 10, fontWeight: '800', marginBottom: 4 },
  optionLabel: { color: colors.text, fontWeight: '800', fontSize: 13, marginBottom: 4 },
  optionDesc: { color: colors.textDim, fontSize: 11, lineHeight: 16 },
  sectionCard: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.amberLight, marginBottom: 8 },
  sectionBody: { ...typography.bodySm, color: colors.textMuted, lineHeight: 21, marginBottom: 8 },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 6, paddingRight: 4 },
  bulletDot: { color: colors.amber, fontWeight: '800', lineHeight: 20 },
  bulletText: { flex: 1, color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  tipCard: { marginTop: spacing.sm, borderColor: colors.borderStrong },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipTitle: { color: colors.amberLight, fontWeight: '800', fontSize: 16 },
  tipBody: { color: colors.textMuted, lineHeight: 22, fontSize: 14, marginBottom: spacing.md },
  tipBtn: { alignSelf: 'flex-start' },
});
