import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronUp, ExternalLink, FileText, Globe, Search, XCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePack } from '@/contexts/PackContext';
import { useAuth } from '@/contexts/AuthContext';
import { searchManuals } from '@/lib/knowledge/manuals';
import { filterManualSources, type ManualSourcePortal } from '@/lib/knowledge/manuals/sources';
import { searchManualChunksFromServer } from '@/lib/knowledge/manualRag';
import { theme } from '@/constants/theme';

export default function ManualsScreen() {
  const { q: initialQ } = useLocalSearchParams<{ q?: string }>();
  const { activePack } = usePack();
  const { user, getIdToken } = useAuth();
  const [query, setQuery] = useState(typeof initialQ === 'string' ? initialQ : '');
  const [ragChunks, setRagChunks] = useState<
    Array<{ id: string; title: string; brand: string; excerpt: string; score: number }>
  >([]);
  const [loadingRag, setLoadingRag] = useState(false);
  const [showSources, setShowSources] = useState(true);

  const sources = useMemo(() => filterManualSources(activePack.id), [activePack.id]);

  const results = useMemo(() => {
    const hits = searchManuals(query, activePack.id);
    return hits.slice(0, 20);
  }, [query, activePack.id]);

  const runRagSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed || !user) {
        setRagChunks([]);
        return;
      }

      setLoadingRag(true);
      try {
        const token = await getIdToken();
        if (!token) {
          setRagChunks([]);
          return;
        }
        const chunks = await searchManualChunksFromServer(token, trimmed, activePack.id);
        setRagChunks(
          chunks.map((c) => ({
            id: c.id,
            title: c.title,
            brand: c.brand,
            excerpt: c.text.slice(0, 320),
            score: 0,
          }))
        );
      } catch {
        setRagChunks([]);
      } finally {
        setLoadingRag(false);
      }
    },
    [activePack.id, getIdToken, user]
  );

  useEffect(() => {
    const t = setTimeout(() => void runRagSearch(query), 320);
    return () => clearTimeout(t);
  }, [query, runRagSearch]);

  useEffect(() => {
    if (typeof initialQ === 'string' && initialQ.trim()) {
      setQuery(initialQ.trim());
    }
  }, [initialQ]);

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView className="flex-1 bg-hive-bg" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-hive-ink text-xl font-bold mb-1">Manual lookup</Text>
        <Text className="text-hive-muted text-sm mb-4">
          {activePack.name} pack — search indexed manuals, OEM portals, and your company knowledge
          base.
        </Text>

        <View className="flex-row items-center bg-hive-surface border border-hive-border rounded-lg px-3 mb-4">
          <Search size={20} color={theme.colors.muted} />
          <TextInput
            className="flex-1 text-hive-ink py-3 px-2 text-base"
            placeholder="Model number, brand, or symptom…"
            placeholderTextColor={theme.colors.muted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <XCircle size={20} color={theme.colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => setShowSources((v) => !v)}
          className="flex-row items-center justify-between mb-2 py-2"
        >
          <View className="flex-row items-center gap-2">
            <Globe size={18} color={theme.colors.navy} />
            <Text className="text-hive-navy font-semibold">
              Where to find manuals ({sources.length} portals)
            </Text>
          </View>
          {showSources ? (
            <ChevronUp size={18} color={theme.colors.muted} />
          ) : (
            <ChevronDown size={18} color={theme.colors.muted} />
          )}
        </Pressable>

        {showSources ? (
          <View className="mb-5">
            {sources.map((portal: ManualSourcePortal) => (
              <Pressable
                key={portal.id}
                onPress={() => openUrl(portal.searchUrl)}
                className="bg-hive-surface border border-hive-border rounded-lg p-3 mb-2 active:opacity-80"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-hive-ink font-semibold">{portal.brand}</Text>
                    <Text className="text-hive-muted text-xs mt-0.5">{portal.portalName}</Text>
                    {portal.searchHint ? (
                      <Text className="text-hive-navy text-xs mt-1">{portal.searchHint}</Text>
                    ) : null}
                  </View>
                  <ExternalLink size={18} color={theme.colors.orange} />
                </View>
              </Pressable>
            ))}
            <Text className="text-hive-muted text-xs mt-1 px-1">
              Bulk PDFs you collect can be ingested into the Pros knowledge base for RAG search here.
            </Text>
          </View>
        ) : null}

        <Text className="text-hive-ink font-semibold mb-2">
          Indexed manuals {query.trim() ? `(${results.length})` : ''}
        </Text>

        {results.length === 0 ? (
          <View className="bg-hive-surface border border-hive-border rounded-lg p-4 mb-4">
            <Text className="text-hive-muted text-sm text-center">
              {query.trim()
                ? 'No indexed match — try a model prefix or check OEM portals above.'
                : 'Type a model number (e.g. IC40, Rinnai RU199) or brand name.'}
            </Text>
          </View>
        ) : (
          results.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => openUrl(entry.manualUrl)}
              className="bg-hive-surface border border-hive-border rounded-lg p-4 mb-2 active:opacity-80"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-hive-ink font-semibold">{entry.title}</Text>
                  <Text className="text-hive-muted text-xs mt-1">
                    {entry.brand} · {entry.packId}
                    {entry.modelPrefixes.length ? ` · ${entry.modelPrefixes.join(', ')}` : ''}
                  </Text>
                  {entry.summary ? (
                    <Text className="text-hive-muted text-xs mt-1" numberOfLines={2}>
                      {entry.summary}
                    </Text>
                  ) : null}
                </View>
                <View className="items-end">
                  <FileText size={22} color={theme.colors.orange} />
                  <Text className="text-hive-orange text-xs mt-1">Open PDF</Text>
                </View>
              </View>
              {entry.score > 0 ? (
                <Text className="text-hive-muted text-[10px] mt-2">match score {entry.score}</Text>
              ) : null}
            </Pressable>
          ))
        )}

        {user && query.trim() ? (
          <View className="mt-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Text className="text-hive-ink font-semibold">Knowledge base excerpts</Text>
              {loadingRag ? <ActivityIndicator size="small" color={theme.colors.orange} /> : null}
            </View>
            {ragChunks.length === 0 && !loadingRag ? (
              <Text className="text-hive-muted text-xs mb-2">
                No ingested manual chunks yet — use the Pros ingest API when bulk PDFs are ready.
              </Text>
            ) : (
              ragChunks.map((chunk) => (
                <View
                  key={chunk.id}
                  className="bg-hive-surface border border-hive-border border-l-4 border-l-hive-navy rounded-lg p-3 mb-2"
                >
                  <Text className="text-hive-ink font-medium text-sm">{chunk.title}</Text>
                  <Text className="text-hive-muted text-xs">{chunk.brand}</Text>
                  <Text className="text-hive-ink text-sm mt-2" numberOfLines={4}>
                    {chunk.excerpt}
                  </Text>
                </View>
              ))
            )}
          </View>
        ) : null}

        <Text className="text-hive-muted text-xs text-center mt-6 px-4">
          Offline index works without sign-in. Sign in with Pros for company RAG excerpts from
          ingested PDFs.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
