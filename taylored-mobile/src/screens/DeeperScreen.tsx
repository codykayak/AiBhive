import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Linking } from 'react-native';
import { useRoute } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mail, Phone } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

export default function DeeperScreen() {
  const route = useRoute<any>();
  const { companyDetails, coldEmail } = route.params || { companyDetails: '', coldEmail: '' };

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => { runDeeperAnalysis(); }, []);

  const runDeeperAnalysis = async () => {
    try {
      const firecrawlKey = await SecureStore.getItemAsync('api_key_firecrawl');
      const geminiKey = await SecureStore.getItemAsync('api_key_gemini');
      if (!geminiKey || !firecrawlKey) { Alert.alert('Error', 'Missing APIs.'); setLoading(false); return; }

      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const extractRes = await model.generateContent(`Extract ONLY the company name from this text. If none, reply "Unknown":\n${companyDetails}`);
      const companyName = extractRes.response.text().trim();

      if (companyName === 'Unknown' || !companyName) { Alert.alert('Error', 'Could not identify company name.'); setLoading(false); return; }

      const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${firecrawlKey}` },
        body: JSON.stringify({ query: `${companyName} company leadership decision makers HR emails phone numbers`, pageOptions: { fetchPageContent: true } })
      });
      const searchData = await searchRes.json();

      let rawSearchResults = '';
      if (searchData && Array.isArray(searchData.data)) {
         rawSearchResults = searchData.data.map((d: any) => d.markdown || d.description || d.title).join('\n\n').substring(0, 5000);
      }

      const analyzeModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Based on search results for "${companyName}":\n${rawSearchResults}\nTask 1: Summarize company in 300 words.\nTask 2: Extract decision makers.\nReturn STRICTLY JSON format:\n{ "summary": "...", "decision_makers": [{ "name": "...", "role": "...", "email": "...", "phone": "..." }] }`;
      const finalResult = await analyzeModel.generateContent(prompt);
      let responseText = finalResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const parsedData = JSON.parse(responseText);
        setSummary(parsedData.summary || 'No summary available.');
        setContacts(parsedData.decision_makers || []);
      } catch (parseError) {
        setSummary('Failed to parse AI response.');
        setContacts([]);
      }
    } catch (e) {
      console.error(e);
      setSummary('Failed to fetch deeper data.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (email: string) => {
    if (!email) return;
    await Clipboard.setStringAsync(coldEmail);
    Linking.openURL(`mailto:${email}?subject=Job Application`).catch(() => Alert.alert('Error', 'Could not open mail app.'));
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#00e5ff" />
      <Text style={styles.loadingText}>Running Deep Web Search & AI Analysis...</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Company Summary</Text>
      <View style={styles.card}><Text style={styles.text}>{summary}</Text></View>
      <Text style={styles.sectionTitle}>Decision Makers</Text>
      {contacts.length === 0 ? (<Text style={styles.text}>No contacts found in search results.</Text>) : (
        contacts.map((c, i) => (
          <View key={i} style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{c.name || 'Unknown Name'}</Text>
              <Text style={styles.contactRole}>{c.role || 'Unknown Role'}</Text>
            </View>
            <View style={styles.actionRow}>
              {!!c.email && (
                <TouchableOpacity style={styles.actionButton} onPress={() => handleEmail(c.email)}>
                  <Mail color="#000" size={16} />
                  <Text style={styles.actionText}>Email Now</Text>
                </TouchableOpacity>
              )}
              {!!c.phone && (
                <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#00ffaa'}]} onPress={() => Linking.openURL(`tel:${c.phone}`)}>
                  <Phone color="#000" size={16} />
                  <Text style={styles.actionText}>Call</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a', padding: 20 },
  loadingText: { color: '#00e5ff', marginTop: 20 },
  sectionTitle: { color: '#00e5ff', fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  card: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  text: { color: '#fff', fontSize: 16, lineHeight: 24 },
  contactCard: { backgroundColor: '#121212', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#333', marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactInfo: { flex: 1 },
  contactName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  contactRole: { color: '#999', fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flexDirection: 'row', backgroundColor: '#00e5ff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5, alignItems: 'center' },
  actionText: { color: '#000', fontWeight: 'bold', marginLeft: 5, fontSize: 12 },
});
