import express from "express";
import {
  createSchoolUser,
  getSchoolUsers,
  updateSchoolUser,
  deactivateSchoolUser,
  resetUserPassword,
} from "../controllers/userController.js";
import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("admin_officer"),
  createSchoolUser
);

router.get(
  "/",
  protect,
  authorizeRoles("admin_officer", "division_admin"),
  getSchoolUsers
);

router.patch(
  "/:id/reset-password",
  protect,
  authorizeRoles("admin_officer", "division_admin"),
  resetUserPassword
);

router.patch(
  "/:id",
  protect,
  authorizeRoles("admin_officer", "division_admin"),
  updateSchoolUser
);

router.patch(
  "/:id/deactivate",
  protect,
  authorizeRoles("admin_officer", "division_admin"),
  deactivateSchoolUser
);

export default router;