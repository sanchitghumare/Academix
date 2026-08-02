"use client";

import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase";
import { toast } from "react-toastify";
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
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
    return token;
  } catch (err) {
    console.error(err);
    return null;
  }
}