import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

console.log("📨 Mailer initialized");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// ============================
// Registration OTP Email
// ============================
export const sendRegistrationOTPEmail = async (email, otp) => {
  try {
    console.log("📧 Sending registration OTP email to:", email);

    await transporter.sendMail({
      from: `"Habalink Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Habalink Account Verification OTP",
      html: `
        <div style="font-family: Arial; padding:20px;">
          <h2>Welcome to Habalink</h2>

          <p>Use the OTP below to verify your account:</p>

          <h1 style="letter-spacing:5px; color:#2c7be5;">
            ${otp}
          </h1>

          <p>This code expires in 10 minutes.</p>

          <p>If you did not request this, please ignore this email.</p>

          <hr/>

          <p style="font-size:12px;color:gray;">
            Habalink Security Team
          </p>
        </div>
      `,
    });

    console.log("✅ Registration OTP email sent");
  } catch (error) {
    console.error("❌ Registration email failed:", error);

    // 🚨 THIS IS THE FIX
    throw error;
  }
};


// ============================
// Password Reset OTP Email
// ============================
export const sendPasswordResetOTPEmail = async (email, otp) => {
  try {
    console.log("📧 Sending password reset OTP email...");

    await transporter.sendMail({
      from: `"Habalink Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <h2>Password Reset Request</h2>
        <p>Your OTP code is:</p>
        <h1>${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      `,
    });

    console.log("✅ Password reset email sent");

  } catch (error) {
    console.log("❌ Password reset email failed:");
    console.log(error);
  }
};