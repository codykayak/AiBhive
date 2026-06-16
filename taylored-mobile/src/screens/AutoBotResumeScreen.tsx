import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Upload, Camera, FileText, Link2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/ui';
import { colors, radii, spacing } from '../theme/colors';

export default function AutoBotResumeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [history, setHistory] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [resumeUri, setResumeUri] = useState<string | null>(null);
  const [jobImages, setJobImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length) {
        setResumeUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Upload failed', 'Could not attach your resume file.');
    }
  };

  const pickJobImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach job listing screenshots.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.length) {
      setJobImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleGenerate = () => {
    if (!name.trim()) {
      Alert.alert('Missing info', 'Enter your full name.');
      return;
    }
    if (!jobUrl.trim() && jobImages.length === 0) {
      Alert.alert('Missing job listing', 'Paste a job posting URL or add at least one screenshot of the listing.');
      return;
    }
    if (!resumeUri && !history.trim()) {
      Alert.alert('Missing background', 'Upload a resume or add work history notes so the AI can tailor your application.');
      return;
    }

    setLoading(true);
    navigation.navigate('AutoBotResumeResult', {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      history: history.trim(),
      jobUrl: jobUrl.trim(),
      resumeUri,
      jobImages,
    });
    setLoading(false);
  };

  return (
    <ScreenLayout
      title="Auto-Bot Resume"
      subtitle="Drop in a job listing and your background. We will craft a tailored application kit."
      showBrand={false}
      contentStyle={styles.content}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Jane Doe" placeholderTextColor={colors.textDim} />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="jane@email.com"
              placeholderTextColor={colors.textDim}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="(555) 123-4567"
              placeholderTextColor={colors.textDim}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Job Posting URL</Text>
          <View style={styles.urlRow}>
            <Link2 color={colors.amber} size={18} />
            <TextInput
              style={[styles.input, styles.urlInput]}
              value={jobUrl}
              onChangeText={setJobUrl}
              placeholder="https://company.com/careers/role"
              placeholderTextColor={colors.textDim}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Upload Resume</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickResume}>
            <FileText color={colors.amberLight} size={22} />
            <Text style={styles.uploadText}>{resumeUri ? 'Resume attached' : 'Select PDF, DOC, DOCX, or TXT'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Work History / Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={history}
            onChangeText={setHistory}
            placeholder="Extra experience, achievements, or skills not in your resume..."
            placeholderTextColor={colors.textDim}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Job Listing Screenshots</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickJobImage}>
            <Camera color={colors.amberLight} size={22} />
            <Text style={styles.uploadText}>Add screenshot</Text>
          </TouchableOpacity>
          <View style={styles.imageGrid}>
            {jobImages.map((uri, index) => (
              <Image key={`${uri}-${index}`} source={{ uri }} style={styles.thumbnail} />
            ))}
          </View>
        </View>

        <PrimaryButton
          label={loading ? 'Launching...' : 'Generate Application Kit'}
          onPress={handleGenerate}
          disabled={loading}
          style={styles.generateButton}
        />
        {loading && <ActivityIndicator color={colors.amberLight} style={{ marginTop: 12 }} />}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md },
  inputGroup: { marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
  label: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  input: {
    backgroundColor: colors.bgInput,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radii.md,
    padding: 14,
    fontSize: 16,
  },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  urlInput: { flex: 1 },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    padding: 18,
    gap: 10,
  },
  uploadText: { color: colors.amberLight, fontSize: 15, fontWeight: '600', flex: 1 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 10 },
  thumbnail: { width: 84, height: 84, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border },
  generateButton: { marginTop: spacing.sm },
});
