import express from "express";
import {
  createSupportMessage,
  getSupportMessages,
  markAsRead,
  deleteSupportMessage
} from "./support.controller.js";
import { authmiddleware } from "../../features/auth/auth.middleware.js";
import { isAdmin } from "../../features/admin/admin.middleware.js";

const router = express.Router();

router.post("/", createSupportMessage);
router.get("/", authmiddleware, isAdmin, getSupportMessages);
router.put("/:id/read", authmiddleware, isAdmin, markAsRead);
router.delete("/:id", authmiddleware, isAdmin, deleteSupportMessage);

export default router;
