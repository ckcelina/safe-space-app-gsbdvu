
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

export interface ImageUploadResult {
  success: boolean;
  storagePath?: string;
  error?: string;
}

/**
 * Pick an image from the library and upload it to Supabase Storage
 * @param userId - The user's ID for organizing storage
 * @param personId - The person/conversation ID
 * @returns Promise with upload result
 */
export async function pickAndUploadImage(
  userId: string,
  personId: string
): Promise<ImageUploadResult> {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        error: 'Permission to access photos is required',
      };
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (result.canceled || !result.assets[0]) {
      return {
        success: false,
        error: 'Image selection cancelled',
      };
    }

    const imageUri = result.assets[0].uri;

    // Compress and resize image
    console.log('[imageUpload] Compressing image...');
    const manipResult = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1024 } }], // Resize to max width of 1024px
      { compress: 0.7, format: SaveFormat.JPEG }
    );

    // Convert to blob for upload
    const response = await fetch(manipResult.uri);
    const blob = await response.blob();

    // Generate unique filename
    const fileName = `${userId}/${personId}/${Date.now()}.jpg`;

    console.log('[imageUpload] Uploading to Supabase Storage...', { fileName });

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('[imageUpload] Upload error:', uploadError);
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`,
      };
    }

    console.log('[imageUpload] Upload successful', { path: uploadData.path });

    return {
      success: true,
      storagePath: uploadData.path,
    };
  } catch (error: any) {
    console.error('[imageUpload] Unexpected error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload image',
    };
  }
}

/**
 * Pick an image from camera and upload it to Supabase Storage
 * @param userId - The user's ID for organizing storage
 * @param personId - The person/conversation ID
 * @returns Promise with upload result
 */
export async function takePhotoAndUpload(
  userId: string,
  personId: string
): Promise<ImageUploadResult> {
  try {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        error: 'Permission to access camera is required',
      };
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return {
        success: false,
        error: 'Photo capture cancelled',
      };
    }

    const imageUri = result.assets[0].uri;

    // Compress and resize image
    console.log('[imageUpload] Compressing photo...');
    const manipResult = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1024 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );

    // Convert to blob for upload
    const response = await fetch(manipResult.uri);
    const blob = await response.blob();

    // Generate unique filename
    const fileName = `${userId}/${personId}/${Date.now()}.jpg`;

    console.log('[imageUpload] Uploading photo to Supabase Storage...', { fileName });

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('[imageUpload] Upload error:', uploadError);
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`,
      };
    }

    console.log('[imageUpload] Photo upload successful', { path: uploadData.path });

    return {
      success: true,
      storagePath: uploadData.path,
    };
  } catch (error: any) {
    console.error('[imageUpload] Unexpected error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload photo',
    };
  }
}
