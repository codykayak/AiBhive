import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Upload, Camera, FileText } from 'lucide-react-native';

export default function AutoBotResumeScreen() {
  const navigation = useNavigation<any>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [history, setHistory] = useState('');

  const [resumeUri, setResumeUri] = useState<string | null>(null);
  const [jobImages, setJobImages] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });
      if (result.assets && result.assets.length > 0) {
        setResumeUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Error picking document', err);
    }
  };

  const pickJobImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setJobImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handleGenerate = async () => {
    // We will implement the AI logic in the next step
    navigation.navigate('AutoBotResumeResult', {
        name, email, phone, history, resumeUri, jobImages
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>auto-bot=resume</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="John Doe" placeholderTextColor="#666" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="john@example.com" placeholderTextColor="#666" keyboardType="email-address" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="(555) 123-4567" placeholderTextColor="#666" keyboardType="phone-pad" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Upload Resume</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={pickResume}>
          <FileText color="#00e5ff" size={24} />
          <Text style={styles.uploadText}>{resumeUri ? 'Resume Attached' : 'Select Resume File'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Other Work History / Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={history}
          onChangeText={setHistory}
          placeholder="Additional details not in resume..."
          placeholderTextColor="#666"
          multiline
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Job Listing Screenshots</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={pickJobImage}>
          <Camera color="#00e5ff" size={24} />
          <Text style={styles.uploadText}>Add Screenshot</Text>
        </TouchableOpacity>
        <View style={styles.imageGrid}>
          {jobImages.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.thumbnail} />
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.generateText}>Generate Cover Letter</Text>}
      </TouchableOpacity>

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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    justifyContent: 'center',
  },
  uploadText: {
    color: '#00e5ff',
    marginLeft: 10,
    fontSize: 16,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 10,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  generateButton: {
    backgroundColor: '#00e5ff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  generateText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
