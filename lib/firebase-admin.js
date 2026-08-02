import { getApps, cert, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseAdminConfig)
    : getApps()[0];

export const adminMessaging = getMessaging(app);