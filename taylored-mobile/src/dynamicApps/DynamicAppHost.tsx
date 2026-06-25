import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { ChevronLeft, Download, Sparkles, Share2, SlidersHorizontal } from 'lucide-react-native';
import { brandFor, iconFor } from './branding';
import ListPage from './pageTypes/ListPage';
import TrackerPage from './pageTypes/TrackerPage';
import NotePage from './pageTypes/NotePage';
import CalculatorPage from './pageTypes/CalculatorPage';
import InfoPage from './pageTypes/InfoPage';
import type {
  CalculatorConfig, HiveAppPage, HiveAppSpec, InfoConfig, ListConfig, NoteConfig, TrackerConfig,
} from './types';
import {
  fetchUserApp, deleteUserApp as deleteUserAppRemote, shareAppToToolkit,
} from '../lib/hiveUserApps';
import { HIVE_COPY } from '../constants/hiveCopy';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

type Params = { appId?: string; app?: HiveAppSpec | null };

export default function DynamicAppHost() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ DynamicApp: Params }, 'DynamicApp'>>();
  const params = (route.params || {}) as Params;

  const [app, setApp] = useState<HiveAppSpec | null>(params.app ?? null);
  const [loading, setLoading] = useState(!params.app);
  const [activePageIdx, setActivePageIdx] = useState(0);

  useEffect(() => {
    if (params.app) return;
    if (!params.appId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchUserApp(params.appId)
      .then((spec) => {
        if (!cancelled) setApp(spec);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [params.appId, params.app]);

  const brand = useMemo(() => brandFor(app?.theme), [app?.theme]);
  const Icon = useMemo(() => iconFor(app?.icon), [app?.icon]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={brand.primary} />
      </View>
    );
  }
  if (!app) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Text style={styles.error}>This Hive app could not be loaded.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={colors.amberLight} size={20} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const page = app.pages[activePageIdx] || app.pages[0];

  const onDelete = () => {
    Alert.alert(
      'Delete this app?',
      `"${app.title}" and all its data on this device will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteUserAppRemote(app.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const onShareToolkit = async () => {
    const updated = await shareAppToToolkit(app.id);
    if (updated) {
      setApp(updated);
      Alert.alert('Shared!', HIVE_COPY.toolkitShared);
    } else {
      Alert.alert('Could not share', 'Try again when you are online.');
    }
  };

  return (
    <View style={[styles.shell, { backgroundColor: colors.bg }]}>
      {/* Branded header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: brand.gradientFrom,
            borderBottomColor: brand.primary,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <ChevronLeft color={brand.contrastText} size={26} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.titleRow}>
            <Icon color={brand.contrastText} size={22} />
            <Text style={[styles.title, { color: brand.contrastText }]} numberOfLines={1}>
              {app.title}
            </Text>
          </View>
          {app.tagline ? (
            <Text style={[styles.tagline, { color: brand.contrastText }]} numberOfLines={1}>
              {app.tagline}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('HiveExportOptions', { appId: app.id })}
          hitSlop={12}
          style={styles.exportPill}
        >
          <Download color={brand.contrastText} size={16} />
          <Text style={[styles.exportPillText, { color: brand.contrastText }]}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Page tabs */}
      {app.pages.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          style={[styles.tabsRow, { borderBottomColor: brand.primarySoft }]}
        >
          {app.pages.map((p, idx) => {
            const isActive = idx === activePageIdx;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setActivePageIdx(idx)}
                style={[
                  styles.tab,
                  isActive && { backgroundColor: brand.primarySoft, borderColor: brand.primary },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? brand.primaryText : colors.textMuted },
                  ]}
                >
                  {p.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Page body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderPage(page, app.id, brand)}

        <View style={[styles.iterCard, { borderColor: brand.primarySoft }]}>
          <View style={styles.iterRow}>
            <Sparkles color={brand.primary} size={18} />
            <Text style={styles.iterTitle}>Make it yours</Text>
          </View>
          <Text style={styles.iterBody}>
            Quick tweaks update this app in seconds (~$0.50). Full Hive customize adds real branding
            and custom behavior (~$4+).
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AppCustomize', { appId: app.id })}
            style={[styles.iterBtn, { backgroundColor: brand.primary }]}
          >
            <SlidersHorizontal color={brand.contrastText} size={16} />
            <Text style={[styles.iterBtnText, { color: brand.contrastText }]}>Tweak or Customize</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>Delete this app</Text>
          </TouchableOpacity>

          {app.visibility !== 'community' && !app.sourceCommunityAppId ? (
            <TouchableOpacity onPress={() => void onShareToolkit()} style={styles.shareBtn}>
              <Share2 color={brand.primary} size={16} />
              <Text style={[styles.shareText, { color: brand.primary }]}>{HIVE_COPY.shareToToolkit}</Text>
            </TouchableOpacity>
          ) : app.visibility === 'community' ? (
            <Text style={styles.sharedBadge}>{HIVE_COPY.toolkitShared}</Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function renderPage(page: HiveAppPage | undefined, appId: string, brand: ReturnType<typeof brandFor>) {
  if (!page) {
    return (
      <Text style={{ color: colors.textMuted }}>This app has no pages yet — ask Hive to add one.</Text>
    );
  }
  if (page.type === 'list') {
    return <ListPage appId={appId} pageId={page.id} config={page.config as ListConfig} brand={brand} />;
  }
  if (page.type === 'tracker') {
    return <TrackerPage appId={appId} pageId={page.id} config={page.config as TrackerConfig} brand={brand} />;
  }
  if (page.type === 'note') {
    return <NotePage appId={appId} pageId={page.id} config={page.config as NoteConfig} brand={brand} />;
  }
  if (page.type === 'calculator') {
    return (
      <CalculatorPage
        appId={appId}
        pageId={page.id}
        config={page.config as CalculatorConfig}
        brand={brand}
      />
    );
  }
  return <InfoPage config={page.config as InfoConfig} brand={brand} />;
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  error: { color: colors.danger },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: colors.amberLight, fontWeight: '700' },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
  },
  headerCenter: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...typography.h2, fontWeight: '800' },
  tagline: { marginTop: 2, fontSize: 12, opacity: 0.85 },
  exportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  exportPillText: { fontSize: 12, fontWeight: '800' },
  tabsRow: { borderBottomWidth: 1, maxHeight: 50 },
  tabs: { paddingHorizontal: spacing.md, paddingVertical: 8, gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  tabText: { fontSize: 12, fontWeight: '700' },
  body: { flex: 1 },
  bodyContent: { padding: spacing.md, paddingBottom: 80 },
  iterCard: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    backgroundColor: colors.bgElevated,
  },
  iterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  iterTitle: { color: colors.amberLight, fontWeight: '800', fontSize: 15 },
  iterBody: { color: colors.textMuted, lineHeight: 20, fontSize: 13 },
  iterBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iterBtnText: { fontWeight: '800', fontSize: 14 },
  deleteBtn: { marginTop: spacing.md, alignSelf: 'flex-start' },
  deleteText: { color: colors.textDim, fontSize: 12, fontWeight: '700' },
  shareBtn: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  shareText: { fontSize: 13, fontWeight: '800' },
  sharedBadge: { marginTop: spacing.sm, color: colors.textMuted, fontSize: 12, fontWeight: '700' },
});
