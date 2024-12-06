import mongoose from "mongoose";

const urlSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["maliciosa", "benigna", "pendiente"],
      default: "pendiente",
    },
    descripción: {
      type: String,
      required: true,
      default: "Sin descripción",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Url-report", urlSchema);
