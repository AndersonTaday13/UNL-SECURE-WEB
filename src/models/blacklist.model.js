import mongoose from "mongoose";

const blackListSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    cont: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Blacklist", blackListSchema);
