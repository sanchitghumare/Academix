import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDb from "@/db/connectDb";
import Resources from "@/models/Resources";

export const GET = async (request) => {
    try {
        const session = await getServerSession(authOptions);        
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized access attempt denied.", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return new NextResponse("Missing document ID parameter.", { status: 400 });
        }

        await connectDb();

        const resource = await Resources.findById(id);

        if (!resource || !resource.fileData) {
            return new NextResponse("PDF content data matrix not found inside cloud database.", { status: 404 });
        }

        const base64Data = resource.fileData.replace(/^data:application\/pdf;base64,/, "");

        const pdfBuffer = Buffer.from(base64Data, "base64");

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${resource.fileName || "document.pdf"}"`,
                "Cache-Control": "no-store, max-age=0, must-revalidate",
            },
        });

    } catch (error) {
        console.error("[resources.open] streaming error loop caught:", error);
        return new NextResponse("Internal compilation stream server breakdown.", { status: 500 });
    }
};