import mongoose from "mongoose";
const { Schema, model } = mongoose;

const SubjectSchema = new Schema({
    // Link this subject to a specific user
    userEmail: { type: String, required: true, index: true }, 
    
    subjectname: { type: String, required: true, trim: true },
    attended: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    minRequired: { type: Number, default: 75 },
    
    // Optional: Useful if you want to allow custom icons/colors for subjects
    profilepic: { type: String, trim: true },
    
    done: { type: Boolean, default: false },
}, { 
    // This automatically handles createdAt and updatedAt for you!
    timestamps: true 
});

// Create an index to make searching by userEmail faster
SubjectSchema.index({ userEmail: 1, subjectname: 1 });

export default mongoose.models.Subject || model("Subject", SubjectSchema);