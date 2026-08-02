import mongoose from "mongoose";
const { Schema, model } = mongoose;

const SubjectSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    subjectname: { type: String, required: true, trim: true },
    attended: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    minRequired: { type: Number, default: 75 },
    done: { type: Boolean, default: false },
    notification: {
        warned: {
            type: Boolean,
            default: false,
        },
        lastWarnedAt: {
            type: Date,
            default: null,
        },
    },
}, {
    timestamps: true
});

SubjectSchema.index({ user: 1, subjectname: 1 });

export default mongoose.models.Subject || model("Subject", SubjectSchema);