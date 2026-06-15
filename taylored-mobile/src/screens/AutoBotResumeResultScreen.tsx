import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { Copy, ChevronRight } from 'lucide-react-native';
import * as base64js from 'base64-js';

export default function AutoBotResumeResultScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { name, email, phone, history, resumeUri, jobImages } = route.params;

  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState('');
  const [extractedJobDetails, setExtractedJobDetails] = useState('');

  useEffect(() => {
    generateCoverLetter();
  }, []);

  const generateCoverLetter = async () => {
    try {
      const apiKey = await SecureStore.getItemAsync('api_key_gemini');
      if (!apiKey) {
        Alert.alert('Error', 'Gemini API key not configured in Settings.');
        setLoading(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      let resumeText = 'No resume provided.';
      if (resumeUri) {
        try {
          // For a real app, parsing a PDF/DOCX locally requires a specific library.
          // For simplicity/MVP, we attempt to read it as text, or fallback to the manual history.
          // Alternatively, we could upload it to Gemini File API if supported by the React Native SDK.
          // We will use the history text strongly.
          const fileInfo = await FileSystem.getInfoAsync(resumeUri);
          if (fileInfo.exists) {
            resumeText = await FileSystem.readAsStringAsync(resumeUri, { encoding: FileSystem.EncodingType.UTF8 });
          }
        } catch (e) {
          console.log('Could not read resume as plain text, relying on history field.');
        }
      }

      const imageParts = [];
      for (const uri of jobImages) {
        const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        imageParts.push({
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg'
          }
        });
      }

      const prompt = `
        You are an expert career coach and cover letter writer.
        I am applying for a job. Here are the screenshots of the job listing.
        Please extract the key details of the job listing (company name, role, key requirements).
        Then, draft a highly professional, persuasive cover letter for me.

        My Info:
        Name: ${name}
        Email: ${email}
        Phone: ${phone}

        My Resume Text / Work History:
        ${resumeText}

        Additional Notes:
        ${history}

        Return the response exactly in this format:
        [JOB DETAILS]
        <extracted details>
        [COVER LETTER]
        <the drafted cover letter>
      `;

      const result = await model.generateContent([prompt, ...imageParts]);
      const text = result.response.text();

      const detailsMatch = text.match(/\[JOB DETAILS\]([\s\S]*?)\[COVER LETTER\]/);
      const letterMatch = text.match(/\[COVER LETTER\]([\s\S]*)/);

      if (detailsMatch && detailsMatch[1]) setExtractedJobDetails(detailsMatch[1].trim());
      if (letterMatch && letterMatch[1]) setCoverLetter(letterMatch[1].trim());
      else setCoverLetter(text); // Fallback if format isn't strictly followed

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate cover letter.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(coverLetter);
    Alert.alert('Copied', 'Cover letter copied to clipboard!');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00e5ff" />
        <Text style={styles.loadingText}>Analyzing job listing and drafting cover letter...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Job Details Extracted</Text>
      <View style={styles.card}>
        <Text style={styles.text}>{extractedJobDetails || 'No details extracted.'}</Text>
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Drafted Cover Letter</Text>
        <TouchableOpacity onPress={copyToClipboard} style={styles.iconButton}>
          <Copy color="#00e5ff" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.text}>{coverLetter}</Text>
      </View>

      <TouchableOpacity
        style={styles.deeperButton}
        onPress={() => navigation.navigate('Deeper', { companyDetails: extractedJobDetails, coverLetter })}
      >
        <Text style={styles.deeperText}>Deeper</Text>
        <ChevronRight color="#000" size={24} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  loadingText: {
    color: '#00e5ff',
    marginTop: 20,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  sectionTitle: {
    color: '#00e5ff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  iconButton: {
    padding: 5,
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  deeperButton: {
    backgroundColor: '#00e5ff',
    flexDirection: 'row',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 50,
  },
  deeperText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
});
