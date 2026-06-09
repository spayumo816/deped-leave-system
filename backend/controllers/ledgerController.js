import LeaveCredit from "../models/LeaveCredit.js";
import LeaveLedgerTransaction from "../models/LeaveLedgerTransactions.js";
import UserSchool from "../models/UserSchool.js";

const leaveTypes = [
  "vacation_leave",
  "sick_leave",
  "vacation_service_credit",
  "special_privilege_leave",
  "force_leave",
  "maternity_leave",
  "paternity_leave",
  "solo_parent_leave",
  "study_leave",
  "rehabilitation_leave",
  "special_leave_benefit_for_women",
  "adoption_leave",
  "other",
];

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

const normalizeLeaveType = (leaveType, personnelType) => {
  if (personnelType !== "teaching" && leaveType === "vacation_service_credit") {
    return "vacation_leave";
  }

  return leaveType;
};

const getCreditItem = (leaveCredit, leaveType) => {
  return leaveCredit.credits.find((credit) => credit.leaveType === leaveType);
};

const cloneCredits = (credits = []) => {
  return credits.map((credit) => ({
    leaveType: credit.leaveType,
    earned: Number(credit.earned || 0),
    used: Number(credit.used || 0),
    remarks: credit.remarks || "",
  }));
};

const getMembershipIdsByUser = async (userId) => {
  const memberships = await UserSchool.find({
    user: userId,
    isActive: true,
  }).select("_id");

  return memberships.map((membership) => membership._id);
};

