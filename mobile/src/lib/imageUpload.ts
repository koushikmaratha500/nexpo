import * as ImagePicker from 'expo-image-picker';
import { API_ROUTES, apiUpload, getApiErrorMessage } from '@nexpo/shared';

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

function normalizeMimeType(mimeType: string | null | undefined, fileName: string | null | undefined): string {
  const mime = mimeType?.toLowerCase() ?? '';
  if (ALLOWED_IMAGE_MIME.has(mime)) {
    return mime;
  }

  const lowerName = fileName?.toLowerCase() ?? '';
  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function normalizeFileName(fileName: string | null | undefined, mimeType: string): string {
  const base = fileName?.trim() || 'upload.jpg';
  if (mimeType === 'image/png' && !base.toLowerCase().endsWith('.png')) return 'upload.png';
  if (mimeType === 'image/webp' && !base.toLowerCase().endsWith('.webp')) return 'upload.webp';
  if (mimeType === 'image/jpeg' && !/\.(jpe?g)$/i.test(base)) return 'upload.jpg';
  return base;
}

export async function ensureMediaLibraryPermission(): Promise<boolean> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return requested.granted;
}

export async function pickImageFromLibrary(): Promise<ImagePicker.ImagePickerAsset | null> {
  const granted = await ensureMediaLibraryPermission();
  if (!granted) {
    throw new Error('Photo library permission is required to upload an image.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode?.Compatible ?? 'compatible',
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return result.assets[0];
}

export async function uploadPickedImage(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  const rawMime = asset.mimeType?.toLowerCase() ?? '';
  if (rawMime.includes('heic') || rawMime.includes('heif')) {
    throw new Error('This photo format is not supported. Choose a JPG or PNG image.');
  }

  const mimeType = normalizeMimeType(asset.mimeType, asset.fileName);

  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: normalizeFileName(asset.fileName, mimeType),
    type: mimeType,
  } as unknown as Blob);

  const res = await apiUpload<{ url: string }>('POST', API_ROUTES.upload, formData);
  if (!res.url) {
    throw new Error('Upload succeeded but no image URL was returned.');
  }
  return res.url;
}

export async function pickAndUploadImage(): Promise<string | null> {
  const asset = await pickImageFromLibrary();
  if (!asset) {
    return null;
  }

  try {
    return await uploadPickedImage(asset);
  } catch (err) {
    throw new Error(getApiErrorMessage(err, 'Failed to upload image'));
  }
}
