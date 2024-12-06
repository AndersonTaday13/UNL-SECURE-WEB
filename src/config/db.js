import mongoose, { mongo } from "mongoose";

export const connectDB = async () => {
  try {
    mongoose.connect("mongodb://localhost:27017/secureweb");
    console.log("Connected to database");
  } catch (error) {
    console.error("Error connecting to database");
  }
};
