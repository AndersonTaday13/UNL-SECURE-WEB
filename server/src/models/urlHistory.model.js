import mongoose from "mongoose";

const urlSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    isMalicious: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

urlSchema.index({ token: 1, active: 1, isMalicious: 1 });

export default mongoose.model("Urls-historial", urlSchema);
