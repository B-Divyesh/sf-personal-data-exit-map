import { getSetting, setSetting } from './db';
import type { SignedManifest } from './types';

interface StoredKeys { privateKey: JsonWebKey; publicKey: JsonWebKey }

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): ArrayBuffer {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0)).buffer as ArrayBuffer;
}

function unsigned(manifest: SignedManifest): SignedManifest {
  const clean = structuredClone(manifest);
  delete clean.signature;
  return clean;
}

function payload(manifest: SignedManifest): ArrayBuffer {
  return new TextEncoder().encode(JSON.stringify(unsigned(manifest))).buffer as ArrayBuffer;
}

async function keys(): Promise<{ privateKey: CryptoKey; publicKey: CryptoKey; publicJwk: JsonWebKey }> {
  const stored = await getSetting<StoredKeys>('signing-key-v1');
  if (stored) {
    try {
      const privateKey = await crypto.subtle.importKey('jwk', stored.privateKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
      const publicKey = await crypto.subtle.importKey('jwk', stored.publicKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
      return { privateKey, publicKey, publicJwk: stored.publicKey };
    } catch {
      // A browser may invalidate stored key material. A fresh local identity is safer than failing analysis.
    }
  }
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const privateKey = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const publicKey = await crypto.subtle.exportKey('jwk', pair.publicKey);
  await setSetting('signing-key-v1', { privateKey, publicKey } satisfies StoredKeys);
  return { privateKey: pair.privateKey, publicKey: pair.publicKey, publicJwk: publicKey };
}

export async function signManifest(manifest: SignedManifest): Promise<SignedManifest> {
  const pair = await keys();
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pair.privateKey, payload(manifest));
  return {
    ...unsigned(manifest),
    signature: { algorithm: 'ECDSA-P256-SHA256', value: bytesToBase64(new Uint8Array(signature)), publicKeyJwk: pair.publicJwk }
  };
}

export async function verifyManifest(manifest: SignedManifest): Promise<boolean> {
  if (!manifest.signature || manifest.signature.algorithm !== 'ECDSA-P256-SHA256') return false;
  try {
    const publicKey = await crypto.subtle.importKey('jwk', manifest.signature.publicKeyJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, base64ToBytes(manifest.signature.value), payload(manifest));
  } catch {
    return false;
  }
}
