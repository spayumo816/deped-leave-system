import UserSchool from "../models/UserSchool.js";
import LeaveApplication from "../models/LeaveApplication.js";
import LeaveCredit from "../models/LeaveCredit.js";

const formatCredits = (leaveCredit) => {
  if (!leaveCredit) return [];

  return leaveCredit.credits.map((credit) => ({
    leaveType: credit.leaveType,
    earned: credit.earned,
    used: credit.used,
    remaining: credit.earned - credit.used,
    remarks: credit.remarks,
  }));
};

const getSchoolId = (userSchool) => {
  if (!userSchool?.school) return "";
  if (userSchool.school._id) return String(userSchool.school._id);
  return String(userSchool.school);
};

export const getDashboard = async (req, res) => {
  try {
    const role = req.userSchool.role;
    const schoolId = getSchoolId(req.userSchool);

    const myCredit = await LeaveCredit.findOne({
      userSchool: req.userSchool._id,
    });

    const myLeaves = await LeaveApplication.find({
      userSchool: req.userSchool._id,
    }).sort({ createdAt: -1 });

    const myPendingLeaves = myLeaves.filter(
      (leave) => leave.status === "pending"
    ).length;

    const myApprovedLeaves = myLeaves.filter(
      (leave) => leave.status === "approved"
    ).length;

    const myRejectedLeaves = myLeaves.filter(
      (leave) => leave.status === "rejected"
    ).length;

    let schoolStats = null;
    let recentLeaves = [];

    if (role === "division_admin") {
      const employees = await UserSchool.find({
        isActive: true,
      });

      const leaves = await LeaveApplication.find()
        .populate({
          path: "userSchool",
          populate: [
            { path: "user", select: "-password" },
            { path: "school" },
          ],
        })
        .sort({ createdAt: -1 });

      const divisionLeaves = leaves.filter(
        (leave) => leave.userSchool !== null
      );

      schoolStats = {
        totalEmployees: employees.length,
        pendingLeaves: divisionLeaves.filter(
          (leave) => leave.status === "pending"
        ).length,
        approvedLeaves: divisionLeaves.filter(
          (leave) => leave.status === "approved"
        ).length,
        rejectedLeaves: divisionLeaves.filter(
          (leave) => leave.status === "rejected"
        ).length,
      };

      recentLeaves = divisionLeaves.slice(0, 5);
    }

    if (role === "admin_officer" || role === "principal") {
      const employees = await UserSchool.find({
        school: schoolId,
        isActive: true,
      });

      const leaves = await LeaveApplication.find()
        .populate({
          path: "userSchool",
          match: { school: schoolId },
          populate: [
            { path: "user", select: "-password" },
            { path: "school" },
          ],
        })
        .sort({ createdAt: -1 });

      const schoolLeaves = leaves.filter(
        (leave) => leave.userSchool !== null
      );

      schoolStats = {
        totalEmployees: employees.length,
        pendingLeaves: schoolLeaves.filter(
          (leave) => leave.status === "pending"
        ).length,
        approvedLeaves: schoolLeaves.filter(
          (leave) => leave.status === "approved"
        ).length,
        rejectedLeaves: schoolLeaves.filter(
          (leave) => leave.status === "rejected"
        ).length,
      };

      recentLeaves = schoolLeaves.slice(0, 5);
    }

    return res.json({
      role,
      user: req.user,
      school: req.userSchool.school,
      myStats: {
        pendingLeaves: myPendingLeaves,
        approvedLeaves: myApprovedLeaves,
        rejectedLeaves: myRejectedLeaves,
      },
      myCredits: formatCredits(myCredit),
      schoolStats,
      recentLeaves,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};