const syncLeaveCreditsAcrossUserMemberships = async ({
  sourceUserSchoolId,
  userId,
}) => {
  const sourceLeaveCredit = await LeaveCredit.findOne({
    userSchool: sourceUserSchoolId,
  });

  if (!sourceLeaveCredit) return;

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

export const getEmployeeLedger = async (req, res) => {
  try {
    const { userSchoolId } = req.params;

    const targetUserSchool = await UserSchool.findById(userSchoolId)
      .populate("user", "name email")
      .populate("school");

    if (!targetUserSchool) {
      return res.status(404).json({
        message: "Employee record not found.",
      });
    }

    if (req.userSchool.role === "teacher") {
      if (String(targetUserSchool._id) !== String(req.userSchool._id)) {
        return res.status(403).json({
          message: "Teachers can only view their own leave ledger.",
        });
      }
    }

    if (!canAccessSchool(req, targetUserSchool.school)) {
      return res.status(403).json({
        message:
          "You can only view leave ledger records you are authorized to access.",
      });
    }

    const membershipIds = await getMembershipIdsByUser(targetUserSchool.user._id);

    const leaveCredit = await LeaveCredit.findOne({
      userSchool: userSchoolId,
    });

    const transactions = await LeaveLedgerTransaction.find({
      userSchool: { $in: membershipIds },
    })
      .populate({
        path: "createdBy",
        select: "role position employeeNumber",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .populate({
        path: "userSchool",
        populate: [
          { path: "user", select: "name email" },
          { path: "school" },
        ],
      })
      .populate("leaveApplication")
      .sort({ transactionDate: 1, createdAt: 1 });

    res.json({
      userSchool: targetUserSchool,
      balances: leaveCredit?.credits || [],
      transactions,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to load leave ledger.",
      error: err.message,
    });
  }
};

export const addEarnedCredit = async (req, res) => {
  try {
    const { userSchoolId } = req.params;
    const { leaveType, earned, transactionDate, particulars, remarks } =
      req.body;

    if (req.userSchool.role !== "admin_officer") {
      return res.status(403).json({
        message: "Only Admin Officers can manage leave ledger credits.",
      });
    }

    const targetUserSchool = await UserSchool.findById(userSchoolId);

    if (!targetUserSchool) {
      return res.status(404).json({
        message: "Employee record not found.",
      });
    }

    if (!canAccessSchool(req, targetUserSchool.school)) {
      return res.status(403).json({
        message: "You can only add ledger entries you are authorized to access.",
      });
    }

    const finalLeaveType = normalizeLeaveType(
      leaveType,
      targetUserSchool.personnelType
    );

    if (!leaveTypes.includes(finalLeaveType)) {
      return res.status(400).json({
        message: "Invalid leave type.",
      });
    }

    const earnedValue = Number(earned);

    if (!earnedValue || earnedValue <= 0) {
      return res.status(400).json({
        message: "Earned credit must be greater than zero.",
      });
    }

    let leaveCredit = await LeaveCredit.findOne({
      userSchool: userSchoolId,
    });

    if (!leaveCredit) {
      leaveCredit = await LeaveCredit.create({
        userSchool: userSchoolId,
        credits: [],
      });
    }

    let creditItem = getCreditItem(leaveCredit, finalLeaveType);

    if (!creditItem) {
      leaveCredit.credits.push({
        leaveType: finalLeaveType,
        earned: 0,
        used: 0,
        remarks: "",
      });

      creditItem = getCreditItem(leaveCredit, finalLeaveType);
    }

    creditItem.earned = Number(creditItem.earned || 0) + earnedValue;

    if (remarks !== undefined) {
      creditItem.remarks = remarks;
    }

    const balanceAfter =
      Number(creditItem.earned || 0) - Number(creditItem.used || 0);

    await leaveCredit.save();

    const ledgerTransaction = await LeaveLedgerTransaction.create({
      userSchool: userSchoolId,
      school: targetUserSchool.school,
      leaveType: finalLeaveType,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      transactionType: "earned_credit",
      particulars: particulars || "Earned leave credit",
      earned: earnedValue,
      usedWithPay: 0,
      usedWithoutPay: 0,
      balanceAfter,
      remarks: remarks || "",
      createdBy: req.userSchool._id,
    });

    await syncLeaveCreditsAcrossUserMemberships({
      sourceUserSchoolId: userSchoolId,
      userId: targetUserSchool.user,
    });

    const populatedTransaction = await LeaveLedgerTransaction.findById(
      ledgerTransaction._id
    ).populate({
      path: "createdBy",
      select: "role position employeeNumber",
      populate: {
        path: "user",
        select: "name email",
      },
    });

    res.status(201).json({
      message: "Earned leave credit added to ledger.",
      leaveCredit,
      transaction: populatedTransaction,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to add earned leave credit.",
      error: err.message,
    });
  }
};

export const createBeginningBalance = async (req, res) => {
  try {
    const { userSchoolId } = req.params;
    const { leaveType, beginningBalance, earned, transactionDate, remarks } =
      req.body || {};

    if (req.userSchool.role !== "admin_officer") {
      return res.status(403).json({
        message: "Only Admin Officers can create beginning balances.",
      });
    }

    const targetUserSchool = await UserSchool.findById(userSchoolId);

    if (!targetUserSchool) {
      return res.status(404).json({
        message: "Employee record not found.",
      });
    }

    if (!canAccessSchool(req, targetUserSchool.school)) {
      return res.status(403).json({
        message:
          "You can only create beginning balances you are authorized to access.",
      });
    }

    const finalLeaveType = normalizeLeaveType(
      leaveType,
      targetUserSchool.personnelType
    );

    if (!leaveTypes.includes(finalLeaveType)) {
      return res.status(400).json({
        message: "Invalid leave type.",
      });
    }

    const balanceValue = Number(beginningBalance ?? earned);

    if (Number.isNaN(balanceValue) || balanceValue < 0) {
      return res.status(400).json({
        message: "Beginning balance must be zero or greater.",
      });
    }

    const membershipIds = await getMembershipIdsByUser(targetUserSchool.user);

    const existingBeginningBalance = await LeaveLedgerTransaction.findOne({
      userSchool: { $in: membershipIds },
      leaveType: finalLeaveType,
      transactionType: "beginning_balance",
    });

    if (existingBeginningBalance) {
      return res.status(400).json({
        message:
          "Beginning balance already exists for this employee and leave type.",
      });
    }

    let leaveCredit = await LeaveCredit.findOne({
      userSchool: userSchoolId,
    });

    if (!leaveCredit) {
      leaveCredit = await LeaveCredit.create({
        userSchool: userSchoolId,
        credits: [],
      });
    }

    let creditItem = getCreditItem(leaveCredit, finalLeaveType);

    if (!creditItem) {
      leaveCredit.credits.push({
        leaveType: finalLeaveType,
        earned: 0,
        used: 0,
        remarks: "",
      });

      creditItem = getCreditItem(leaveCredit, finalLeaveType);
    }

    const currentUsed = Number(creditItem.used || 0);
    creditItem.earned = balanceValue + currentUsed;

    if (remarks !== undefined) {
      creditItem.remarks = remarks;
    }

    await leaveCredit.save();

    const ledgerTransaction = await LeaveLedgerTransaction.create({
      userSchool: userSchoolId,
      school: targetUserSchool.school,
      leaveType: finalLeaveType,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      transactionType: "beginning_balance",
      particulars: "Beginning balance",
      earned: balanceValue,
      usedWithPay: 0,
      usedWithoutPay: 0,
      balanceAfter: balanceValue,
      remarks: remarks || "",
      createdBy: req.userSchool._id,
    });

    await syncLeaveCreditsAcrossUserMemberships({
      sourceUserSchoolId: userSchoolId,
      userId: targetUserSchool.user,
    });

    const populatedTransaction = await LeaveLedgerTransaction.findById(
      ledgerTransaction._id
    ).populate({
      path: "createdBy",
      select: "role position employeeNumber",
      populate: {
        path: "user",
        select: "name email",
      },
    });

    res.status(201).json({
      message: "Beginning balance created successfully.",
      leaveCredit,
      transaction: populatedTransaction,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to create beginning balance.",
      error: err.message,
    });
  }
};