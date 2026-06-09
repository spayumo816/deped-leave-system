import express from "express";
import {
  fileLeave,
  getMyLeaves,
  getSchoolLeaves,
  getPendingApprovals,
  approveLeave,
  rejectLeave,
} from "../controllers/leaveController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, fileLeave);

router.get("/my", protect, getMyLeaves);

router.get(
  "/pending-approvals",
  protect,
  authorizeRoles("principal", "division_admin"),
  getPendingApprovals
);

router.get(
  "/",
  protect,
  authorizeRoles("admin_officer", "principal", "division_admin"),
  getSchoolLeaves
);

router.patch(
  "/:id/approve",
  protect,
  authorizeRoles("principal", "division_admin"),
  approveLeave
);

router.patch(
  "/:id/reject",
  protect,
  authorizeRoles("principal", "division_admin"),
  rejectLeave
);

export default router;