import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";

import User from "@/models/user";

import { buildDailySummary } from "@/lib/buildDailySummary";
import { sendNotification } from "@/lib/sendNotification";

export async function GET(request) {
    const authHeader = request.headers.get("Authorization");

    if (
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return NextResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );
    }
    try {
        await connectDb();

        const now = new Date();

        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const users = await User.find({
            "notifications.enabled": true,
            "notifications.dailySummary": true,
        });
        let sent = 0;
        const today = new Date().toDateString();

        for (const user of users) {
            if (
                user.notifications.lastDailySummary &&
                new Date(user.notifications.lastDailySummary).toDateString() === today ||
                !user.notifications.dailySummary || !user.notifications.enabled || user.notifications.dailySummaryTime !== process.env.CRON_TIME
            ) {
                continue;
            }

            const time =
                user.notifications.dailySummaryTime || "08:00";

            const [hour, minute] = time
                .split(":")
                .map(Number);

            // allow a 5 minute window
            if (
                currentHour !== hour ||
                Math.abs(currentMinute - minute) > 5
            ) {
                continue;
            }

            const summary = await buildDailySummary(user._id);

            if (!summary) continue;

            const ok = await sendNotification(
                user._id,
                "📚 Academix Daily Summary",
                summary
            );

            if (ok) {
                user.notifications.lastDailySummary = new Date();
                await user.save();
                sent++;
            }
        }

        return NextResponse.json({
            success: true,
            notificationsSent: sent,
        });
    } catch (err) {
        console.error(err);

        return NextResponse.json(
            {
                success: false,
                error: err.message,
            },
            { status: 500 }
        );
    }
}