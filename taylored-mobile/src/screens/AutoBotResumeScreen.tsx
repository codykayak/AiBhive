import React, { useCallback, useEffect, useState } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Camera, FileText, Link2, ImagePlus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppThemeShell } from '../components/AppThemeShell';
import { builtInAppForThemeKey } from '../constants/builtInHiveApps';
import { PrimaryButton } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { createJobDraft } from '../lib/jobs';
import { loadUserProfile, syncProfileToCloud } from '../lib/userProfile';
import { keyboardAvoidBehavior } from '../hooks/useKeyboardInset';
import { colors, radii, spacing } from '../theme/colors';

export default function AutoBotResumeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const theme = builtInAppForThemeKey('resume')!;
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [history, setHistory] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [resumeUri, setResumeUri] = useState<string | null>(null);
  const [jobImages, setJobImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    void loadUserProfile(user.uid).then((profile) => {
      if (!profile) return;
      if (profile.candidateName) setName(profile.candidateName);
      if (profile.email) setEmail(profile.email);
      if (profile.phone) setPhone(profile.phone);
      if (profile.history) setHistory(profile.history);
      if (profile.resumeDownloadUrl) setResumeUri(profile.resumeDownloadUrl);
      else if (profile.resumeUri) setResumeUri(profile.resumeUri);
    });
  }, [user?.uid]);

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

  const addImageUri = (uri: string) => {
    setJobImages((prev) => [...prev, uri]);
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access in Settings to attach job screenshots.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets?.length) {
      result.assets.forEach((a) => addImageUri(a.uri));
    }
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera access to capture job listing screenshots.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.length) {
      addImageUri(result.assets[0].uri);
    }
  };

  const pickFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (!result.canceled && result.assets?.length) {
        result.assets.forEach((a) => addImageUri(a.uri));
      }
    } catch (err: unknown) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Could not open file picker.');
    }
  };

  const pickJobImage = () => {
    Alert.alert('Add job screenshot', 'Choose a source', [
      { text: 'Photo library', onPress: () => void pickFromLibrary() },
      { text: 'Camera', onPress: () => void pickFromCamera() },
      { text: 'Browse files (DeX)', onPress: () => void pickFromFiles() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeImage = (index: number) => {
    setJobImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
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
    try {
      const job = await createJobDraft({
        candidateName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        jobUrl: jobUrl.trim(),
        notes: history.trim(),
        resumeUri: resumeUri || undefined,
        screenshotUris: jobImages,
      });

      if (user?.uid) {
        await syncProfileToCloud(user.uid, {
          candidateName: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          history: history.trim(),
          resumeUri: resumeUri || undefined,
        });
      }

      navigation.navigate('AutoBotResumeResult', {
        jobId: job.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        history: history.trim(),
        jobUrl: jobUrl.trim(),
        resumeUri,
        jobImages: job.screenshotUris,
      });
    } catch {
      Alert.alert('Error', 'Could not save job draft. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppThemeShell
      theme={theme}
      subtitle="Drop in a job listing and your background. Each application saves to Job Tracker."
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboardAvoidBehavior()} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
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
            <Text style={styles.uploadText}>Add screenshot (gallery, camera, or files)</Text>
          </TouchableOpacity>
          <View style={styles.imageGrid}>
            {jobImages.map((uri, index) => (
              <TouchableOpacity key={`${uri}-${index}`} onLongPress={() => removeImage(index)}>
                <Image source={{ uri }} style={styles.thumbnail} />
              </TouchableOpacity>
            ))}
          </View>
          {jobImages.length > 0 && (
            <Text style={styles.hint}>Long-press a thumbnail to remove it.</Text>
          )}
        </View>

        <PrimaryButton
          label={loading ? 'Saving & launching...' : 'Generate Application Kit'}
          onPress={handleGenerate}
          disabled={loading}
          style={styles.generateButton}
        />
        {loading && <ActivityIndicator color={colors.amberLight} style={{ marginTop: 12 }} />}

        <TouchableOpacity style={styles.trackerLink} onPress={() => navigation.navigate('JobTracker')}>
          <ImagePlus color={colors.amberLight} size={18} />
          <Text style={styles.trackerLinkText}>View saved jobs in Job Tracker</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </AppThemeShell>
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
  urlRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  hint: { color: colors.textDim, fontSize: 12, marginTop: 6 },
  generateButton: { marginTop: spacing.sm },
  trackerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.lg,
    paddingVertical: 12,
  },
  trackerLinkText: { color: colors.amberLight, fontWeight: '700' },
});
