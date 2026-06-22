import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export type HiveAttachment = {
  uri: string;
  width: number;
  height: number;
  base64: string;
  mimeType: string;
};

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.82;

/** Pick and resize an image for Hive Magic build references. */
export async function pickHiveReferenceImage(): Promise<HiveAttachment | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: JPEG_QUALITY,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  let uri = asset.uri;
  let width = asset.width ?? MAX_EDGE;
  let height = asset.height ?? MAX_EDGE;
  let base64 = asset.base64;

  const longEdge = Math.max(width, height);
  if (longEdge > MAX_EDGE && asset.uri) {
    try {
      const ImageManipulator = await import('expo-image-manipulator');
      const scale = MAX_EDGE / longEdge;
      const resized = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: Math.round(width * scale), height: Math.round(height * scale) } }],
        { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      uri = resized.uri;
      width = resized.width;
      height = resized.height;
      base64 = resized.base64 ?? base64;
    } catch {
      // keep picker output if manipulator unavailable
    }
  }

  if (!base64) {
    base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  }

  return {
    uri,
    width,
    height,
    base64,
    mimeType: asset.mimeType || 'image/jpeg',
  };
}

export function attachmentPromptBlock(attachment: HiveAttachment): string {
  return `\n\n[User attached a reference image: ${attachment.width}x${attachment.height} JPEG — match layout/colors/icons where sensible.]`;
}
