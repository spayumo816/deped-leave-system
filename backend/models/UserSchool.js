import mongoose from "mongoose";

const userSchoolSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    employeeNumber: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: [
        "division_admin",
        "admin_officer",
        "principal",
        "teacher",
      ],
      required: true,
    },

    personnelType: {
      type: String,
      enum: ["teaching", "non_teaching"],
      required: true,
    },

    position: {
      type: String,
      default: "",
      trim: true,
    },

    employmentStatus: {
      type: String,
      enum: [
        "permanent",
        "provisional",
        "contractual",
        "job_order",
        "substitute",
      ],
      default: "permanent",
    },

    dateHired: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchoolSchema.index(
  {
    user: 1,
    school: 1,
  },
  {
    unique: true,
  }
);

userSchoolSchema.index(
  {
    school: 1,
    employeeNumber: 1,
  },
  {
    unique: true,
  }
);

const UserSchool = mongoose.model(
  "UserSchool",
  userSchoolSchema
);

export default UserSchool;