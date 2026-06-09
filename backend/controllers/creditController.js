import LeaveCredit from "../models/LeaveCredit.js";

const getIdString = (value) => {
  if (!value) return "";
  if (value._id) return String(value._id);
  return String(value);
};

const isSameSchool = (schoolA, schoolB) => {
  return getIdString(schoolA) === getIdString(schoolB);
};

const canAccessSchool = (req, school) => {
  return req.isDivisionAdmin || isSameSchool(school, req.userSchool.school);
};

export const getSchoolLeaveCredits = async (req, res) => {
  try {
    const populateUserSchool = req.isDivisionAdmin
      ? {
          path: "userSchool",
          populate: [
            { path: "user", select: "-password" },
            { path: "school" },
          ],
        }
      : {
          path: "userSchool",
          match: { school: req.userSchool.school._id },
          populate: [
            { path: "user", select: "-password" },
            { path: "school" },
          ],
        };

    const credits = await LeaveCredit.find().populate(populateUserSchool);

    const filteredCredits = credits.filter(
      (credit) => credit.userSchool !== null
    );

    return res.json(filteredCredits);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getMyLeaveCredits = async (req, res) => {
  try {
    const leaveCredit = await LeaveCredit.findOne({
      userSchool: req.userSchool._id,
    });

    if (!leaveCredit) {
      return res.status(404).json({
        message: "Leave credit record not found.",
      });
    }

    const credits = leaveCredit.credits.map((credit) => ({
      leaveType: credit.leaveType,
      earned: credit.earned,
      used: credit.used,
      remaining: credit.earned - credit.used,
      remarks: credit.remarks,
    }));

    return res.json({
      userSchoolId: req.userSchool._id,
      role: req.userSchool.role,
      personnelType: req.userSchool.personnelType,
      credits,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getUserLeaveCredits = async (req, res) => {
  try {
    const leaveCredit = await LeaveCredit.findOne({
      userSchool: req.params.userSchoolId,
    }).populate({
      path: "userSchool",
      populate: [
        { path: "user", select: "-password" },
        { path: "school" },
      ],
    });

    if (!leaveCredit) {
      return res.status(404).json({
        message: "Leave credit record not found.",
      });
    }

    if (!canAccessSchool(req, leaveCredit.userSchool.school)) {
      return res.status(403).json({
        message: "You can only view leave credits you are authorized to access.",
      });
    }

    return res.json(leaveCredit);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateUserLeaveCredit = async (req, res) => {
  try {
    const { leaveType, earned, used, remarks } = req.body;

    const leaveCredit = await LeaveCredit.findOne({
      userSchool: req.params.userSchoolId,
    }).populate({
      path: "userSchool",
      populate: [{ path: "school" }],
    });

    if (!leaveCredit) {
      return res.status(404).json({
        message: "Leave credit record not found.",
      });
    }

    if (!canAccessSchool(req, leaveCredit.userSchool.school)) {
      return res.status(403).json({
        message: "You can only update leave credits you are authorized to access.",
      });
    }

    const creditItem = leaveCredit.credits.find(
      (credit) => credit.leaveType === leaveType
    );

    if (!creditItem) {
      return res.status(400).json({
        message: "Leave type not found for this user.",
      });
    }

    if (earned !== undefined) creditItem.earned = earned;
    if (used !== undefined) creditItem.used = used;
    if (remarks !== undefined) creditItem.remarks = remarks;

    await leaveCredit.save();

    return res.json({
      message: "Leave credit updated successfully.",
      leaveCredit,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const addUserLeaveCredit = async (req, res) => {
  try {
    const { leaveType, earned = 0, used = 0, remarks = "" } = req.body;

    const leaveCredit = await LeaveCredit.findOne({
      userSchool: req.params.userSchoolId,
    }).populate({
      path: "userSchool",
      populate: [{ path: "school" }],
    });

    if (!leaveCredit) {
      return res.status(404).json({
        message: "Leave credit record not found.",
      });
    }

    if (!canAccessSchool(req, leaveCredit.userSchool.school)) {
      return res.status(403).json({
        message: "You can only add leave credits you are authorized to access.",
      });
    }

    const existingCredit = leaveCredit.credits.find(
      (credit) => credit.leaveType === leaveType
    );

    if (existingCredit) {
      return res.status(400).json({
        message: "This leave type already exists for this user.",
      });
    }

    leaveCredit.credits.push({
      leaveType,
      earned,
      used,
      remarks,
    });

    await leaveCredit.save();

    return res.status(201).json({
      message: "Leave credit added successfully.",
      leaveCredit,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};