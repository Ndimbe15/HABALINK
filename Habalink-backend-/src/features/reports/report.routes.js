import express from "express";
import { submitReport, getReports, updateReportStatus } from "./report.controller.js";
import { authmiddleware } from "../auth/auth.middleware.js";
import { isSeeker, isAdmin } from "../../shared/middleware/role.middleware.js";

const router = express.Router();

router.post("/", authmiddleware, isSeeker, submitReport);
router.get("/", authmiddleware, isAdmin, getReports);
router.put("/:id/status", authmiddleware, isAdmin, updateReportStatus);

export default router;
