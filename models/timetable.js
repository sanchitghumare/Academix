import mongoose from "mongoose";

const TimetableSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true },
  schedule: {
    slots: { type: [String], default: [] },
    timetable: { type: mongoose.Schema.Types.Mixed, default: {} },
  }
}, { timestamps: true });

export default mongoose.models.Timetable || mongoose.model("Timetable", TimetableSchema);