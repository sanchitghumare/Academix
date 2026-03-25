import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDb from "@/db/connectDb";
import Resources from "@/models/Resources";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
export const POST = async (request) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        await connectDb();
        const data = await request.formData();
        const file = data.get("file");
        const title = data.get("title");
        const subject = data.get("subject");
        const category = data.get("category") || "Notes";
        const fileType = String(file?.type || "");
        const fileName = String(file?.name || "");
        const fileSize = Number(file?.size || 0);

        if (!file || !title || !subject) {
            return NextResponse.json({ success: false, error: "title, subject and file are required" }, { status: 400 });
        }

        if (typeof file.arrayBuffer !== "function" || fileSize <= 0) {
            return NextResponse.json({ success: false, error: "Invalid file payload. Please reselect the file and upload again." }, { status: 400 });
        }

        if (fileSize > 8 * 1024 * 1024) {
            return NextResponse.json({ success: false, error: "File too large. Please upload files up to 8MB." }, { status: 400 });
        }

        console.log("[resources.upload] received file", { fileName, fileType, fileSize });

        // 1. Convert file to Buffer for Cloudinary
        const byteData = await file.arrayBuffer();
        const buffer = Buffer.from(new Uint8Array(byteData));
        const base64Data = buffer.toString("base64");

        const originalName = fileName || "resource";
        const originalExt = originalName.includes(".")
            ? originalName.split(".").pop().toLowerCase()
            : "bin";
        const publicIdBase = originalName
            .replace(/\.[^.]+$/, "")
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .slice(0, 80) || "resource";

        // 2. Upload to Cloudinary (best-effort). Opening in app does not depend on this.
        let uploadedUrl = "";
        try {
            const uploadResponse = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({
                    resource_type: "raw",
                    folder: "stratos_resources",
                    use_filename: true,
                    unique_filename: true,
                    public_id: `${Date.now()}_${publicIdBase}.${originalExt}`,
                    filename_override: originalName,
                    access_mode: "public",
                }, (error, result) => {
                    if (error) reject(error);
                    resolve(result);
                }).end(buffer);
            });
            uploadedUrl = uploadResponse?.secure_url || "";
        } catch (uploadErr) {
            console.warn("[resources.upload] cloudinary upload failed, using Mongo file storage only", uploadErr?.message || uploadErr);
        }

        // 3. Save the URL to MongoDB
        const newResource = await Resources.create({
            title,
            subject,
            category,
            fileUrl: uploadedUrl,
            fileName: originalName,
            fileSize,
            fileData: base64Data,
            fileType,
            uploadedBy: session.user.email,
        });

        return NextResponse.json({ success: true, resource: newResource });
    }
    catch (error) {
        console.error("Error creating resource:", error);
        return NextResponse.json({ success: false, error: "Failed to create resource" }, { status: 500 });
    }
};

export const GET = async (request) => {
    try {
        const session = await getServerSession(authOptions);        
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        await connectDb();
        const resources = await Resources.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, resources });
    } catch (error) {
        console.error("Error fetching resources:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch resources" }, { status: 500 });
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
            return NextResponse.json({ success: false, error: "Resource id is required" }, { status: 400 });
        }
        await connectDb();
        const deleted = await Resources.findOneAndDelete({ _id: id });
        if (!deleted) {
            return NextResponse.json({ success: false, error: "Resource not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: "Resource deleted" });
    } catch (error) {
        console.error("Error deleting resource:", error);
        return NextResponse.json({ success: false, error: "Failed to delete resource" }, { status: 500 });
    }
};