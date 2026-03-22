import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDb from "@/db/connectDb";
import Timetable from "@/models/timetable";

export const POST = async (request) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const payload = await request.json();
        const slots = Array.isArray(payload?.slots) ? payload.slots : [];
        const timetable = payload?.timetable;

        if (!timetable || typeof timetable !== "object") {
            return NextResponse.json({ success: false, error: "Invalid timetable data" }, { status: 400 });
        }

        if (!Array.isArray(slots) || slots.some((slot) => typeof slot !== "string" || !slot.trim())) {
            return NextResponse.json({ success: false, error: "Invalid slots data" }, { status: 400 });
        }

        await connectDb();

        const updated = await Timetable.findOneAndUpdate(
            { userEmail: session.user.email },
            {
                $set: {
                    userEmail: session.user.email,
                    schedule: {
                        slots,
                        timetable,
                    },
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return NextResponse.json({ success: true, timetable: updated });
    } catch (error) {
        console.error("Error saving timetable:", error);
        return NextResponse.json({ success: false, error: "Failed to save timetable" }, { status: 500 });
    }
};

export const GET = async (request) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        await connectDb();
        const timetable = await Timetable.findOne({ userEmail: session.user.email });
        if (!timetable) {
            return NextResponse.json({ success: true, timetable: null });
        }
        return NextResponse.json({ success: true, timetable });
    } catch (error) {
        console.error("Error fetching timetable:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch timetable" }, { status: 500 });
    }
};
