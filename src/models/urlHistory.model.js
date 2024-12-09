import mongoose from "mongoose";

const urltSchema = new mongoose.Schema(
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
    status: {
      type: Boolean,
      required: true,
      default: true,
    },
    isMalicious: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Url", urltSchema);
