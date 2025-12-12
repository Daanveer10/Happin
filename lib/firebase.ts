import admin from "firebase-admin";

let firestore: admin.firestore.Firestore | null = null;

function initApp() {
  if (admin.apps.length) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return;

  try {
    const credentials = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(credentials)
    });
  } catch (err) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT", err);
  }
}

export function getFirestore() {
  if (firestore) return firestore;

  initApp();
  if (!admin.apps.length) return null;

  firestore = admin.firestore();
  return firestore;
}

