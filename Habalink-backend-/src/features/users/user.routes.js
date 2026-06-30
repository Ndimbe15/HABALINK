import express from "express";
import { submitLandlordVerification } from "./user.controller.js";
import { authmiddleware } from "../auth/auth.middleware.js";
import { isLandlord } from "../../shared/middleware/role.middleware.js";
import { upload } from "../../shared/middleware/upload.middleware.js";

const router = express.Router();

router.post(
  "/verify-landlord",
  authmiddleware,
  isLandlord,
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'ownershipDocument', maxCount: 1 }
  ]),
  submitLandlordVerification
);

export default router;
