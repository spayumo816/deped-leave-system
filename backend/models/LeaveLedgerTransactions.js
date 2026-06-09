import mongoose from "mongoose";

const leaveLedgerTransactionSchema = new mongoose.Schema(
  {
    userSchool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSchool",
      required: true,
    },

    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    leaveApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveApplication",
      default: null,
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

    transactionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    transactionType: {
      type: String,
      required: true,
      enum: [
        "beginning_balance",
        "earned_credit",
        "leave_deduction",
        "adjustment",
      ],
    },

    particulars: {
      type: String,
      required: true,
      trim: true,
    },

    earned: {
      type: Number,
      default: 0,
      min: 0,
    },

    usedWithPay: {
      type: Number,
      default: 0,
      min: 0,
    },

    usedWithoutPay: {
      type: Number,
      default: 0,
      min: 0,
    },

    balanceAfter: {
      type: Number,
      required: true,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSchool",
      required: true,
    },
  },
  { timestamps: true }
);

leaveLedgerTransactionSchema.index({
  userSchool: 1,
  leaveType: 1,
  transactionDate: 1,
});

leaveLedgerTransactionSchema.index({
  school: 1,
  transactionDate: -1,
});

leaveLedgerTransactionSchema.index({
  leaveApplication: 1,
});

const LeaveLedgerTransaction = mongoose.model(
  "LeaveLedgerTransaction",
  leaveLedgerTransactionSchema
);

export default LeaveLedgerTransaction;