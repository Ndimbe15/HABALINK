import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import connectDB from "./src/config/database.js";

console.log("🔧 Loading environment variables...");


const PORT = process.env.PORT || 5000;

console.log("🔌 Connecting to MongoDB...");
await connectDB();

console.log("🚀 Starting server...");

app.listen(PORT, () => {
  console.log(`🌍 Server running on port ${PORT}`);
});
