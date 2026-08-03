import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";

import User from "@/models/user";

import { buildDailySummary } from "@/lib/buildDailySummary";
import { sendNotification } from "@/lib/sendNotification";

function getIstHourMinute(date) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(date);

    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    return { hour, minute };
}

export async function GET(request) {
    const authHeader = request.headers.get("Authorization");

    if (
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        console.warn("[daily-summary] Rejected request: missing/invalid CRON_SECRET");
        return NextResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    console.log("[daily-summary] Cron execution started at", new Date().toISOString());

    try {
        await connectDb();

        const now = new Date();
        const { hour: currentHour, minute: currentMinute } = getIstHourMinute(now);
        console.log(`[daily-summary] Current IST time: ${currentHour}:${String(currentMinute).padStart(2, "0")}`);

        const users = await User.find({
            "notifications.enabled": true,
            "notifications.dailySummary": true,
        });
        console.log(`[daily-summary] Found ${users.length} user(s) eligible for daily summary`);

        let sent = 0;
        // Use IST calendar date, not server-local (UTC) date, to decide
        // whether "today's" summary has already been sent.
        const todayIst = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
        }).format(now); // YYYY-MM-DD

        for (const user of users) {
            const alreadySentToday =
                user.notifications.lastDailySummary &&
                new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
                    new Date(user.notifications.lastDailySummary)
                ) === todayIst;

            if (alreadySentToday) {
                console.log(`[daily-summary] Skipping user ${user._id}: already sent today`);
                continue;
            }

            const time = user.notifications.dailySummaryTime || "08:00";
            const [hour, minute] = time.split(":").map(Number);

            // allow a 1 minute window
            if (
                currentHour !== hour ||
                Math.abs(currentMinute - minute) > 1
            ) {
                console.log(
                    `[daily-summary] Skipping user ${user._id}: configured time ${time} not within window of current IST time ${currentHour}:${String(currentMinute).padStart(2, "0")}`
                );
                continue;
            }

            const summary = await buildDailySummary(user._id);

            if (!summary) {
                console.log(`[daily-summary] Skipping user ${user._id}: buildDailySummary returned nothing`);
                continue;
            }

            console.log(`[daily-summary] Sending daily summary to user ${user._id}`);
            const ok = await sendNotification(
                user._id,
                "📚 Academix Daily Summary",
                summary
            );

            if (ok) {
                user.notifications.lastDailySummary = new Date();
                await user.save();
                sent++;
                console.log(`[daily-summary] Sent successfully to user ${user._id}`);
            } else {
                console.warn(`[daily-summary] sendNotification failed for user ${user._id}`);
            }
        }

        console.log(`[daily-summary] Cron execution finished. Notifications sent: ${sent}`);

        return NextResponse.json({
            success: true,
            notificationsSent: sent,
        });
    } catch (err) {
        console.error("[daily-summary] Cron execution failed:", err);

        return NextResponse.json(
            {
                success: false,
                error: err.message,
            },
            { status: 500 }
        );
    }
}