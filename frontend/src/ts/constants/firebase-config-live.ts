// Stub for personal/self-host builds.
// The production Monkeytype setup likely injects real Firebase config.
// Export a safe "disabled" config so the frontend can build without secrets.

export const FIREBASE_CONFIG = null as const;

// If the code expects named exports, add them too:
export const firebaseConfig = null as const;
export const firebaseEnabled = false as const;
