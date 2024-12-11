import mongoose from "mongoose";
import "dotenv/config";

export const connectDB = async () => {
  try {
    mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to database");
  } catch (error) {
    console.error("Error connecting to database");
  }
};
