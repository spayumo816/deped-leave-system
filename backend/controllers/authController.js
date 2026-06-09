import User from "../models/User.js";
import School from "../models/School.js";
import UserSchool from "../models/UserSchool.js";
import LeaveCredit from "../models/LeaveCredit.js";
import generateToken from "../utils/generateToken.js";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const DIVISION_OFFICE_SCHOOL_ID = "DIVISION-OFFICE";
const DIVISION_OFFICE_SCHOOL_NAME = "Schools Division Office";

const setTokenCookie = (res, token) => {
  res.cookie("token", token, cookieOptions);
};

const getDefaultCredits = (personnelType) => {
  if (personnelType === "teaching") {
    return [
      {
        leaveType: "vacation_service_credit",
        earned: 0,
        used: 0,
      },
    ];
  }

  return [
    {
      leaveType: "vacation_leave",
      earned: 0,
      used: 0,
    },
    {
      leaveType: "sick_leave",
      earned: 0,
      used: 0,
    },
    {
      leaveType: "special_privilege_leave",
      earned: 0,
      used: 0,
    },
    {
      leaveType: "force_leave",
      earned: 0,
      used: 0,
    },
  ];
};

export const registerAdminOfficer = async (req, res) => {
  try {
    const {
      schoolName,
      schoolId,
      name,
      email,
      password,
      employeeNumber,
      position,
      employmentStatus,
      dateHired,
    } = req.body;

    if (!schoolName || !schoolId || !name || !email || !password) {
      return res.status(400).json({
        message: "Please provide all required registration details.",
      });
    }

    const existingSchool = await School.findOne({ schoolId });

    if (existingSchool) {
      return res.status(400).json({
        message: "School already exists. Please contact the administrator.",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists.",
      });
    }

    const school = await School.create({
        schoolName,
        schoolId,
        schoolType: "school",
      });

    const user = await User.create({
      name,
      email,
      password,
    });

    const userSchool = await UserSchool.create({
      user: user._id,
      school: school._id,
      employeeNumber,
      role: "admin_officer",
      personnelType: "non_teaching",
      position,
      employmentStatus,
      dateHired,
    });

    await LeaveCredit.create({
      userSchool: userSchool._id,
      credits: getDefaultCredits("non_teaching"),
    });

    const token = generateToken({
      userId: user._id,
      userSchoolId: userSchool._id,
    });

    setTokenCookie(res, token);

    return res.status(201).json({
      message: "School Admin Officer registered successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      school: {
        id: school._id,
        schoolName: school.schoolName,
        schoolId: school.schoolId,
      },
      role: userSchool.role,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const registerDivisionAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      employeeNumber,
      position,
      employmentStatus,
      dateHired,
    } = req.body;

    if (!name || !email || !password || !employeeNumber) {
      return res.status(400).json({
        message: "Please provide all required registration details.",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists.",
      });
    }

    let divisionOffice = await School.findOne({
      schoolId: DIVISION_OFFICE_SCHOOL_ID,
    });

    if (!divisionOffice) {
      divisionOffice = await School.create({
        schoolName: DIVISION_OFFICE_SCHOOL_NAME,
        schoolId: DIVISION_OFFICE_SCHOOL_ID,
        schoolType: "division_office",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    const userSchool = await UserSchool.create({
      user: user._id,
      school: divisionOffice._id,
      employeeNumber,
      role: "division_admin",
      personnelType: "non_teaching",
      position: position || "Division Admin",
      employmentStatus: employmentStatus || "permanent",
      dateHired,
    });

    await LeaveCredit.create({
      userSchool: userSchool._id,
      credits: getDefaultCredits("non_teaching"),
    });

    const token = generateToken({
      userId: user._id,
      userSchoolId: userSchool._id,
    });

    setTokenCookie(res, token);

    return res.status(201).json({
      message: "Division Admin registered successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      school: {
        id: divisionOffice._id,
        schoolName: divisionOffice.schoolName,
        schoolId: divisionOffice.schoolId,
      },
      role: userSchool.role,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const switchMembership = async (req, res) => {
  try {
    const { userSchoolId } = req.body;

    if (!userSchoolId) {
      return res.status(400).json({
        message: "Membership ID is required.",
      });
    }

    const membership = await UserSchool.findOne({
      _id: userSchoolId,
      user: req.user._id,
      isActive: true,
    })
      .populate("school")
      .populate("user", "-password");

    if (!membership) {
      return res.status(404).json({
        message: "Membership not found or not assigned to your account.",
      });
    }

    const token = generateToken({
      userId: req.user._id,
      userSchoolId: membership._id,
    });

    setTokenCookie(res, token);

    const memberships = await UserSchool.find({
      user: req.user._id,
      isActive: true,
    })
      .populate("school")
      .lean();

    return res.json({
      message: "Active school switched successfully.",
      currentMembership: membership,
      memberships,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    const validPassword = await user.matchPassword(password);

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    const memberships = await UserSchool.find({
      user: user._id,
      isActive: true,
    })
      .populate("school")
      .lean();

    if (memberships.length === 0) {
      return res.status(403).json({
        message: "No active role assignment found for this account.",
      });
    }

    const defaultMembership =
      memberships.find((membership) => membership.role === "division_admin") ||
      memberships[0];

    const token = generateToken({
      userId: user._id,
      userSchoolId: defaultMembership._id,
    });

    setTokenCookie(res, token);

    return res.json({
      message: "Login successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      currentMembership: defaultMembership,
      memberships,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const memberships = await UserSchool.find({
      user: req.user._id,
      isActive: true,
    })
      .populate("school")
      .lean();

    return res.json({
      user: req.user,
      currentMembership: req.userSchool || null,
      memberships,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const logoutUser = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  return res.json({
    message: "Logged out successfully.",
  });
};

export const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Please provide current password, new password, and confirm password.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    const isCurrentPasswordCorrect = await user.matchPassword(currentPassword);

    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};