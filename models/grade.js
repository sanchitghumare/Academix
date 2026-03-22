import mongoose from "mongoose";

const GradeSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  semester: { type: Number, default: 1 },
  subjectname: { type: String, required: true },
  credits: { type: Number, required: true },
  endSemMarks: { type: Number, default: 0 },
  midSemMarks: { type: Number, default: 0 },
  caMarks: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  grade: { type: Number, default: 0 },
  gradePoint: { type: Number, default: 0 },
  gradeLabel: { type: String, default: "F" },
  percentage: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Grade || mongoose.model("Grade", GradeSchema);