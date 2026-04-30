const mongoose = require("mongoose");

const connectDb = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is required in environment variables");
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");
};

module.exports = connectDb;
