import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["house_seeker", "landlord", "admin"],
      default: "house_seeker",
    },
    suspended: { type: Boolean, default: false },
    
    // Landlord Verification Fields
    landlordVerificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified"
    },
    idDocumentUrl: { type: String, default: null },
    ownershipDocumentUrl: { type: String, default: null },
    rejectionReason: { type: String, default: null },

    // resetOTP: {
    //   type: String,
    //   default: null,
    // },

    // otpExpires: {
    //   type: Date,
    //   default: null,
    // },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
