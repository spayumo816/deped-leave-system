import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: true,
      trim: true,
    },

    schoolId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    schoolType: {
      type: String,
      enum: ["school", "division_office"],
      default: "school",
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

const School = mongoose.model("School", schoolSchema);

export default School;