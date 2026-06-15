import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { Copy, ChevronRight } from 'lucide-react-native';

export default function AutoBotResumeResultScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { name, email, phone, history, resumeUri, jobImages } = route.params;

  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState('');
  const [rewrittenResume, setRewrittenResume] = useState('');
  const [coldEmail, setColdEmail] = useState('');
  const [extractedJobDetails, setExtractedJobDetails] = useState('');

  useEffect(() => { generateApplication(); }, []);

  const generateApplication = async () => {
    try {
      const apiKey = await SecureStore.getItemAsync('api_key_gemini');
      if (!apiKey) { Alert.alert('Error', 'Gemini API key not configured.'); setLoading(false); return; }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const contentParts: any[] = [];

      const prompt = `
        You are an expert career coach and recruiter.
        I am applying for the job shown in the screenshots.

        My Info:
        Name: ${name} | Email: ${email} | Phone: ${phone}
        Notes: ${history}

        Please provide exactly 4 things formatted exactly with these headers:
        [JOB DETAILS]
        <extract key info from the job listing screenshots>

        [COVER LETTER]
        <write a highly professional, persuasive cover letter>

        [REWRITTEN RESUME]
        <rewrite and format my resume text to specifically highlight skills that match the job listing requirements>

        [COLD EMAIL]
        <write a punchy, 3-sentence cold outreach email designed for a hiring manager or recruiter to get an interview>
      `;
      contentParts.push(prompt);

      if (resumeUri) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(resumeUri);
          if (fileInfo.exists) {
            const base64Data = await FileSystem.readAsStringAsync(resumeUri, { encoding: FileSystem.EncodingType.Base64 });
            let mimeType = 'text/plain';
            if (resumeUri.endsWith('.pdf')) mimeType = 'application/pdf';
            if (resumeUri.endsWith('.doc')) mimeType = 'application/msword';
            if (resumeUri.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            contentParts.push({ inlineData: { data: base64Data, mimeType } });
          }
        } catch (e) { console.log('Could not read resume'); }
      }

      for (const uri of jobImages) {
        const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        contentParts.push({ inlineData: { data: base64Data, mimeType: 'image/jpeg' } });
      }

      const result = await model.generateContent(contentParts);
      const text = result.response.text();

      const matchDetails = text.match(/\[JOB DETAILS\]([\s\S]*?)\[COVER LETTER\]/i);
      const matchCover = text.match(/\[COVER LETTER\]([\s\S]*?)\[REWRITTEN RESUME\]/i);
      const matchResume = text.match(/\[REWRITTEN RESUME\]([\s\S]*?)\[COLD EMAIL\]/i);
      const matchCold = text.match(/\[COLD EMAIL\]([\s\S]*)/i);

      if (matchDetails) setExtractedJobDetails(matchDetails[1].trim());
      else setExtractedJobDetails('Details parsing failed');

      if (matchCover) setCoverLetter(matchCover[1].trim());
      else setCoverLetter('Cover Letter parsing failed');

      if (matchResume) setRewrittenResume(matchResume[1].trim());
      else setRewrittenResume('Resume rewriting failed');

      if (matchCold) setColdEmail(matchCold[1].trim());
      else setColdEmail(text);

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate application.');
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string, title: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${title} copied to clipboard!`);
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#00e5ff" />
      <Text style={styles.loadingText}>Analyzing job and drafting tailored application...</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Job Details Extracted</Text>
      <View style={styles.card}><Text style={styles.text}>{extractedJobDetails || 'No details extracted.'}</Text></View>

      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Drafted Cover Letter</Text>
        <TouchableOpacity onPress={() => copyText(coverLetter, 'Cover Letter')} style={styles.iconButton}><Copy color="#00e5ff" size={20} /></TouchableOpacity>
      </View>
      <View style={styles.card}><Text style={styles.text}>{coverLetter}</Text></View>

      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Tailored Resume</Text>
        <TouchableOpacity onPress={() => copyText(rewrittenResume, 'Resume')} style={styles.iconButton}><Copy color="#00e5ff" size={20} /></TouchableOpacity>
      </View>
      <View style={styles.card}><Text style={styles.text}>{rewrittenResume}</Text></View>

      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Cold Outreach Email</Text>
        <TouchableOpacity onPress={() => copyText(coldEmail, 'Cold Email')} style={styles.iconButton}><Copy color="#00e5ff" size={20} /></TouchableOpacity>
      </View>
      <View style={styles.card}><Text style={styles.text}>{coldEmail}</Text></View>

      <TouchableOpacity style={styles.deeperButton} onPress={() => navigation.navigate('Deeper', { companyDetails: extractedJobDetails, coldEmail })}>
        <Text style={styles.deeperText}>Find Decision Makers (Deeper)</Text>
        <ChevronRight color="#000" size={24} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a', padding: 20 },
  loadingText: { color: '#00e5ff', marginTop: 20, textAlign: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  sectionTitle: { color: '#00e5ff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  iconButton: { padding: 5 },
  card: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  text: { color: '#fff', fontSize: 16, lineHeight: 24 },
  deeperButton: { backgroundColor: '#00e5ff', flexDirection: 'row', padding: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 50 },
  deeperText: { color: '#000', fontSize: 16, fontWeight: 'bold', marginRight: 10 },
});
