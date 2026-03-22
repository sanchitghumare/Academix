import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDb from "@/db/connectDb";
import Subject from "@/models/subjects";

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
        const newSubject = await Subject.create({
            subjectname,
            attended,
            total,
            minRequired,
            userEmail: session.user.email,
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
        const subjects = await Subject.find({ userEmail: session.user.email }).sort({ createdAt: -1 });
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
        const subject = await Subject.findOne({ _id: id, userEmail: session.user.email });
        if (!subject) {
            return NextResponse.json({ success: false, error: "Subject not found" }, { status: 404 });
        }

        subject.total += 1;
        if (type === "present") {
            subject.attended += 1;
        }
       
        await subject.save();
        return NextResponse.json({ success: true, subject });
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
        const updated = await Subject.findOneAndUpdate(
            { _id: id, userEmail: session.user.email },
            {
                $set: {
                    subjectname: normalizedName,
                    attended: normalizedAttended,
                    total: normalizedTotal,
                    minRequired: normalizedMin,
                },
            },
            { new: true }
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
        const deletedSubject = await Subject.findOneAndDelete({ 
            _id: id, 
            userEmail: session.user.email 
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