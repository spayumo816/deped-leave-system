import mongoose from "mongoose";

const leaveApplicationSchema = new mongoose.Schema(
  {
    userSchool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSchool",
      required: true,
    },

    leaveType: {
      type: String,
      required: true,
      enum: [
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
      ],
    },

    approverRole: {
      type: String,
      enum: ["principal", "division_admin"],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    totalDays: {
      type: Number,
      required: true,
      min: 0.5,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSchool",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSchool",
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    isCreditDeducted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

leaveApplicationSchema.index({ userSchool: 1, createdAt: -1 });
leaveApplicationSchema.index({ status: 1 });
leaveApplicationSchema.index({ leaveType: 1 });
leaveApplicationSchema.index({ approverRole: 1 });

const LeaveApplication = mongoose.model(
  "LeaveApplication",
  leaveApplicationSchema
);

export default LeaveApplication;