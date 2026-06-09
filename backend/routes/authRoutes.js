import express from "express";
import {
  registerAdminOfficer,
  registerDivisionAdmin,
  loginUser,
  logoutUser,
  getMe,
  changeMyPassword,
  switchMembership,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register-admin", registerAdminOfficer);

router.post("/register-division-admin", registerDivisionAdmin);

router.post("/login", loginUser);

router.post("/logout", logoutUser);

router.get("/me", protect, getMe);

router.patch("/change-password", protect, changeMyPassword);

router.patch("/switch-membership", protect, switchMembership);

export default router;