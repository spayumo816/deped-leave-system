import School from "../models/School.js";
import UserSchool from "../models/UserSchool.js";
import LeaveCredit from "../models/LeaveCredit.js";

const cloneCredits = (credits = []) => {
  return credits.map((credit) => ({
    leaveType: credit.leaveType,
    earned: Number(credit.earned || 0),
    used: Number(credit.used || 0),
    remarks: credit.remarks || "",
  }));
};

const getZeroDefaultCredits = () => {
  return [
    { leaveType: "vacation_leave", earned: 0, used: 0 },
    { leaveType: "sick_leave", earned: 0, used: 0 },
    { leaveType: "special_privilege_leave", earned: 0, used: 0 },
    { leaveType: "force_leave", earned: 0, used: 0 },
  ];
};

export const addManagedSchool = async (req, res) => {
  try {
    const { schoolName, schoolId, address } = req.body;

    if (!schoolName || !schoolId) {
      return res.status(400).json({
        message: "School name and school ID are required.",
      });
    }

    const currentMembership = req.userSchool;

    if (!currentMembership) {
      return res.status(403).json({
        message: "No active membership found.",
      });
    }

    let school = await School.findOne({ schoolId });

    if (!school) {
      school = await School.create({
        schoolName,
        schoolId,
        address: address || "",
        schoolType: "school",
      });
    }

    if (school.schoolType === "division_office") {
      return res.status(400).json({
        message: "You cannot add a division office as a managed school.",
      });
    }

    const existingMembership = await UserSchool.findOne({
      user: req.user._id,
      school: school._id,
    });

    if (existingMembership) {
      return res.status(400).json({
        message: "You are already assigned to this school.",
      });
    }

    const duplicateEmployeeNumber = await UserSchool.findOne({
      school: school._id,
      employeeNumber: currentMembership.employeeNumber,
    });

    if (duplicateEmployeeNumber) {
      return res.status(400).json({
        message:
          "Your employee number already exists in this school. Please contact the system administrator.",
      });
    }

    const userSchool = await UserSchool.create({
      user: req.user._id,
      school: school._id,
      employeeNumber: currentMembership.employeeNumber,
      role: "admin_officer",
      personnelType: "non_teaching",
      position: currentMembership.position || "Administrative Officer",
      employmentStatus: currentMembership.employmentStatus || "permanent",
      dateHired: currentMembership.dateHired,
    });

    const currentLeaveCredit = await LeaveCredit.findOne({
      userSchool: currentMembership._id,
    });

    await LeaveCredit.create({
      userSchool: userSchool._id,
      credits: currentLeaveCredit
        ? cloneCredits(currentLeaveCredit.credits)
        : getZeroDefaultCredits(),
    });

    const populatedMembership = await UserSchool.findById(userSchool._id)
      .populate("user", "-password")
      .populate("school");

    return res.status(201).json({
      message: "Managed school added successfully.",
      school,
      userSchool: populatedMembership,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getMyManagedSchools = async (req, res) => {
  try {
    const memberships = await UserSchool.find({
      user: req.user._id,
      isActive: true,
    })
      .populate("school")
      .populate("user", "-password")
      .sort({ createdAt: -1 });

    return res.json(memberships);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};