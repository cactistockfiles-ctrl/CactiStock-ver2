import "server-only";

import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;

export function getDb(): Firestore {
  if (!app && getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Firebase credentials are missing (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)");
    }

    app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  const db = getFirestore(app ?? getApps()[0]);
  try {
    // Ignore undefined properties to avoid Firestore errors when some
    // optional fields (e.g. widthCm) are undefined in documents we write.
    // This is safe on the server where we control the shape of data.
    // See: https://firebase.google.com/docs/firestore/manage-data/options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).settings?.({ ignoreUndefinedProperties: true });
  } catch (e) {
    // If setting fails, continue without throwing to avoid breaking startup
    // — the calling code will surface errors when attempting to write.
    // Log for visibility during development.
    // eslint-disable-next-line no-console
    console.error("Failed to apply Firestore settings:", e);
  }

  return db;
}
