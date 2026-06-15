import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Linking } from 'react-native';
import { useRoute } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mail, Phone } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

export default function DeeperScreen() {
  const route = useRoute<any>();
  const { companyDetails, coverLetter } = route.params || { companyDetails: '', coverLetter: '' };

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    runDeeperAnalysis();
  }, []);

  const runDeeperAnalysis = async () => {
    try {
      const firecrawlKey = await SecureStore.getItemAsync('api_key_firecrawl');
      const geminiKey = await SecureStore.getItemAsync('api_key_gemini');

      if (!geminiKey || !firecrawlKey) {
        Alert.alert('Error', 'Missing Gemini or Firecrawl API keys in Settings.');
        setLoading(false);
        return;
      }

      // 1. Identify Company Name using Gemini based on extracted details
      const genAI = new GoogleGenerativeAI(geminiKey);
      const extractModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const extractResult = await extractModel.generateContent(`Extract ONLY the company name from this text. If none, reply "Unknown":\n${companyDetails}`);
      const companyName = extractResult.response.text().trim();

      if (companyName === 'Unknown' || !companyName) {
        Alert.alert('Error', 'Could not identify the company name from the job details.');
        setLoading(false);
        return;
      }

      // 2. Search using Firecrawl (Search endpoint for web search)
      // Firecrawl Search API: POST https://api.firecrawl.dev/v1/search
      const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlKey}`
        },
        body: JSON.stringify({
          query: `${companyName} company leadership decision makers HR emails phone numbers`,
          pageOptions: { fetchPageContent: true }
        })
      });

      const searchData = await searchRes.json();

      let rawSearchResults = '';
      if (searchData && searchData.data) {
        // Concatenate snippet/content from search results
        rawSearchResults = searchData.data.map((d: any) => d.markdown || d.description || d.title).join('\n\n').substring(0, 5000); // Limit context size
      }

      // 3. Summarize and Extract Contacts using Gemini
      const analyzeModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }); // Using pro for better extraction
      const prompt = `
        Based on the following search results for the company "${companyName}":

        ${rawSearchResults}

        Task 1: Summarize the company in 300 words or less.
        Task 2: Extract a list of potential decision makers (e.g., HR, recruiters, executives).

        Return the data STRICTLY in the following JSON format:
        {
          "summary": "company summary here",
          "decision_makers": [
            { "name": "John Doe", "role": "HR Manager", "email": "john@example.com", "phone": "555-1234" }
          ]
        }
        If you cannot find an email or phone, leave the string empty.
      `;

      const finalResult = await analyzeModel.generateContent(prompt);
      let responseText = finalResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

      const parsedData = JSON.parse(responseText);

      setSummary(parsedData.summary || 'No summary available.');
      setContacts(parsedData.decision_makers || []);

    } catch (e) {
      console.error(e);
      Alert.alert('Analysis Failed', 'Could not complete the deeper analysis.');
      setSummary('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (email: string) => {
    if (!email) return;
    // Auto paste trick: Copy to clipboard, then open mail app.
    // The user just needs to long press -> Paste in the body.
    await Clipboard.setStringAsync(coverLetter);
    const mailUrl = `mailto:${email}?subject=Job Application`;
    Linking.openURL(mailUrl).catch(() => Alert.alert('Error', 'Could not open mail app.'));
  };

  const handleCall = (phone: string) => {
    if (!phone) return;
    const phoneUrl = `tel:${phone}`;
    Linking.openURL(phoneUrl).catch(() => Alert.alert('Error', 'Could not open phone app.'));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00e5ff" />
        <Text style={styles.loadingText}>Running Deep Web Search & AI Analysis...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Company Summary</Text>
      <View style={styles.card}>
        <Text style={styles.text}>{summary}</Text>
      </View>

      <Text style={styles.sectionTitle}>Decision Makers</Text>
      {contacts.length === 0 ? (
        <Text style={styles.text}>No contacts found in search results.</Text>
      ) : (
        contacts.map((contact, idx) => (
          <View key={idx} style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name || 'Unknown Name'}</Text>
              <Text style={styles.contactRole}>{contact.role || 'Unknown Role'}</Text>
            </View>
            <View style={styles.actionRow}>
              {!!contact.email && (
                <TouchableOpacity style={styles.actionButton} onPress={() => handleEmail(contact.email)}>
                  <Mail color="#000" size={16} />
                  <Text style={styles.actionText}>Email Now</Text>
                </TouchableOpacity>
              )}
              {!!contact.phone && (
                <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={() => handleCall(contact.phone)}>
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
  },
  sectionTitle: {
    color: '#00e5ff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
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
  contactCard: {
    backgroundColor: '#121212',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactRole: {
    color: '#999',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#00e5ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  callButton: {
    backgroundColor: '#00ffaa',
  },
  actionText: {
    color: '#000',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 12,
  },
});
