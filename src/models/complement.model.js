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
      enum: [
        "DEFAULT",
        "1 minuto(s)",
        "2 minuto(s)",
        "3 minuto(s)",
        "4 minuto(s)",
        "5 minuto(s)",
      ],
      default: "DEFAULT",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Complement", complementSchema);
