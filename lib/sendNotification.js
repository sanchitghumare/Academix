import User from "@/models/user";
import { adminMessaging } from "@/lib/firebase-admin";

export async function sendNotification(userId, title, body) {
    console.log("sendNotification called");
    const user = await User.findById(userId);
    console.log("User found:", !!user);
    if (!user) return false;

    const fcmToken = user.notifications?.fcmToken;
    console.log("Token exists:", !!fcmToken?.token);
    if (!fcmToken?.token) return false;

    try {
        await adminMessaging.send({
            token: fcmToken.token,
            notification: {
                title,
                body,
            },
            webpush: {notification: { icon: "/favicon.io.png" }},
        });
        user.notifications.fcmToken.lastUsed = new Date();
        await user.save();

        return true;
    } catch (err) {
        console.error("Failed to send notification:", err);

        // Token is no longer valid
        if (
            err.code === "messaging/registration-token-not-registered" ||
            err.code === "messaging/invalid-registration-token"
        ) {
            user.notifications.fcmToken = undefined;
            await user.save();
        }

        return false;
    }
}