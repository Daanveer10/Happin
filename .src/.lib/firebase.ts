import admin from "firebase-admin";

function parseServiceAccount(raw: string) {
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is empty");
  try {
    return JSON.parse(raw); 
  } catch (e) {
    try {
      const decoded = Buffer.from(raw, "base64").toString("utf8");
      return JSON.parse(decoded);
    } catch (err) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT must be JSON or base64(JSON)");
    }
  }
}

export function getFirestore() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn("FIREBASE_SERVICE_ACCOUNT not set. Firestore will be disabled.");
    return null;
  }

  if (!admin.apps.length) {
    const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
    });
  }
  return admin.firestore();
}
