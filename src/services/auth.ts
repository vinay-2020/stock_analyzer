import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '@/firebase-applet-config.json';

// Reuse existing Firebase app if already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}
// Request consent screen if needed to ensure refresh/offline access permissions
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in-memory and in persistent storage
let cachedAccessToken: string | null = null;
const TOKEN_STORAGE_KEY = 'drive_oauth_access_token';
const TOKEN_EXPIRY_KEY = 'drive_oauth_token_expires_at';

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = await getAccessToken();
      if (token) {
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Initiates Google OAuth via interactive popup on direct user click.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Sign-In');
    }

    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, credential.accessToken);
        // OAuth tokens typically expire in 3600 seconds
        localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 3500 * 1000));
      } catch (e) {
        console.warn('Could not persist OAuth token:', e);
      }
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Silently retrieves existing valid access token from memory or persistent storage.
 */
export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        const expiresAt = Number(localStorage.getItem(TOKEN_EXPIRY_KEY) || '0');
        if (!expiresAt || expiresAt > Date.now()) {
          cachedAccessToken = stored;
          return cachedAccessToken;
        }
      }
    } catch (e) {
      console.warn('Could not read stored OAuth token:', e);
    }
  }

  return null;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined' && token) {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 3500 * 1000));
    } catch (e) {
      console.warn('Could not store token:', e);
    }
  }
};

export const clearStoredToken = () => {
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
    } catch (e) {
      console.warn('Could not clear stored token:', e);
    }
  }
};

export const logout = async () => {
  await signOut(auth);
  clearStoredToken();
};
