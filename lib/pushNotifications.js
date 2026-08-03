"use client";

import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase";
import { toast } from "react-toastify";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function registerFirebaseServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;

  const params = new URLSearchParams(firebaseConfig);
  return navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${params.toString()}`
  );
}



export async function registerForPushNotifications() {
  if (!("Notification" in window)) {
    console.log("Notifications are not supported.");
    return null;
  }

  let permission = await Notification.requestPermission();

  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    console.log("Permission denied.");
    toast.error(
      "Notifications are blocked. Please enable them in your browser settings."
    );
    return null;
  }

  const messaging = await getFirebaseMessaging();

  if (!messaging) {
    console.log("Messaging not supported.");
    return null;
  }

  try {
    const swRegistration = await registerFirebaseServiceWorker();

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swRegistration || undefined,
    });


    return token;
  } catch (err) {
    console.error(err);
    return null;
  }
}