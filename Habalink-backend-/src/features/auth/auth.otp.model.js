import mongoose from "mongoose";

console.log("📦 OTP model initialized");

const otpSchema = new mongoose.Schema({
  fullName: {
    type: String,
  },

  email: {
    type: String,
    required: true,
    index: true,
  },
  
  role: {
    type: String,
    enum: ["house_seeker", "landlord", "admin"],
  },

  password: {
    type: String,
  },

  otp: {
    type: String,
    required: true,
  },

  attempts: {
    type: Number,
    default: 0,
  },

  blockedUntil: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600,
  },
  purpose: {
    type: String,
    enum: ["registration", "password_reset"],
  },
});

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
