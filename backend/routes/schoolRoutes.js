import express from "express";
import {
  addManagedSchool,
  getMyManagedSchools,
} from "../controllers/schoolController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/my-managed-schools",
  protect,
  authorizeRoles("admin_officer", "division_admin"),
  getMyManagedSchools
);

router.post(
  "/my-managed-schools",
  protect,
  authorizeRoles("admin_officer"),
  addManagedSchool
);

export default router;