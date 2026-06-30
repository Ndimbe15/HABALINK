import express from "express";
import {
  uploadProperty,
  getAvailableProperties,
  getLandlordProperties,
  getPropertyById,
  updateProperty,
} from "./property.controller.js";
import { authmiddleware } from "../auth/auth.middleware.js";
import { isLandlord } from "../../shared/middleware/role.middleware.js";
import { upload } from "../../shared/middleware/upload.middleware.js";

const router = express.Router();

router.get("/", getAvailableProperties);
router.get("/:id", getPropertyById);

router.get("/landlord/my-properties", authmiddleware, isLandlord, getLandlordProperties);
router.post("/", authmiddleware, isLandlord, upload.array("photos", 10), uploadProperty);
router.put("/:id", authmiddleware, isLandlord, upload.array("photos", 10), updateProperty);

export default router;
