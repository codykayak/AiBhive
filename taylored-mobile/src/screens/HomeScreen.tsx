import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Send } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { GoogleGenerativeAI } from '@google/generative-ai';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
};

export default function HomeScreen() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: 'Hello. I am ready. How can I assist you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState('Gemini');

  useEffect(() => {
    const checkProvider = async () => {
      const p = await SecureStore.getItemAsync('selected_ai_provider');
      if (p) setProvider(p);
    };
    checkProvider();
    const interval = setInterval(checkProvider, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputText.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const apiKey = await SecureStore.getItemAsync(`api_key_${provider.toLowerCase()}`);
      if (!apiKey) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: `Please configure your ${provider} API key in Settings.` }]);
        setIsLoading(false);
        return;
      }

      if (provider === 'Gemini') {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const chat = model.startChat({
            history: messages.filter(m => m.id !== '1').map(m => ({
                role: m.role === 'ai' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }))
        });

        const result = await chat.sendMessage(userMsg.content);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: result.response.text() }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: `Mock response from ${provider}. Integration coming soon.` }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: 'Error communicating with the AI. Please check your API key.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ImageBackground source={require('../../assets/background.jpg')} style={styles.background}>
        <View style={styles.overlay}>
          <ScrollView style={styles.chatContainer} contentContainerStyle={{ padding: 20 }}>
            {messages.map(msg => (
              <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={styles.messageText}>{msg.content}</Text>
              </View>
            ))}
            {isLoading && (
              <View style={[styles.messageBubble, styles.aiBubble, { alignSelf: 'flex-start' }]}>
                <ActivityIndicator color="#00e5ff" />
              </View>
            )}
          </ScrollView>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Communicate..."
              placeholderTextColor="#666"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isLoading}>
              <Send color="#000" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, resizeMode: 'cover' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', paddingTop: 50 },
  chatContainer: { flex: 1 },
  messageBubble: { maxWidth: '85%', padding: 15, borderRadius: 15, marginBottom: 15 },
  userBubble: { backgroundColor: '#00e5ff', alignSelf: 'flex-end', borderBottomRightRadius: 0 },
  aiBubble: { backgroundColor: '#1a1a1a', alignSelf: 'flex-start', borderBottomLeftRadius: 0, borderWidth: 1, borderColor: '#333' },
  messageText: { color: '#fff', fontSize: 16 },
  inputContainer: { flexDirection: 'row', padding: 15, backgroundColor: '#121212', borderTopWidth: 1, borderTopColor: '#333', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, fontSize: 16, maxHeight: 100, minHeight: 40 },
  sendButton: { backgroundColor: '#00e5ff', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});
