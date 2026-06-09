import LeaveApplication from "../models/LeaveApplication.js";
import LeaveCredit from "../models/LeaveCredit.js";
import LeaveLedgerTransaction from "../models/LeaveLedgerTransactions.js";

const getIdString = (value) => {
  if (!value) return "";
  if (value._id) return String(value._id);
  return String(value);
};

const isSameSchool = (schoolA, schoolB) => {
  return getIdString(schoolA) === getIdString(schoolB);
};

const getSchoolId = (userSchool) => {
  return getIdString(userSchool?.school);
};

const canAccessSchool = (req, school) => {
  return req.isDivisionAdmin || isSameSchool(school, req.userSchool.school);
};

const cloneCredits = (credits = []) => {
  return credits.map((credit) => ({
    leaveType: credit.leaveType,
    earned: Number(credit.earned || 0),
    used: Number(credit.used || 0),
    remarks: credit.remarks || "",
  }));
};

const syncLeaveCreditsAcrossUserMemberships = async ({
  sourceUserSchoolId,
  userId,
}) => {
  const sourceLeaveCredit = await LeaveCredit.findOne({
    userSchool: sourceUserSchoolId,
  });

  if (!sourceLeaveCredit) return;

  const UserSchool = (await import("../models/UserSchool.js")).default;

  const memberships = await UserSchool.find({
    user: userId,
    isActive: true,
  });

  const syncedCredits = cloneCredits(sourceLeaveCredit.credits);

  await Promise.all(
    memberships.map(async (membership) => {
      await LeaveCredit.findOneAndUpdate(
        { userSchool: membership._id },
        {
          userSchool: membership._id,
          credits: syncedCredits,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    })
  );
};

export const fileLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, totalDays, reason } = req.body;

    const leaveCredit = await LeaveCredit.findOne({
      userSchool: req.userSchool._id,
    });

    if (!leaveCredit) {
      return res.status(404).json({
        message: "Leave credit record not found.",
      });
    }

    const allowedLeave = leaveCredit.credits.find(
      (credit) => credit.leaveType === leaveType
    );

    if (!allowedLeave) {
      return res.status(400).json({
        message: "You are not allowed to file this type of leave.",
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        message: "Start date cannot be later than end date.",
      });
    }

    const overlappingLeave = await LeaveApplication.findOne({
      userSchool: req.userSchool._id,
      status: {
        $in: ["pending", "approved"],
      },
      startDate: {
        $lte: new Date(endDate),
      },
      endDate: {
        $gte: new Date(startDate),
      },
    });

    if (overlappingLeave) {
      return res.status(400).json({
        message: "You already have a leave application for the selected dates.",
      });
    }

    const approverRole =
      req.userSchool.role === "principal" ? "division_admin" : "principal";

    const leave = await LeaveApplication.create({
      userSchool: req.userSchool._id,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      approverRole,
      status: "pending",
    });

    return res.status(201).json({
      message: "Leave application filed successfully.",
      leave,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveApplication.find({
      userSchool: req.userSchool._id,
    })
      .populate({
        path: "approvedBy",
        populate: { path: "user", select: "-password" },
      })
      .populate({
        path: "rejectedBy",
        populate: { path: "user", select: "-password" },
      })
      .sort({ createdAt: -1 });

    return res.json(leaves);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getSchoolLeaves = async (req, res) => {
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
          match: { school: getSchoolId(req.userSchool) },
          populate: [
            { path: "user", select: "-password" },
            { path: "school" },
          ],
        };

    const leaves = await LeaveApplication.find()
      .populate(populateUserSchool)
      .populate({
        path: "approvedBy",
        populate: { path: "user", select: "-password" },
      })
      .populate({
        path: "rejectedBy",
        populate: { path: "user", select: "-password" },
      })
      .sort({ createdAt: -1 });

    const filteredLeaves = leaves.filter((leave) => leave.userSchool !== null);

    return res.json(filteredLeaves);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks = "" } = req.body || {};

    const leave = await LeaveApplication.findById(id).populate({
      path: "userSchool",
      populate: [
        { path: "user", select: "-password" },
        { path: "school" },
      ],
    });

    if (!leave) {
      return res.status(404).json({
        message: "Leave application not found.",
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        message: "Only pending leave applications can be approved.",
      });
    }

    if (!leave.userSchool) {
      return res.status(404).json({
        message: "Employee record for this leave application was not found.",
      });
    }

    if (String(leave.userSchool._id) === String(req.userSchool._id)) {
      return res.status(403).json({
        message: "You cannot approve your own leave application.",
      });
    }

    if (!canAccessSchool(req, leave.userSchool.school)) {
      return res.status(403).json({
        message: "You can only approve leave applications you are authorized to access.",
      });
    }

    if (leave.approverRole !== req.userSchool.role) {
      return res.status(403).json({
        message: "You are not authorized to approve this leave application.",
      });
    }

    const leaveCredit = await LeaveCredit.findOne({
      userSchool: leave.userSchool._id,
    });

    if (!leaveCredit) {
      return res.status(400).json({
        message: "Leave credit record not found for this employee.",
      });
    }

    const creditItem = leaveCredit.credits.find(
      (credit) => credit.leaveType === leave.leaveType
    );

    if (!creditItem) {
      return res.status(400).json({
        message: "This employee has no credit record for this leave type.",
      });
    }

    const remaining =
      Number(creditItem.earned || 0) - Number(creditItem.used || 0);

    if (remaining < Number(leave.totalDays)) {
      return res.status(400).json({
        message: `Insufficient leave credits. Remaining balance is ${remaining}.`,
      });
    }

    creditItem.used = Number(creditItem.used || 0) + Number(leave.totalDays);

    const balanceAfter =
      Number(creditItem.earned || 0) - Number(creditItem.used || 0);

    await leaveCredit.save();

    leave.status = "approved";
    leave.approvedBy = req.userSchool._id;
    leave.approvedAt = new Date();
    leave.remarks = remarks;
    leave.isCreditDeducted = true;

    await leave.save();

    await LeaveLedgerTransaction.create({
      userSchool: leave.userSchool._id,
      school: leave.userSchool.school._id,
      leaveApplication: leave._id,
      leaveType: leave.leaveType,
      transactionDate: leave.approvedAt,
      transactionType: "leave_deduction",
      particulars: `Approved leave: ${leave.reason}`,
      earned: 0,
      usedWithPay: Number(leave.totalDays),
      usedWithoutPay: 0,
      balanceAfter,
      remarks,
      createdBy: req.userSchool._id,
    });

    await syncLeaveCreditsAcrossUserMemberships({
      sourceUserSchoolId: leave.userSchool._id,
      userId: leave.userSchool.user._id,
    });

    const updatedLeave = await LeaveApplication.findById(leave._id)
      .populate({
        path: "userSchool",
        populate: [
          { path: "user", select: "-password" },
          { path: "school" },
        ],
      })
      .populate({
        path: "approvedBy",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .populate({
        path: "rejectedBy",
        populate: {
          path: "user",
          select: "name email",
        },
      });

    return res.json({
      message: "Leave application approved successfully.",
      leave: updatedLeave,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to approve leave application.",
      error: err.message,
    });
  }
};

export const rejectLeave = async (req, res) => {
  try {
    const { remarks = "" } = req.body || {};

    const leave = await LeaveApplication.findById(req.params.id).populate({
      path: "userSchool",
      populate: [
        { path: "user", select: "-password" },
        { path: "school" },
      ],
    });

    if (!leave) {
      return res.status(404).json({
        message: "Leave application not found.",
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        message: "Only pending leave applications can be rejected.",
      });
    }

    if (!leave.userSchool) {
      return res.status(404).json({
        message: "Employee record for this leave application was not found.",
      });
    }

    if (String(leave.userSchool._id) === String(req.userSchool._id)) {
      return res.status(403).json({
        message: "You cannot reject your own leave.",
      });
    }

    if (!canAccessSchool(req, leave.userSchool.school)) {
      return res.status(403).json({
        message: "You can only reject leave applications you are authorized to access.",
      });
    }

    if (leave.approverRole !== req.userSchool.role) {
      return res.status(403).json({
        message: "You are not authorized to reject this leave.",
      });
    }

    leave.status = "rejected";
    leave.rejectedBy = req.userSchool._id;
    leave.rejectedAt = new Date();
    leave.remarks = remarks;

    await leave.save();

    const updatedLeave = await LeaveApplication.findById(leave._id)
      .populate({
        path: "userSchool",
        populate: [
          { path: "user", select: "-password" },
          { path: "school" },
        ],
      })
      .populate({
        path: "approvedBy",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .populate({
        path: "rejectedBy",
        populate: {
          path: "user",
          select: "name email",
        },
      });

    return res.json({
      message: "Leave application rejected successfully.",
      leave: updatedLeave,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getPendingApprovals = async (req, res) => {
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
          match: { school: getSchoolId(req.userSchool) },
          populate: [
            { path: "user", select: "-password" },
            { path: "school" },
          ],
        };

    const leaves = await LeaveApplication.find({
      status: "pending",
      approverRole: req.userSchool.role,
    })
      .populate(populateUserSchool)
      .populate({
        path: "approvedBy",
        populate: { path: "user", select: "-password" },
      })
      .populate({
        path: "rejectedBy",
        populate: { path: "user", select: "-password" },
      })
      .sort({ createdAt: -1 });

    const filteredLeaves = leaves.filter((leave) => leave.userSchool !== null);

    return res.json(filteredLeaves);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};