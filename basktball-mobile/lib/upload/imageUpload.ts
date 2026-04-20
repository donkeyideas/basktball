import * as SecureStore from 'expo-secure-store';

const API_BASE = 'https://www.basktball.com';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface UploadResult {
  publicUrl: string;
}

/**
 * Upload an image to R2 via presigned URL.
 * Uses XMLHttpRequest for reliable React Native file uploads
 * (fetch + blob can fail silently on some RN versions).
 */
export async function uploadImage(
  uri: string,
  mimeType: string,
  fileSize: number
): Promise<UploadResult> {
  // Validate
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw new Error('Invalid format. Only JPEG, PNG, WebP, and GIF are allowed.');
  }
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error('Image must be under 10 MB.');
  }

  // Get auth token
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) {
    throw new Error('Please sign in again.');
  }

  // Step 1: Get presigned URL
  const presignRes = await fetch(`${API_BASE}/api/mobile/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentType: mimeType, fileSize }),
  });

  if (!presignRes.ok) {
    const data = await presignRes.json().catch(() => ({}));
    throw new Error(data.error || `Upload failed (${presignRes.status})`);
  }

  const { uploadUrl, publicUrl } = await presignRes.json();

  // Step 2: Upload file via XMLHttpRequest (native RN file handling)
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `photo.${ext}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', mimeType);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload to storage failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Upload network error'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));

    // React Native XHR natively handles file:// URIs when passed as an object
    xhr.send({ uri, type: mimeType, name: fileName } as any);
  });

  return { publicUrl };
}
