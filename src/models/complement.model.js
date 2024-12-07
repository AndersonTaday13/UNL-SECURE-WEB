import mongoose from "mongoose";

const complementSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: Boolean,
      required: true,
      default: true,
    },
    interval: {
      type: String,
      required: true,
      enum: ["DEFAULT", "1", "2", "3", "4", "5"],
      default: "DEFAULT",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Complement", complementSchema);
