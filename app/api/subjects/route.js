import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDb from "@/db/connectDb";
import Subject from "@/models/subjects";
import User from "@/models/user";
import { sendNotification } from "@/lib/sendNotification";
export const POST = async (request) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const payload = await request.json();
        const subjectname = (payload.subjectname || payload.name || "").trim();
        const attended = Number(payload.attended) || 0;
        const total = Number(payload.total) || 0;
        const minRequired = Math.max(0, Math.min(100, Number(payload.minRequired) || 75));

        if (!subjectname) {
            return NextResponse.json({ success: false, error: "Subject name is required" }, { status: 400 });
        }

        if (attended > total) {
            return NextResponse.json({ success: false, error: "Attended classes cannot be more than total classes" }, { status: 400 });
        }

        await connectDb();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }
        const newSubject = await Subject.create({
            user: user._id,
            subjectname,
            attended,
            total,
            minRequired,
        });

        return NextResponse.json({ success: true, subject: newSubject });
    } catch (error) {
        console.error("Error creating subject:", error);
        return NextResponse.json({ success: false, error: "Failed to create subject" }, { status: 500 });
    }
};

export const GET = async (request) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectDb();
        const user = await User.findOne({
            email: session.user.email,
        });
        const subjects = await Subject.find({ user: user._id }).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, subjects });
    } catch (error) {
        console.error("Error fetching subjects:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch subjects" }, { status: 500 });
    }
};

export const PATCH = async (request) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id, type } = await request.json();
        if (!id || !["present", "absent"].includes(type)) {
            return NextResponse.json({ success: false, error: "Invalid update payload" }, { status: 400 });
        }

        await connectDb();
        const user = await User.findOne({ email: session.user.email });
        const subject = await Subject.findOne({ _id: id, user: user._id });
        if (!subject) {
            return NextResponse.json({ success: false, error: "Subject not found" }, { status: 404 });
        }

        subject.total += 1;
        if (type === "present") {
            subject.attended += 1;
        }
        if (subject.attended === 0 || subject.total < 5) {
            await subject.save();
            return NextResponse.json({
                success: true,
                subject,
            });
        }
        const nextAbsence =
            (subject.attended / (subject.total + 1)) * 100;
        if (user.notifications.enabled &&
            user.notifications.attendanceAlerts) {
            if (
                nextAbsence < subject.minRequired &&
                !subject.notification.warned
            ) {
                console.log("Entered notification block");
                try {
                    const user = await User.findOne({
                        email: session.user.email,
                    });

                    if (user) {
                        const sent = await sendNotification(
                            user._id,
                            "⚠️ Attendance Alert",
                            `Missing your next ${subject.subjectname} lecture will drop your attendance below your ${subject.minRequired}% target.`
                        );
                        console.log("Notification sent:", sent);

                        subject.notification.warned = true;
                    }
                } catch (err) {
                    console.error(
                        `Failed to send attendance notification for ${subject.subjectname}:`,
                        err
                    );
                }
            } else if (
                nextAbsence >= subject.minRequired &&
                subject.notification.warned
            ) {
                subject.notification.warned = false;
            }
        }
        await subject.save();

        return NextResponse.json({
            success: true,
            subject,
        });
    } catch (error) {
        console.error("Error updating subject attendance:", error);
        return NextResponse.json({ success: false, error: "Failed to update subject" }, { status: 500 });
    }
};

export const PUT = async (request) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id, subjectname, attended, total, minRequired } = await request.json();

        if (!id) {
            return NextResponse.json({ success: false, error: "Subject id is required" }, { status: 400 });
        }

        const normalizedName = String(subjectname || "").trim();
        const normalizedAttended = Number(attended) || 0;
        const normalizedTotal = Number(total) || 0;
        const normalizedMin = Math.max(0, Math.min(100, Number(minRequired) || 0));

        if (!normalizedName) {
            return NextResponse.json({ success: false, error: "Subject name is required" }, { status: 400 });
        }

        if (normalizedAttended > normalizedTotal) {
            return NextResponse.json({ success: false, error: "Attended classes cannot exceed total" }, { status: 400 });
        }

        await connectDb();
        const user = await User.findOne({ email: session.user.email });
        const updated = await Subject.findOneAndUpdate(
            { _id: id, user: user._id },
            {
                $set: {
                    subjectname: normalizedName,
                    attended: normalizedAttended,
                    total: normalizedTotal,
                    minRequired: normalizedMin,
                },
            },
            { returnDocument:"after" }
        );

        if (!updated) {
            return NextResponse.json({ success: false, error: "Subject not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, subject: updated });
    } catch (error) {
        console.error("Error editing subject:", error);
        return NextResponse.json({ success: false, error: "Failed to edit subject" }, { status: 500 });
    }
};

export const DELETE = async (request) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        // Get the ID from the URL query string: /api/subjects?id=123
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
        }

        await connectDb();

        // Security: Only delete if the ID matches AND it belongs to this user
        const user = await User.findOne({ email: session.user.email });
        const deletedSubject = await Subject.findOneAndDelete({
            _id: id,
            user: user._id
        });

        if (!deletedSubject) {
            return NextResponse.json({ success: false, error: "Subject not found or unauthorized" }, { status: 404 });
        }

        // Return a proper JSON object to avoid "Unexpected end of JSON input"
        return NextResponse.json({ success: true, message: "Subject deleted successfully" });

    } catch (error) {
        console.error("Error deleting subject:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
};