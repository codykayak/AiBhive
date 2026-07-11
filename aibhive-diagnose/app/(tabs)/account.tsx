import * as ImagePicker from 'expo-image-picker';
import { LogIn, LogOut, UserRound } from 'lucide-react-native';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import { BigButton } from '@/components/BigButton';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountScreen() {
  const { user, profile, loading, signInWithGoogle, signOut, saveProfile } = useAuth();
  const [name, setName] = useState(profile?.displayName || '');

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

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
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
              label="Sign out"
              variant="ghost"
              icon={<LogOut color={theme.colors.mist} size={22} />}
              onPress={() => void signOut()}
            />
          </>
        ) : (
          <BigButton
            label={loading ? 'Loading…' : 'Sign in with Google'}
            icon={<LogIn color={theme.colors.bg} size={22} />}
            onPress={() => {
              void signInWithGoogle().catch((err) =>
                Alert.alert('Sign-in', err instanceof Error ? err.message : 'Failed')
              );
            }}
          />
        )}
      </View>

      <Text className="mt-8 text-sm leading-5 text-hive-steel">
        Managers dispatch work at aibhive.com/pros — including Grok, Claude, Kimi, and Gemini API keys for
        the company.
      </Text>
    </ScrollView>
  );
}
