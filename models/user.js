import mongoose from "mongoose";
const {Schema , model} = mongoose;
const UserSchema = new Schema({
    name : {type : String, trim: true },
    email : {type : String , required : true , unique : true, trim: true, lowercase: true},
    username:{type : String, trim: true },
    profilepic : {type : String, trim: true },
    coverpic: {type : String, trim: true },
    razorpayid: { type: String, trim: true },
    razorpaysecret: { type: String, trim: true },
    createdAt: {type : Date , default : Date.now},
    updatedAt: {type : Date , default : Date.now},
});

export default mongoose.models.User ||model("User",UserSchema);    