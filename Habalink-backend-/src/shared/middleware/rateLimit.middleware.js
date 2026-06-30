import rateLimit from "express-rate-limit";

// OTP / password reset limiter
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: {
    message: "Too many requests. Please try again in 10 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login limiter
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    message: "Too many login attempts. Please try again later.",
  },
});
