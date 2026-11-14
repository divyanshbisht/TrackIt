const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trackit';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 4000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    isConnected = false;
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${mongoUri}.`);
    console.warn(`[MongoDB Warning] Running in memory/mock persistence mode for local dev if MongoDB is unavailable. Error: ${error.message}`);
  }
};

const getDBStatus = () => isConnected;

module.exports = { connectDB, getDBStatus };
