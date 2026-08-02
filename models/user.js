import mongoose from "mongoose";
const { Schema, model } = mongoose;
const UserSchema = new Schema({
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    username: { type: String, trim: true },
    profilepic: { type: String, trim: true },
    notifications: {
        enabled: {
            type: Boolean,
            default: false
        },

        dailySummary: {
            type: Boolean,
            default: true
        },

        attendanceAlerts: {
            type: Boolean,
            default: true
        },

        dailySummaryTime: {
            type: String,
            default: "08:00"
        },
        lastDailySummary: {
            type: Date,
            default: null,
        },
        fcmToken: {
            token: String,
            lastUsed: Date,
        }
    }
}, { timestamps: true });

export default mongoose.models.User || model("User", UserSchema);    