import jwt from "jsonwebtoken";
import User from "../models/User.js";
import UserSchool from "../models/UserSchool.js";

const getIdString = (value) => {
  if (!value) return "";

  if (value._id) return String(value._id);

  return String(value);
};

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Not authorized.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    req.user = user;
    req.userSchool = null;

    req.isDivisionAdmin = false;
    req.isSchoolScopedUser = false;
    req.currentSchoolId = null;

    if (decoded.userSchoolId) {
      const userSchool = await UserSchool.findById(decoded.userSchoolId)
        .populate("school")
        .populate("user", "-password");

      if (!userSchool || !userSchool.isActive) {
        return res.status(403).json({
          message: "No active school membership found.",
        });
      }

      req.userSchool = userSchool;

      req.isDivisionAdmin = userSchool.role === "division_admin";
      req.isSchoolScopedUser = userSchool.role !== "division_admin";
      req.currentSchoolId = getIdString(userSchool.school);
    }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token.",
    });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.userSchool) {
      return res.status(403).json({
        message: "No active school membership found.",
      });
    }

    if (!roles.includes(req.userSchool.role)) {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    next();
  };
};