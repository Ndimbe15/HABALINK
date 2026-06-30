import express from "express";
import {
  createBooking,
  getSeekerBookings,
  getLandlordAppointments,
  updateBookingStatus
} from "./booking.controller.js";
import { authmiddleware } from "../auth/auth.middleware.js";
import { isSeeker, isLandlord } from "../../shared/middleware/role.middleware.js";

const router = express.Router();

router.post("/", authmiddleware, isSeeker, createBooking);
router.get("/my-bookings", authmiddleware, isSeeker, getSeekerBookings);

router.get("/appointments", authmiddleware, isLandlord, getLandlordAppointments);
router.put("/:id/status", authmiddleware, isLandlord, updateBookingStatus);

export default router;
