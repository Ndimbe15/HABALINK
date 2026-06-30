import express from "express";
import { initiatePayment, verifyPayment, getMyPayments, getAllPayments } from "./payment.controller.js";
import { authmiddleware } from "../auth/auth.middleware.js";
import { isAdmin } from "../../shared/middleware/role.middleware.js";

const router = express.Router();
router.post("/initiate", authmiddleware, initiatePayment);
router.post("/verify", authmiddleware, verifyPayment);
router.get("/my-payments", authmiddleware, getMyPayments);
router.get("/all-payments", authmiddleware, isAdmin, getAllPayments);

export default router;
