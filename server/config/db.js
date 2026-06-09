import mongoose from "mongoose";

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("DB connected");
  } catch (error) {
    console.log("DB Error:", error.message);
    process.exit(1); // server band kar de agar DB fail ho
  }
};

export default connectDb;