import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export default function JewlesWebViewScreen() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 1000); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#00e5ff" /></View>;
  return <WebView source={{ uri: 'https://aibeehive.com' }} style={styles.container} />;
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }
});
