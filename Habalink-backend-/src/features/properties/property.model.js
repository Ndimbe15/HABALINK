import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true }, // e.g. Studio, Appartment, Villa
    location: { type: String, required: true }, // Town/City
    price: { type: Number, required: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "unavailable"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid_listing", "paid_featured"],
      default: "pending",
    },
    featured: { type: Boolean, default: false },
    latitude: { type: Number },
    longitude: { type: Number },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Property = mongoose.model("Property", propertySchema);
export default Property;
