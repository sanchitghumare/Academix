import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";
import Resources from "@/models/Resources";

export const GET = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const forceDownload = searchParams.get("download") === "1";

    if (forceDownload) {
      return NextResponse.json({ success: false, error: "Downloading is disabled" }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Resource id is required" }, { status: 400 });
    }

    await connectDb();
    const resource = await Resources.findById(id).lean();

    if (!resource) {
      return NextResponse.json({ success: false, error: "Resource not found" }, { status: 404 });
    }

    // PRIMARY: Cloudinary URL — redirect browser directly, never proxy
    if (resource.fileUrl) {
      return NextResponse.redirect(resource.fileUrl, 302);
    }

    // FALLBACK: base64 stored in MongoDB
    if (resource.fileData) {
      const fileBuffer = Buffer.from(resource.fileData, "base64");
      const fileType = String(resource.fileType || "application/octet-stream");
      const hasPdfSignature = fileBuffer.subarray(0, 5).toString("utf8") === "%PDF-";
      const ext = hasPdfSignature || fileType.includes("pdf") ? "pdf" : "bin";
      const fileNameBase = String(resource.fileName || resource.title || "resource")
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": hasPdfSignature ? "application/pdf" : fileType,
          "Content-Disposition": `inline; filename="${fileNameBase}.${ext}"`,
          "Cache-Control": "private, max-age=0, no-cache",
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Resource file is missing. Please re-upload." },
      { status: 404 }
    );

  } catch (error) {
    console.error("Error opening resource:", error);
    return NextResponse.json({ success: false, error: "Failed to open resource" }, { status: 500 });
  }
};