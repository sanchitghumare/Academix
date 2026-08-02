import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import connectDb from "@/db/connectDb";
import User from "@/models/user";

export async function PATCH(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const {
            enabled,
            attendanceAlerts,
            dailySummary,
            dailySummaryTime,
        } = await request.json();

        await connectDb();

        const user = await User.findOne({
            email: session.user.email,
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        user.notifications.enabled = enabled;
        user.notifications.attendanceAlerts = attendanceAlerts;
        user.notifications.dailySummary = dailySummary;
        user.notifications.dailySummaryTime = dailySummaryTime;

        await user.save();

        return NextResponse.json({
            success: true,
            notifications: user.notifications,
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