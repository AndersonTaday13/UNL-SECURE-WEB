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
      type: Number,
      required: true,
      enum: [0.03, 1, 2, 3, 4, 5],
      default: 0.03,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Complement", complementSchema);
