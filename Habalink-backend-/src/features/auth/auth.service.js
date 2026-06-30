import User from "../users/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

console.log("⚙️ Auth service initialized");

export const registerUser = async ({ name, email, password }) => {
  console.log("🔍 Checking if user exists...");

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  console.log("🔒 Hashing password...");

  const hashedPassword = await bcrypt.hash(password, 10);

  console.log("💾 Creating new user...");

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  return user;
};

export const loginUser = async ({ email, password }) => {
  console.log("🔎 Finding user...");
  console.log("📧 Email received:", email);
  console.log("🔑 Password received:", password);

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  console.log("🗄 Password in DB:", user.password);

  console.log("🔐 Comparing passwords...");

  const isMatch = await bcrypt.compare(password, user.password);

  console.log("✅ Password match result:", isMatch);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  console.log("🪪 Generating token...");

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  return { user, token };
};
