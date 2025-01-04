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
      trim: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para optimizar las consultas
urlSchema.index({ token: 1, url: 1 }, { unique: true }); // Evitar duplicados por token y url
urlSchema.index({ token: 1, active: 1 }); // Consulta por token y estado activo

export default mongoose.model("UrlHistory", urlSchema);
