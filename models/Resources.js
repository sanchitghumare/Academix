import mongoose from "mongoose";

const ResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true }, 
  fileUrl: { type: String, default: "" }, 
  fileName: { type: String, default: "" },
  fileSize: { type: Number, default: 0 },
  fileData: { type: String, default: "" },
  fileType: { type: String, default: "" },
  category: { type: String, default: "Notes" }, 
  uploadedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Resource || mongoose.model("Resource", ResourceSchema);