import admin from "firebase-admin";

let firestore: admin.firestore.Firestore | null = null;
let initError: string | null = null;

function initApp() {
  if (admin.apps.length) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    initError = "FIREBASE_SERVICE_ACCOUNT environment variable is not set";
    console.error(initError);
    return;
  }

  try {
    // Handle both string and already-parsed JSON
    let credentials;
    if (typeof raw === "string") {
      credentials = JSON.parse(raw);
    } else {
      credentials = raw;
    }

    admin.initializeApp({
      credential: admin.credential.cert(credentials as admin.ServiceAccount)
    });

    admin.firestore().settings({ignoreUndefinedProperties: true});
    
    console.log("Firebase Admin initialized successfully");
    initError = null;
  } catch (err: any) {
    initError = `Failed to initialize Firebase: ${err?.message || String(err)}`;
    console.error(initError);
    console.error("FIREBASE_SERVICE_ACCOUNT length:", raw?.length || 0);
    console.error("FIREBASE_SERVICE_ACCOUNT starts with:", raw?.substring(0, 50) || "empty");
  }
}

export function getFirestore() {
  if (firestore) return firestore;

  initApp();
  if (!admin.apps.length) {
    console.error("Firebase Admin not initialized:", initError);
    return null;
  }

  firestore = admin.firestore();
  return firestore;
}

export function getInitError(): string | null {
  return initError;
}

