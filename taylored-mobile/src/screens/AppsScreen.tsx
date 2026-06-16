import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Bot, AppWindow, Briefcase } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenLayout } from '../components/ScreenLayout';
import { GlassCard } from '../components/ui';
import { colors, radii, spacing } from '../theme/colors';

export default function AppsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <ScreenLayout
      title="Hive Apps"
      subtitle="Launch tools tuned for job search, outreach, and application automation."
      contentStyle={styles.content}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        <TouchableOpacity
          style={styles.appCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('AutoBotResume')}
        >
          <View style={styles.iconContainer}>
            <Bot color={colors.amberLight} size={34} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.appTitle}>Auto-Bot Resume</Text>
            <Text style={styles.appDesc}>
              Tailor your resume, cover letter, and cold email to a specific job listing.
            </Text>
          </View>
          <Briefcase color={colors.amber} size={18} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.appCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('JewlesWebView')}
        >
          <View style={styles.iconContainer}>
            <AppWindow color={colors.amberLight} size={34} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.appTitle}>Jewles Web Studio</Text>
            <Text style={styles.appDesc}>Open the AiBhive web experience inside the app.</Text>
          </View>
        </TouchableOpacity>

        <GlassCard style={styles.tipCard}>
          <Text style={styles.tipTitle}>Pro tip</Text>
          <Text style={styles.tipText}>
            Add your Gemini API key in Settings. For company intel and job URL scraping, also add a Firecrawl key.
          </Text>
        </GlassCard>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardBody: { flex: 1 },
  appTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  appDesc: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  tipCard: {
    marginTop: spacing.sm,
  },
  tipTitle: {
    color: colors.amberLight,
    fontWeight: '800',
    marginBottom: 6,
  },
  tipText: {
    color: colors.textMuted,
    lineHeight: 20,
    fontSize: 14,
  },
});
