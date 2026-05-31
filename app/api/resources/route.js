// import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// import connectDb from "@/db/connectDb";
// import Resources from "@/models/Resources";
// import { v2 as cloudinary } from "cloudinary";
// import { createRequire } from "node:module";
// import { resolve } from "node:path";
// import { pathToFileURL } from "node:url";
// import { embedText } from "./embedding";

// export const runtime = "nodejs";
// export const maxDuration = 60;

// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
//     secure: true,
// });

// let pdfParseModulePromise;
// const require = createRequire(import.meta.url);

// function ensurePdfDomPolyfills() {
//     if (typeof globalThis.DOMMatrix === "undefined") {
//         globalThis.DOMMatrix = class DOMMatrix {
//             constructor(values = [1, 0, 0, 1, 0, 0]) {
//                 const matrixValues = Array.isArray(values) ? values : [1, 0, 0, 1, 0, 0];
//                 [this.a, this.b, this.c, this.d, this.e, this.f] = matrixValues;
//             }

//             translate(x = 0, y = 0) {
//                 this.e += x;
//                 this.f += y;
//                 return this;
//             }

//             scale(scaleX = 1, scaleY = scaleX) {
//                 this.a *= scaleX;
//                 this.d *= scaleY;
//                 return this;
//             }

//             preMultiplySelf() {
//                 return this;
//             }

//             invertSelf() {
//                 return this;
//             }

//             multiplySelf() {
//                 return this;
//             }
//         };
//     }

//     if (typeof globalThis.ImageData === "undefined") {
//         globalThis.ImageData = class ImageData {
//             constructor(data = new Uint8ClampedArray(), width = 0, height = 0) {
//                 this.data = data;
//                 this.width = width;
//                 this.height = height;
//             }
//         };
//     }

//     if (typeof globalThis.Path2D === "undefined") {
//         globalThis.Path2D = class Path2D {
//             addPath() {}
//             rect() {}
//             closePath() {}
//         };
//     }

//     if (typeof globalThis.navigator === "undefined") {
//         globalThis.navigator = { language: "en-US", platform: "", userAgent: "" };
//     }
// }

// async function getPdfParseModule() {
//     if (!pdfParseModulePromise) {
//         pdfParseModulePromise = Promise.resolve().then(() => {
//             ensurePdfDomPolyfills();
//             const { PDFParse } = require("pdf-parse");
//             PDFParse.setWorker(
//                 pathToFileURL(resolve(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")).href,
//             );
//             return { PDFParse };
//         });
//     }
//     return pdfParseModulePromise;
// }

// function chunkText(text, size = 800, overlap = 150) {
//     const words = text.split(/\s+/);
//     const chunks = [];
//     for (let i = 0; i < words.length; i += (size - overlap)) {
//         const chunk = words.slice(i, i + size).join(" ");
//         if (chunk.trim()) chunks.push(chunk);
//         if (i + size >= words.length) break;
//     }
//     return chunks;
// }

// export const POST = async (request) => {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session?.user?.email) {
//             return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//         }
//         await connectDb();
//         const data = await request.formData();
//         const file = data.get("file");
//         const title = data.get("title");
//         const subject = data.get("subject");
//         const category = data.get("category") || "Notes";
//         const fileType = String(file?.type || "");
//         const fileName = String(file?.name || "");
//         const fileSize = Number(file?.size || 0);

//         if (!file || !title || !subject) {
//             return NextResponse.json({ success: false, error: "title, subject and file are required" }, { status: 400 });
//         }

//         if (typeof file.arrayBuffer !== "function" || fileSize <= 0) {
//             return NextResponse.json({ success: false, error: "Invalid file payload. Please reselect the file and upload again." }, { status: 400 });
//         }

//         if (fileSize > 8 * 1024 * 1024) {
//             return NextResponse.json({ success: false, error: "File too large. Please upload files up to 8MB." }, { status: 400 });
//         }

//         console.log("[resources.upload] received file", { fileName, fileType, fileSize });

//         const byteData = await file.arrayBuffer();
//         const buffer = Buffer.from(new Uint8Array(byteData));
//         const base64Data = buffer.toString("base64");

//         let extractedText = "";
//         if (fileName.endsWith(".pdf") || fileType === "application/pdf") {
//             const { PDFParse } = await getPdfParseModule();
//             const pdfParser = new PDFParse({ data: buffer });
//             try {
//                 const parsedPdf = await pdfParser.getText();
//                 extractedText = parsedPdf.text;
//             } finally {
//                 await pdfParser.destroy();
//             }
//         } else {
//             extractedText = buffer.toString("utf-8");
//         }

//         if (!extractedText.trim()) {
//             return NextResponse.json({ success: false, error: "Document body appears empty or unreadable" }, { status: 400 });
//         }

//         const textChunks = chunkText(extractedText);
//         const primeTextChunk = textChunks.slice(0, 3).join("\n\n");
//         const docEmbedding = embedText(primeTextChunk);

//         const originalName = fileName || "resource";
//         const originalExt = originalName.includes(".")
//             ? originalName.split(".").pop().toLowerCase()
//             : "bin";
//         const publicIdBase = originalName
//             .replace(/\.[^.]+$/, "")
//             .replace(/[^a-zA-Z0-9_-]/g, "_")
//             .slice(0, 80) || "resource";

