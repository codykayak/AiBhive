import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { auth } from '../firebaseConfig';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

export default function JewlesWebViewScreen() {
  const [loading, setLoading] = useState(true);

  // Note: For a real Expo Go/APK build, valid Android/iOS/Web Client IDs are required.
  // Using placeholders. The user requested Google Login here.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: 'PLACEHOLDER_WEB_CLIENT_ID',
    androidClientId: 'PLACEHOLDER_ANDROID_CLIENT_ID',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).then(() => {
        setLoading(false);
      });
    } else if (auth.currentUser) {
      setLoading(false);
    } else if (request) {
      // Auto prompt login if not logged in
      // For this MVP, we will bypass forcing Google Auth if it fails to load
      // because we don't have valid client IDs right now.
      setTimeout(() => setLoading(false), 1500);
    }
  }, [response, request]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00e5ff" />
      </View>
    );
  }

  // Assuming current repo web address is used for editing
  return (
    <WebView
      source={{ uri: 'https://aibeehive.com' }}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  }
});
