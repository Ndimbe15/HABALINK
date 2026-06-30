import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
    },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    issueType: {
      type: String,
      required: true,
      enum: ["fake_house", "wrong_price", "wrong_location", "already_taken", "landlord_misconduct", "other"],
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;
