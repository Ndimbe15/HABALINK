import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../users/user.model.js";
import { registerUser, loginUser } from "./auth.service.js";
// import User from "./auth.model.js";
import { generateOTP } from "./auth.utils.js";
import OTP from "./auth.otp.model.js";
import {
  sendPasswordResetOTPEmail,
  sendRegistrationOTPEmail,
} from "./auth.mailer.js";

console.log("🎮 Auth controller loaded");
export const register = async (req, res, next) => {
  try {
    console.log("📝 Register request received");

    const { fullName, email, password, role } = req.body;

    // ✅ INPUT VALIDATION
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // =========================
    // PASSWORD VALIDATION
    // =========================
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // =========================
    // CHECK IF USER EXISTS
    // =========================
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // =========================
    // GENERATE OTP
    // =========================
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated OTP:", otp);

    const hashedOtp = await bcrypt.hash(otp, 10);

    // =========================
    // HASH PASSWORD
    // =========================
    const hashedPassword = await bcrypt.hash(password, 10);

    // remove old OTP if exists
    await OTP.deleteOne({ email });

    // =========================
    // SAVE TEMP DATA
    // =========================
    await OTP.create({
      fullName,
      email,
      password: hashedPassword,
      role: role || "house_seeker",
      otp: hashedOtp,
      purpose: "registration",
    });

    // =========================
    // SEND OTP EMAIL
    // =========================
    await sendRegistrationOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email. Verify to complete registration",
    });
  } catch (error) {
    next(error);
  }
};

// verifyRegistrationOTP
export const verifyRegistrationOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // ✅ INPUT VALIDATION
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // =========================
    // CHECK IF OTP RECORD EXISTS
    // =========================
    const otpRecord = await OTP.findOne({
      email,
      purpose: "registration",
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP.",
      });
    }

    // =========================
    // CHECK IF OTP MATCHES
    // =========================
    const isValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please enter the correct code.",
      });
    }

    // CREATE USER
    // CREATE USER
    // Determine role: first user = admin
    // Determine role: first user = admin
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? "admin" : (otpRecord.role || "house_seeker");

    const user = await User.create({
      fullName: otpRecord.fullName,
      email: otpRecord.email,
      password: otpRecord.password,
      role: assignedRole,
    });

    // DELETE OTP RECORD
    await OTP.deleteOne({ email });

    // ======================
    // GENERATE JWT TOKEN
    // ======================
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // ======================
    // STORE TOKEN IN COOKIE
    // ======================
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // change to true in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ======================
    // SAFE USER RESPONSE
    // ======================
    const safeUser = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
    };

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

//resendRegistrationOTP
export const resendRegistrationOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(404).json({
        message: "No registration request found",
      });
    }

    const now = Date.now();
    const otpCreatedTime = new Date(otpRecord.createdAt).getTime();

    const diff = now - otpCreatedTime;

    // 60 seconds cooldown
    if (diff < 60000) {
      const remainingTime = Math.ceil((60000 - diff) / 1000);

      return res.status(429).json({
        message: `Please wait ${remainingTime} seconds before requesting another OTP`,
      });
    }

    // generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOtp = await bcrypt.hash(otp, 10);

    otpRecord.otp = hashedOtp;
    otpRecord.createdAt = new Date();

    await otpRecord.save();

    try {
      await sendRegistrationOTPEmail(email, otp);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email",
      });
    }

    res.json({
      success: true,
      message: "New OTP sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET CURRENT USER
// ============================================

export const getCurrentUser = async (req, res) => {
  try {
    console.log("👤 Fetching current logged-in user...");

    // auth.middleware should attach user to req
    const user = req.user;

    if (!user) {
      console.log("❌ No user found in request");
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log("✅ Current user:", user.email);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("❌ Error fetching current user:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching user",
    });
  }
};

export const login = async (req, res, next) => {
  try {
    console.log("🔑 Login request received");

    const result = await loginUser(req.body);

    // remove password before sending user
    const { password, ...safeUser } = result.user._doc;

    res.json({
      success: true,
      message: "Login successful",
      token: result.token,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

// forget password
export const forgotPassword = async (req, res, next) => {
  try {
    console.log("📩 Forgot password request received");

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();

    console.log("🔑 Generated OTP:", otp);

    const hashedOTP = await bcrypt.hash(otp, 10);

    // 🔹 Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // 🔹 Store the new OTP
    await OTP.create({
      email,
      otp: hashedOTP,
    });

    console.log("✅ OTP stored");

    // send email
    await sendPasswordResetOTPEmail(email, otp);

    res.json({
      message: "OTP sent to your email",
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP Controller
export const verifyOTP = async (req, res, next) => {
  try {
    console.log("🔍 Verifying OTP...");
    console.log("Request body:", req.body);

    const { email, otp } = req.body;

    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      console.log("❌ OTP not found or expired");
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    // 🔒 Check if user is currently blocked
    if (otpRecord.blockedUntil && otpRecord.blockedUntil > Date.now()) {
      const remainingTime = Math.ceil(
        (otpRecord.blockedUntil - Date.now()) / 60000,
      );

      console.log(`⛔ User blocked. Try again in ${remainingTime} minutes`);

      return res.status(429).json({
        message: `Too many failed attempts. Try again in ${remainingTime} minutes.`,
      });
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);

    // ❌ Wrong OTP
    if (!isValid) {
      otpRecord.attempts += 1;

      console.log("❌ Wrong OTP attempt:", otpRecord.attempts);

      // block user after 5 attempts
      if (otpRecord.attempts >= 5) {
        otpRecord.blockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        console.log("⛔ User blocked for 10 minutes");
      }

      await otpRecord.save();

      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // ✅ Correct OTP
    otpRecord.attempts = 0;
    otpRecord.blockedUntil = null;

    await otpRecord.save();

    console.log("✅ OTP verified successfully");

    res.json({
      message: "OTP verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Reset Password Controller
export const resetPassword = async (req, res, next) => {
  try {
    console.log("🔑 Reset password request received");

    const { email, newPassword } = req.body;

    console.log("📩 Request body:", req.body);

    if (!email || !newPassword) {
      console.log("❌ Missing email or new password");

      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    console.log("🔍 Searching for user with email:", email);

    const user = await User.findOne({ email });

    if (!user) {
      console.log("❌ User not found for email:", email);

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("✅ User found:", user.email);

    console.log("🔐 Hashing new password...");

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log("🔑 Password hashed successfully");

    user.password = hashedPassword;

    console.log("💾 Saving new password to database...");

    await user.save();

    console.log("✅ Password reset successful for:", email);

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.log("🔥 Reset password error:", error);

    next(error);
  }
};

// import User from "../users/user.model.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

//admin login
// export const adminLogin = async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email });

//   if (!user) return res.status(401).json({ message: "Invalid credentials" });

//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

//   if (user.role !== "admin") {
//     return res.status(403).json({ message: "You are not authorized as admin" });
//   }

//   const token = jwt.sign(
//     { id: user._id, role: user.role },
//     process.env.JWT_SECRET,
//     { expiresIn: "7d" },
//   );

//   res.json({ user, token });
// };