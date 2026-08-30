// ============================================================================
// Cifrado en reposo (opcional) — AES-GCM con llave derivada del PIN (PBKDF2).
// El PIN NUNCA se guarda; solo se guarda el sobre cifrado {salt, iv, data}.
// Sin el PIN correcto, descifrar falla: los datos en disco son ilegibles.
// ============================================================================

const enc = new TextEncoder();
const dec = new TextDecoder();
const PBKDF2_ITERATIONS = 210_000; // recomendación OWASP para PBKDF2-SHA256

export interface Envelope {
  v: 1;
  salt: string; // base64
  iv: string; // base64
  data: string; // base64 (ciphertext + tag)
}

function toB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function fromB64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// Las definiciones DOM recientes exigen BufferSource respaldado por ArrayBuffer.
const buf = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', buf(enc.encode(pin)), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: buf(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Cifra un objeto arbitrario y devuelve el sobre serializable. */
export async function encryptJSON(plain: unknown, pin: string): Promise<Envelope> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: buf(iv) },
    key,
    buf(enc.encode(JSON.stringify(plain))),
  );
  return { v: 1, salt: toB64(salt.buffer), iv: toB64(iv.buffer), data: toB64(cipher) };
}

/** Descifra un sobre. Lanza si el PIN es incorrecto o el sobre está corrupto. */
export async function decryptJSON<T = unknown>(env: Envelope, pin: string): Promise<T> {
  const key = await deriveKey(pin, fromB64(env.salt));
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: buf(fromB64(env.iv)) },
    key,
    buf(fromB64(env.data)),
  );
  return JSON.parse(dec.decode(plain)) as T;
}

/** Verifica un PIN intentando descifrar; true si funciona. */
export async function verifyPin(env: Envelope, pin: string): Promise<boolean> {
  try {
    await decryptJSON(env, pin);
    return true;
  } catch {
    return false;
  }
}

/** Hash simple del PIN (SHA-256) para el modo "solo entrar" (no cifra datos). */
export async function hashPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
  return toB64(buf);
}
