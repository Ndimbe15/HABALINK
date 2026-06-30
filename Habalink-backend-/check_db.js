import mongoose from "mongoose";
import User from "./src/features/users/user.model.js";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/habalink").then(async () => {
  const landlords = await User.find({ role: "landlord" });
  console.log("Landlords with docs:");
  landlords.forEach(l => {
    if (l.idDocumentUrl) {
      console.log(l.email, "=>", l.idDocumentUrl);
    }
  });
  mongoose.disconnect();
}).catch(console.error);
