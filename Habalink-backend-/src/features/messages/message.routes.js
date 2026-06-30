import express from "express";
import { sendMessage, getConversation, getInbox } from "./message.controller.js";
import { authmiddleware } from "../auth/auth.middleware.js";

const router = express.Router();

router.post("/", authmiddleware, sendMessage);
router.get("/inbox", authmiddleware, getInbox);
router.get("/:receiverId/:propertyId", authmiddleware, getConversation);

export default router;
