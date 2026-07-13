import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { LogIn, LogOut, Users, UserRound } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/BigButton';
import {
  JoinTeamModal,
  markJoinPromptSkipped,
  shouldShowJoinPrompt,
} from '@/components/JoinTeamModal';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProsAiStatus, type ProsAiStatus } from '@/lib/diagnose/aiStatus';
import { joinProsCompany } from '@/lib/jobs/prosSync';
import { safeAlert } from '@/lib/safeAlert';

function formatAuthError(err: unknown): string {
  if (!err || typeof err !== 'object') return 'Sign-in failed. Try again.';
  const e = err as { code?: string; message?: string };
  const code = e.code || '';
  const message = (e.message || '').trim();

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Sign-in was cancelled.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error — check your connection and try again.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain isn’t authorized for Google sign-in yet.';
  }
  if (code === 'auth/missing-client-id') {
    return message || 'Google OAuth client ID is not configured for this build.';
  }
  if (code === 'auth/native-pending') {
    return (
      message ||
      'Google sign-in on phone works in the installed APK (not Expo Go preview). Use the web app or install the field APK when ready.'
    );
  }
  if (message) return message;
  if (code) return `Sign-in failed (${code}).`;
  return 'Sign-in failed. Try again.';
}

function aiStatusLabel(status: ProsAiStatus | null, signedIn: boolean): string {
  if (!signedIn) return 'Sign in + join a team to unlock Pros AI.';
  if (!status) return 'Could not load AI status (join a Pros team if you haven’t).';
  if (status.aiEnabled) return `Pros AI on · ${status.provider || 'grok'} (${status.source})`;
  if (status.billingStatus && !['trial', 'active'].includes(status.billingStatus)) {
    return `Billing ${status.billingStatus} — pack library still works offline.`;
  }
  if (!status.configured) return 'No Grok key yet — manager adds keys at aibhive.com/pros/app.';
  return 'Pros AI not ready.';
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, loading, signInWithGoogle, signInWithTeamCode, signOut, saveProfile, getIdToken } =
    useAuth();
  const [name, setName] = useState(profile?.displayName || '');
  const [teamCode, setTeamCode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [joinVisible, setJoinVisible] = useState(false);
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<ProsAiStatus | null>(null);
  const promptedRef = useRef(false);

  useEffect(() => {
    if (profile?.displayName) setName(profile.displayName);
  }, [profile?.displayName]);

  useEffect(() => {
    if (!user) {
      setAiStatus(null);
      return;
    }
    void (async () => {
      const token = await getIdToken();
      if (!token) return;
      const status = await fetchProsAiStatus(token);
      setAiStatus(status);
    })();
  }, [user, getIdToken]);

  useEffect(() => {
    if (!user || promptedRef.current) return;
    promptedRef.current = true;
    void (async () => {
      if (await shouldShowJoinPrompt()) {
        setJoinError(null);
        setJoinVisible(true);
      }
    })();
  }, [user]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;
    await saveProfile({ photoUrl: result.assets[0].uri, displayName: name || profile?.displayName });
  };

  const saveName = async () => {
    await saveProfile({ displayName: name.trim() || 'Tech' });
    safeAlert('Saved', 'Profile updated.');
  };

  const handleTeamSignIn = async () => {
    setAuthError(null);
    const code = teamCode.trim();
    const displayName = name.trim() || profile?.displayName || '';
    if (!code) {
      setAuthError('Enter your shop team code (PROS-XXXXXX).');
      return;
    }
    if (!displayName) {
      setAuthError('Enter your name first.');
      return;
    }
    try {
      await signInWithTeamCode(code, displayName);
      await saveProfile({ displayName });
      await markJoinPromptSkipped();
      setJoinVisible(false);
      safeAlert('Signed in', 'You’re on the roster. Pros AI and job sync are enabled.');
      const token = await getIdToken();
      if (token) {
        const status = await fetchProsAiStatus(token);
        setAiStatus(status);
      }
    } catch (err) {
      const msg = formatAuthError(err);
      setAuthError(msg);
      safeAlert('Sign-in', msg);
    }
  };

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = formatAuthError(err);
      setAuthError(msg);
      safeAlert('Sign-in', msg);
    }
  };

  const skipJoin = async () => {
    await markJoinPromptSkipped();
    setJoinVisible(false);
    setJoinError(null);
  };

  const handleJoin = async (code: string) => {
    setJoinBusy(true);
    setJoinError(null);
    try {
      const token = await getIdToken();
      if (!token) {
        const displayName = name.trim() || profile?.displayName || 'Tech';
        if (!displayName) {
          setJoinError('Enter your name on the Account screen first.');
          return;
        }
        await signInWithTeamCode(code, displayName);
        await saveProfile({ displayName });
      } else {
        await joinProsCompany(token, code, name || profile?.displayName);
      }
      await markJoinPromptSkipped();
      setJoinVisible(false);
      safeAlert('Joined', 'You’re on the Pros roster. Jobs will sync when available.');
      const freshToken = await getIdToken();
      if (freshToken) {
        const status = await fetchProsAiStatus(freshToken);
        setAiStatus(status);
      }
    } catch (err) {
      let msg = formatAuthError(err);
      try {
        const parsed = JSON.parse(msg) as { error?: string };
        if (parsed?.error) msg = parsed.error;
      } catch {
        // keep msg
      }
      setJoinError(msg || 'Could not join with that code.');
    } finally {
      setJoinBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-hive-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 48 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-bold text-hive-mist">Account</Text>
        <Text className="mt-1 text-base text-hive-steel">
          Sign in with your shop team code to unlock Pros AI and job sync.
        </Text>

        <View className="mt-6 items-center">
          <Pressable onPress={() => void pickPhoto()} className="relative">
            {profile?.photoUrl ? (
              <Image
                source={{ uri: profile.photoUrl }}
                style={{ width: 96, height: 96, borderRadius: 28 }}
              />
            ) : (
              <View
                className="items-center justify-center"
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 28,
                  backgroundColor: theme.colors.elevated,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <UserRound color={theme.colors.amber} size={40} />
              </View>
            )}
            <Text className="mt-2 text-center text-xs font-bold uppercase tracking-wider text-hive-amber">
              Change photo
            </Text>
          </Pressable>
        </View>

        <View className="mt-6 rounded-sm border border-hive-border bg-hive-elevated p-4">
          <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-hive-steel">Your name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name for the roster"
            placeholderTextColor={theme.colors.steel}
            className="min-h-[52px] rounded-sm border border-hive-border bg-hive-bg px-3 text-base text-hive-mist"
          />
          <View className="mt-3">
            <BigButton label="Save profile" onPress={() => void saveName()} />
          </View>
        </View>

        <View className="mt-6 rounded-sm border border-hive-border bg-hive-elevated p-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-hive-amber">Pros AI</Text>
          <Text className="mt-2 text-sm leading-5 text-hive-mist">
            {aiStatusLabel(aiStatus, Boolean(user))}
          </Text>
        </View>

        <View className="mt-6 rounded-sm border border-hive-amber/30 bg-hive-elevated p-4">
          <Text className="text-base font-bold text-hive-mist">Field knowledge network</Text>
          <Text className="mt-2 text-sm leading-5 text-hive-steel">
            Like other apps, we share tips anonymously — no names, customers, or addresses — so every
            shop using AiBhive Pros gets stronger, faster field knowledge. Your team still keeps a private
            shop playbook; the network only sees scrubbed tips.
          </Text>
          <View className="mt-4 flex-row items-center justify-between gap-3">
            <View className="flex-1 pr-2">
              <Text className="text-sm font-semibold text-hive-mist">Share anonymously</Text>
              <Text className="mt-1 text-xs text-hive-steel">
                Opt in so real-world fixes help other techs (and you get theirs back).
              </Text>
            </View>
            <Switch
              value={profile?.shareAnonymously !== false}
              onValueChange={(v) => void saveProfile({ shareAnonymously: v })}
              trackColor={{ false: theme.colors.border, true: `${theme.colors.amber}88` }}
              thumbColor={profile?.shareAnonymously !== false ? theme.colors.amber : theme.colors.steel}
            />
          </View>
        </View>

        <View className="mt-6 gap-3">
          {user ? (
            <>
              <Text className="text-sm text-hive-steel">
                Signed in{user.email ? ` as ${user.email}` : ' with team code'}
              </Text>
              <BigButton
                label="Switch team"
                variant="secondary"
                icon={<Users color={theme.colors.amber} size={22} />}
                onPress={() => {
                  setJoinError(null);
                  setJoinVisible(true);
                }}
              />
              <BigButton
                label="Sign out"
                variant="ghost"
                icon={<LogOut color={theme.colors.mist} size={22} />}
                onPress={() => void signOut()}
              />
            </>
          ) : (
            <>
              <View className="rounded-sm border border-hive-border bg-hive-elevated p-4 gap-3">
                <Text className="text-xs font-bold uppercase tracking-wider text-hive-steel">Team code</Text>
                <TextInput
                  value={teamCode}
                  onChangeText={setTeamCode}
                  autoCapitalize="characters"
                  placeholder="PROS-XXXXXX"
                  placeholderTextColor={theme.colors.steel}
                  className="min-h-[52px] rounded-sm border border-hive-border bg-hive-bg px-3 text-base text-hive-mist"
                />
                <Text className="text-xs text-hive-steel">
                  Your manager shares this from AiBhive Pros HQ (aibhive.com/pros/app → Team tab).
                </Text>
                <BigButton
                  label={loading ? 'Loading…' : 'Sign in with team code'}
                  icon={<Users color={theme.colors.onPrimary} size={22} />}
                  onPress={() => void handleTeamSignIn()}
                />
              </View>
              {Platform.OS === 'web' ? (
                <BigButton
                  label="Sign in with Google"
                  variant="secondary"
                  icon={<LogIn color={theme.colors.amber} size={22} />}
                  onPress={() => void handleSignIn()}
                />
              ) : null}
            </>
          )}
          {authError ? <Text className="text-sm text-hive-danger">{authError}</Text> : null}
        </View>

        <Text className="mt-8 text-sm leading-5 text-hive-steel">
          Managers create companies and team codes at aibhive.com/pros/app — including Grok, Claude, Kimi,
          and Gemini API keys for the company.
        </Text>
      </ScrollView>

      <JoinTeamModal
        visible={joinVisible}
        busy={joinBusy}
        error={joinError}
        onJoin={handleJoin}
        onSkip={() => void skipJoin()}
        onOpenSignup={() => {
          void Linking.openURL('https://aibhive.com/pros/app');
        }}
      />
    </KeyboardAvoidingView>
  );
}
