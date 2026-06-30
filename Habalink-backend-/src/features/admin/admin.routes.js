// admin.routes.js
import express from "express";
import { 
  adminLogin, 
  getAllUsers, 
  toggleSuspendUser, 
  getPendingProperties, 
  updatePropertyAdminStatus,
  getDashboardStats,
  getPendingLandlords,
  verifyLandlord,
  promoteToAdmin,
  deleteUser
} from "./admin.controller.js";
import { authmiddleware } from "../auth/auth.middleware.js";
import { isAdmin } from "../../shared/middleware/role.middleware.js";

const router = express.Router();

router.post("/login", adminLogin);

// Protected Admin Routes
router.use(authmiddleware, isAdmin);

router.get("/dashboard/stats", getDashboardStats);

router.get("/users", getAllUsers);
router.put("/users/:id/suspend", toggleSuspendUser);
router.put("/users/:id/promote", promoteToAdmin);
router.delete("/users/:id", deleteUser);

router.get("/properties/pending", getPendingProperties);
router.put("/properties/:id/status", updatePropertyAdminStatus);

router.get("/landlords/pending", getPendingLandlords);
router.put("/landlords/:id/verify", verifyLandlord);

export default router;
