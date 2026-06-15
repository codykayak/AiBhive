import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Bot, AppWindow } from 'lucide-react-native';

export default function AppsScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Applications</Text>

      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.appCard}
          onPress={() => navigation.navigate('JewlesWebView')}
        >
          <View style={styles.iconContainer}>
            <AppWindow color="#00e5ff" size={40} />
          </View>
          <Text style={styles.appTitle}>Jewles</Text>
          <Text style={styles.appDesc}>Web Editor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.appCard}
          onPress={() => navigation.navigate('AutoBotResume')}
        >
          <View style={styles.iconContainer}>
            <Bot color="#00e5ff" size={40} />
          </View>
          <Text style={styles.appTitle}>auto-bot=resume</Text>
          <Text style={styles.appDesc}>AI Job Application</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
    paddingTop: 50,
  },
  header: {
    color: '#00e5ff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  appCard: {
    width: '48%',
    backgroundColor: '#121212',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#00e5ff',
  },
  appTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  appDesc: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
});
