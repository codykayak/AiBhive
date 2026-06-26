import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

type Options = {
  onTranscript: (text: string, isFinal: boolean) => void;
  onStart?: () => void;
  onEnd?: () => void;
};

export function useSpeechToText({ onTranscript, onStart, onEnd }: Options) {
  const [listening, setListening] = useState(false);

  useSpeechRecognitionEvent('start', () => {
    setListening(true);
    onStart?.();
  });
  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    onEnd?.();
  });
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript?.trim();
    if (text) onTranscript(text, event.isFinal);
  });
  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    if (event.error === 'aborted' || event.error === 'no-speech') return;
    Alert.alert(
      'Voice input',
      event.message || 'Could not capture speech. Check microphone permission and try again.'
    );
  });

  const toggleListening = useCallback(async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      Alert.alert('Voice input', 'Speech recognition is not available on this device.');
      return;
    }

    const mic = await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
    if (!mic.granted) {
      Alert.alert('Microphone', 'Allow microphone access to use voice input.');
      return;
    }

    const speech = await ExpoSpeechRecognitionModule.requestSpeechRecognizerPermissionsAsync();
    if (!speech.granted) {
      Alert.alert('Speech recognition', 'Allow speech recognition to dictate into the chat box.');
      return;
    }

    ExpoSpeechRecognitionModule.start({
      lang: Platform.OS === 'ios' ? 'en-US' : 'en-US',
      interimResults: true,
      continuous: false,
      addsPunctuation: true,
    });
  }, [listening]);

  const stopListening = useCallback(() => {
    if (listening) ExpoSpeechRecognitionModule.stop();
  }, [listening]);

  return { listening, toggleListening, stopListening };
}
