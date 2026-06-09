import mongoose from "mongoose";

const creditItemSchema = new mongoose.Schema(
  {
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

    earned: {
      type: Number,
      default: 0,
    },

    used: {
      type: Number,
      default: 0,
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const leaveCreditSchema = new mongoose.Schema(
  {
    userSchool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSchool",
      required: true,
      unique: true,
    },

    credits: {
      type: [creditItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const LeaveCredit = mongoose.model(
  "LeaveCredit",
  leaveCreditSchema
);

export default LeaveCredit;