import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { LogIn, LogOut, Users, UserRound } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import { joinProsCompany } from '@/lib/jobs/prosSync';

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
  if (message) return message;
  if (code) return `Sign-in failed (${code}).`;
  return 'Sign-in failed. Try again.';
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, loading, signInWithGoogle, signOut, saveProfile, getIdToken } = useAuth();
  const [name, setName] = useState(profile?.displayName || '');
  const [authError, setAuthError] = useState<string | null>(null);
  const [joinVisible, setJoinVisible] = useState(false);
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const promptedRef = useRef(false);

  useEffect(() => {
    if (profile?.displayName) setName(profile.displayName);
  }, [profile?.displayName]);

  // After first successful sign-in, offer join-team code once.
  useEffect(() => {
    if (!user || promptedRef.current) return;
    promptedRef.current = true;
    void (async () => {
      if (await shouldShowJoinPrompt()) {
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
    Alert.alert('Saved', 'Profile updated.');
  };

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = formatAuthError(err);
      setAuthError(msg);
      Alert.alert('Sign-in', msg);
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
        setJoinError('Sign in first, then enter your team code.');
        return;
      }
      await joinProsCompany(token, code, name || profile?.displayName);
      await markJoinPromptSkipped();
      setJoinVisible(false);
      Alert.alert('Joined', 'You’re on the Pros roster. Jobs will sync when available.');
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
          Sign in to sync Pros jobs. Your photo shows on Home instead of the logo.
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

        <View className="mt-6 rounded-2xl border border-hive-border bg-hive-elevated p-4">
          <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-hive-steel">Your name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name for the roster"
            placeholderTextColor={theme.colors.steel}
            className="min-h-[52px] rounded-xl border border-hive-border bg-hive-bg px-3 text-base text-hive-mist"
          />
          <View className="mt-3">
            <BigButton label="Save profile" onPress={() => void saveName()} />
          </View>
        </View>

        <View className="mt-6 gap-3">
          {user ? (
            <>
              <Text className="text-sm text-hive-steel">Signed in as {user.email}</Text>
              <BigButton
                label="Join a Pros team"
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
              <BigButton
                label={loading ? 'Loading…' : 'Sign in with Google'}
                icon={<LogIn color={theme.colors.bg} size={22} />}
                onPress={() => void handleSignIn()}
              />
              <BigButton
                label="Have a team code?"
                variant="secondary"
                icon={<Users color={theme.colors.amber} size={22} />}
                onPress={() => {
                  setJoinError('Sign in first, then enter your invite code.');
                  setJoinVisible(true);
                }}
              />
            </>
          )}
          {authError ? <Text className="text-sm text-hive-danger">{authError}</Text> : null}
        </View>

        <Text className="mt-8 text-sm leading-5 text-hive-steel">
          Managers create companies and invite codes at aibhive.com/pros — including Grok, Claude, Kimi,
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
          void Linking.openURL('https://aibhive.com/pros');
        }}
      />
    </KeyboardAvoidingView>
  );
}