//         let uploadedUrl = "";
//         try {
//             const uploadResponse = await new Promise((resolve, reject) => {
//                 cloudinary.uploader.upload_stream({
//                     resource_type: "raw",
//                     folder: "stratos_resources",
//                     use_filename: true,
//                     unique_filename: true,
//                     public_id: `${Date.now()}_${publicIdBase}.${originalExt}`,
//                     filename_override: originalName,
//                     access_mode: "public",
//                 }, (error, result) => {
//                     if (error) reject(error);
//                     resolve(result);
//                 }).end(buffer);
//             });
//             uploadedUrl = uploadResponse?.secure_url || "";
//         } catch (uploadErr) {
//             console.warn("[resources.upload] cloudinary upload failed, using Mongo file storage only", uploadErr?.message || uploadErr);
//         }

//         const newResource = await Resources.create({
//             title,
//             subject,
//             category,
//             fileUrl: uploadedUrl,
//             fileName: originalName,
//             fileSize,
//             fileData: base64Data,
//             fileType,
//             textContext: extractedText,
//             embedding: docEmbedding,
//             uploadedBy: session.user.email,
//         });

//         return NextResponse.json({ success: true, resource: newResource });
//     }
//     catch (error) {
//         console.error("Error creating resource:", error);
//         return NextResponse.json({ success: false, error: "Failed to create resource" }, { status: 500 });
//     }
// };

// export const GET = async (request) => {
//     try {
//         const session = await getServerSession(authOptions);        
//         if (!session?.user?.email) {
//             return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//         }
//         await connectDb();
        
//         const resources = await Resources.find({}).select("-fileData").sort({ createdAt: -1 });
//         return NextResponse.json({ success: true, resources });
//     } catch (error) {
//         console.error("Error fetching resources:", error);
//         return NextResponse.json({ success: false, error: "Failed to fetch resources" }, { status: 500 });
//     }   
// };

// export const DELETE = async (request) => {
//     try {
//         const session = await getServerSession(authOptions);    
//         if (!session?.user?.email) {
//             return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//         }
//         const { searchParams } = new URL(request.url);
//         const id = searchParams.get("id");
//         if (!id) {
//             return NextResponse.json({ success: false, error: "Resource id is required" }, { status: 400 });
//         }
//         await connectDb();
//         const deleted = await Resources.findOneAndDelete({ _id: id });
//         if (!deleted) {
//             return NextResponse.json({ success: false, error: "Resource not found" }, { status: 404 });
//         }
//         return NextResponse.json({ success: true, message: "Resource deleted" });
//     } catch (error) {
//         console.error("Error deleting resource:", error);
//         return NextResponse.json({ success: false, error: "Failed to delete resource" }, { status: 500 });
//     }
// };


import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDb from "@/db/connectDb";
import Resources from "@/models/Resources";
import { v2 as cloudinary } from "cloudinary";
import pdf from "pdf-parse-fork"; // 🟩 Pure JS parser: no dynamic workers, no canvas dependency!
import { embedText } from "./embedding";

export const runtime = "nodejs";
export const maxDuration = 60;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// Helper to break textbook documents into manageable paragraphs
function chunkText(text, size = 800, overlap = 150) {
    const words = text.split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += (size - overlap)) {
        const chunk = words.slice(i, i + size).join(" ");
        if (chunk.trim()) chunks.push(chunk);
        if (i + size >= words.length) break;
    }
    return chunks;
}

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

        const byteData = await file.arrayBuffer();
        const buffer = Buffer.from(new Uint8Array(byteData));
        const base64Data = buffer.toString("base64");

        let extractedText = "";
        if (fileName.endsWith(".pdf") || fileType === "application/pdf") {
            // 🟩 Clean, stable text extraction block
            const parsedPdf = await pdf(buffer);
            extractedText = parsedPdf.text;
        } else {
            extractedText = buffer.toString("utf-8");
        }

        if (!extractedText.trim()) {
            return NextResponse.json({ success: false, error: "Document body appears empty or unreadable" }, { status: 400 });
        }

        const textChunks = chunkText(extractedText);
        const primeTextChunk = textChunks.slice(0, 3).join("\n\n");
        
        // Generate vectors using your custom module layout
        const docEmbedding = await embedText(primeTextChunk);

        console.log("=== STRATOS PIPELINE VERIFICATION ===");
        console.log("Extracted Context Text Length:", extractedText.length);
        console.log("Calculated Dense Vector Array Size:", Array.isArray(docEmbedding) ? docEmbedding.length : "Not an array");
        console.log("========================================");

        const originalName = fileName || "resource";
        const originalExt = originalName.includes(".")
            ? originalName.split(".").pop().toLowerCase()
            : "bin";
        const publicIdBase = originalName
            .replace(/\.[^.]+$/, "")
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .slice(0, 80) || "resource";

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

        const newResource = await Resources.create({
            title,
            subject,
            category,
            fileUrl: uploadedUrl,
            fileName: originalName,
            fileSize,
            fileData: base64Data,
            fileType,
            textContext: extractedText,
            embedding: docEmbedding,
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
        const resources = await Resources.find({}).select("-fileData").sort({ createdAt: -1 });
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