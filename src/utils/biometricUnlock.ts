const FINGERPRINT_ENABLED_KEY = 'dizi_fingerprint_unlock_enabled';
const FINGERPRINT_CRED_KEY = 'dizi_fingerprint_cred_id';

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBuffer(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function isFingerprintUnlockEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(FINGERPRINT_ENABLED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setFingerprintUnlockEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(FINGERPRINT_ENABLED_KEY, enabled ? 'true' : 'false');
    if (!enabled) {
      localStorage.removeItem(FINGERPRINT_CRED_KEY);
    }
  } catch {}
}

export async function registerNativeFingerprint(
  userName: string,
  platformName = 'Dizi Urdu'
): Promise<{ ok: boolean; status: 'enrolled' | 'fallback_enabled' | 'cancelled'; message?: string }> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials?.create) {
    setFingerprintUnlockEnabled(true);
    return {
      ok: true,
      status: 'fallback_enabled',
      message: 'Fingerprint unlock enabled (will use device biometrics when supported).'
    };
  }

  try {
    const isAvailable =
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
        ? await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        : true;

    if (!isAvailable) {
      setFingerprintUnlockEnabled(true);
      return {
        ok: true,
        status: 'fallback_enabled',
        message: 'Fingerprint unlock preference saved for compatible mobile devices.'
      };
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const userId = new TextEncoder().encode((userName || 'profile').slice(0, 32));

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: platformName || 'Dizi Urdu'
        },
        user: {
          id: userId,
          name: userName || 'profile-user',
          displayName: userName || 'Profile'
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 }
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred'
        },
        timeout: 60000,
        attestation: 'none'
      }
    })) as PublicKeyCredential | null;

    if (credential && credential.rawId) {
      try {
        localStorage.setItem(FINGERPRINT_CRED_KEY, bufferToBase64Url(credential.rawId));
      } catch {}
    }

    setFingerprintUnlockEnabled(true);
    return {
      ok: true,
      status: 'enrolled',
      message: 'Device fingerprint unlock enabled.'
    };
  } catch (err: any) {
    const errName = err?.name || '';
    if (errName === 'NotAllowedError') {
      return {
        ok: false,
        status: 'cancelled',
        message: 'Fingerprint setup cancelled.'
      };
    }
    setFingerprintUnlockEnabled(true);
    return {
      ok: true,
      status: 'fallback_enabled',
      message: 'Fingerprint unlock enabled.'
    };
  }
}

export async function authenticateNativeFingerprint(): Promise<{
  ok: boolean;
  message?: string;
}> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials?.get) {
    return {
      ok: false,
      message: 'Biometric prompt is not supported in this browser. Enter PIN.'
    };
  }

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    let storedCredId = '';
    try {
      storedCredId = localStorage.getItem(FINGERPRINT_CRED_KEY) || '';
    } catch {}

    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge,
      userVerification: 'required',
      timeout: 60000
    };

    if (storedCredId) {
      publicKey.allowCredentials = [
        {
          id: base64UrlToBuffer(storedCredId).buffer as ArrayBuffer,
          type: 'public-key',
          transports: ['internal']
        }
      ];
    }

    const assertion = await navigator.credentials.get({ publicKey });
    if (assertion) {
      return { ok: true };
    }
    return { ok: false, message: 'Fingerprint not recognized. Try again.' };
  } catch (err: any) {
    const errName = err?.name || '';
    if (errName === 'NotAllowedError') {
      return { ok: false, message: 'Fingerprint cancelled. Tap icon or enter PIN.' };
    }
    if (errName === 'SecurityError' || errName === 'NotSupportedError' || errName === 'InvalidStateError') {
      return {
        ok: false,
        message: 'Native fingerprint unavailable here. Please enter your 4-digit PIN.'
      };
    }
    return { ok: false, message: 'Fingerprint verification failed. Enter PIN.' };
  }
}
