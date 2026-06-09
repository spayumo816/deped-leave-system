import express from "express";
import {
  getSchoolLeaveCredits,
  getMyLeaveCredits,
  getUserLeaveCredits,
  updateUserLeaveCredit,
  addUserLeaveCredit,
} from "../controllers/creditController.js";
import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my", protect, getMyLeaveCredits);

router.get(
  "/",
  protect,
  authorizeRoles("admin_officer", "principal", "division_admin"),
  getSchoolLeaveCredits
);

router.post(
  "/:userSchoolId/add",
  protect,
  authorizeRoles("admin_officer"),
  addUserLeaveCredit
);

router.get(
  "/:userSchoolId",
  protect,
  authorizeRoles("admin_officer", "principal", "division_admin"),
  getUserLeaveCredits
);

router.patch(
  "/:userSchoolId",
  protect,
  authorizeRoles("admin_officer"),
  updateUserLeaveCredit
);

export default router;