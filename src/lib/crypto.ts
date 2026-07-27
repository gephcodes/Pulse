// Client-Side AES-256-GCM Encryption Utility for Encrypted Chat Storage & Payload Handling

const MASTER_KEY_STORAGE_KEY = 'echo_persona_aes_master_key_v1';

// Get or derive session AES-256 key
async function getOrCreateAESKey(): Promise<CryptoKey> {
  const existingKeyB64 = localStorage.getItem(MASTER_KEY_STORAGE_KEY);
  
  if (existingKeyB64) {
    try {
      const rawKey = Uint8Array.from(atob(existingKeyB64), (c) => c.charCodeAt(0));
      return await crypto.subtle.importKey(
        'raw',
        rawKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (e) {
      console.warn('Failed to parse existing key, generating new key:', e);
    }
  }

  // Generate new 256-bit AES-GCM key
  const newKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const exported = await crypto.subtle.exportKey('raw', newKey);
  const exportedB64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  localStorage.setItem(MASTER_KEY_STORAGE_KEY, exportedB64);

  return newKey;
}

/**
 * Encrypt plain text using AES-256-GCM
 * Returns a formatted string: "enc:v1:<iv_base64>:<ciphertext_base64>"
 */
export async function encryptMessageText(plainText: string): Promise<string> {
  try {
    const key = await getOrCreateAESKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plainText);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    const ivB64 = btoa(String.fromCharCode(...iv));
    const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)));

    return `enc:v1:${ivB64}:${cipherB64}`;
  } catch (err) {
    console.error('AES-256 Encryption failed:', err);
    throw new Error('Failed to encrypt message text');
  }
}

/**
 * Decrypt AES-256-GCM formatted ciphertext string
 */
export async function decryptMessageText(encryptedString: string): Promise<string> {
  if (!encryptedString || !encryptedString.startsWith('enc:v1:')) {
    // If not encrypted or raw text fallback
    return encryptedString;
  }

  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 4) return encryptedString;

    const ivB64 = parts[2];
    const cipherB64 = parts[3];

    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
    const cipherBuffer = Uint8Array.from(atob(cipherB64), (c) => c.charCodeAt(0));

    const key = await getOrCreateAESKey();

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.error('AES-256 Decryption failed:', err);
    return '[Decryption Error: Invalid Key or Tampered Payload]';
  }
}

/**
 * Get fingerprint hash of the current local key for UI display
 */
export async function getKeyFingerprint(): Promise<string> {
  const existingKeyB64 = localStorage.getItem(MASTER_KEY_STORAGE_KEY);
  if (!existingKeyB64) return 'AES256-SESSION-KEY-INITIALIZING';
  
  const encoder = new TextEncoder();
  const data = encoder.encode(existingKeyB64);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `AES-256-GCM :: ${hex.substring(0, 8).toUpperCase()}-${hex.substring(8, 16).toUpperCase()}`;
}
