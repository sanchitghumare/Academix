import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDb from "@/db/connectDb";
import Grade from "@/models/grade";

const MAX_ENDSEM = 60;
const MAX_MIDSEM = 20;
const MAX_CA = 20;

const getAutoGrade = (endSem, midSem, ca) => {
    const totalMarks =
        Math.max(0, Number(endSem) || 0) +
        Math.max(0, Number(midSem) || 0) +
        Math.max(0, Number(ca) || 0);
    const maxMarks = MAX_ENDSEM + MAX_MIDSEM + MAX_CA;
    const percentage = maxMarks === 0 ? 0 : (totalMarks / maxMarks) * 100;

    if (percentage >= 80) return { gradeLabel: "O", gradePoint: 10, percentage, totalMarks };
    if (percentage >= 75) return { gradeLabel: "A", gradePoint: 9, percentage, totalMarks };
    if (percentage >= 70) return { gradeLabel: "B", gradePoint: 8, percentage, totalMarks };
    if (percentage >= 60) return { gradeLabel: "C", gradePoint: 7, percentage, totalMarks };
    if (percentage >= 50) return { gradeLabel: "D", gradePoint: 6, percentage, totalMarks };
    if (percentage >= 40) return { gradeLabel: "E", gradePoint: 5, percentage, totalMarks };
    return { gradeLabel: "F", gradePoint: 0, percentage, totalMarks };
};

export const POST = async (request) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const payload = await request.json();
        const subjectname = (payload.subjectname || payload.name || "").trim();
        const credits = Number(payload.credits) || 0;
        const endSem = Number(payload.endSem) || 0;
        const midSem = Number(payload.midSem) || 0;
        const ca = Number(payload.ca) || 0;
        const semester = Number(payload.semester) || 1;
        const { gradeLabel, gradePoint, percentage, totalMarks } = getAutoGrade(endSem, midSem, ca);

        if (!subjectname) {
            return NextResponse.json({ success: false, error: "Subject name is required" }, { status: 400 });
        }
        if (endSem < 0 || endSem > MAX_ENDSEM) {
            return NextResponse.json({ success: false, error: "Endsem must be between 0 and 60" }, { status: 400 });
        }
        if (midSem < 0 || midSem > MAX_MIDSEM) {
            return NextResponse.json({ success: false, error: "Midsem must be between 0 and 20" }, { status: 400 });
        }
        if (ca < 0 || ca > MAX_CA) {
            return NextResponse.json({ success: false, error: "CA must be between 0 and 20" }, { status: 400 });
        }

        await connectDb();
        const newGrade = await Grade.findOneAndUpdate(
            { userEmail: session.user.email, subjectname },
            {
                $set: {
                    userEmail: session.user.email,
                    subjectname,
                    semester,
                    credits,
                    endSemMarks: endSem,
                    midSemMarks: midSem,
                    caMarks: ca,
                    totalMarks,
                    grade: gradePoint,
                    gradePoint,
                    gradeLabel,
                    percentage,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true, strict: false }
        );

        return NextResponse.json({ success: true, grade: newGrade });
    } catch (error) {
        console.error("Error creating grade:", error);
        return NextResponse.json({ success: false, error: "Failed to create grade" }, { status: 500 });
    }
};
export const GET = async (request) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectDb();
        const grades = await Grade.find({ userEmail: session.user.email }).sort({ semester: -1, createdAt: -1 });
        return NextResponse.json({ success: true, grades });
    } catch (error) {
        console.error("Error fetching grades:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch grades" }, { status: 500 });
    }
};

export const DELETE = async (request) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, error: "Grade id is required" }, { status: 400 });
        }

        await connectDb();
        const deleted = await Grade.findOneAndDelete({ _id: id, userEmail: session.user.email });

        if (!deleted) {
            return NextResponse.json({ success: false, error: "Grade not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Grade deleted" });
    } catch (error) {
        console.error("Error deleting grade:", error);
        return NextResponse.json({ success: false, error: "Failed to delete grade" }, { status: 500 });
    }
};