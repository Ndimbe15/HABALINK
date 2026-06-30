import express from "express";
import {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  verifyRegistrationOTP,
  resendRegistrationOTP,
  getCurrentUser,
} from "./auth.controller.js";
import { otpLimiter } from "../../shared/middleware/rateLimit.middleware.js";
import { authmiddleware } from "./auth.middleware.js";

console.log("🔐 Auth routes initialized");

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post("/register", register);
router.post("/verify-registration-otp", verifyRegistrationOTP);
router.post("/resend-registration-otp", resendRegistrationOTP);
router.get("/me", authmiddleware, getCurrentUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", login);


router.post("/forgot-password", otpLimiter, forgotPassword);

router.post("/verify-otp", otpLimiter, verifyOTP);

router.post("/reset-password", resetPassword);
export default router;


