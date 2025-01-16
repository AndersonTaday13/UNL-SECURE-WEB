import mongoose from "mongoose";
import "dotenv/config";

export const connectDB = async () => {
  try {
    mongoose.connect(process.env.MONGODB_URL_DOCKER);
    console.log("Connected to database");
  } catch (error) {
    console.error("Error connecting to database");
  }
};
