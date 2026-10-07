const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clinic_platform';
    console.log(`[DB] Attempting MongoDB connection to ${uri}...`);
    
    // Set short timeout for local connection attempt
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[DB] Successfully connected to MongoDB database at ${mongoose.connection.host}:${mongoose.connection.port}`);
  } catch (err) {
    console.warn(`[DB] Primary MongoDB connection failed (${err.message}). Spawning MongoMemoryServer fallback...`);
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[DB] Connected to MongoMemoryServer in-memory DB at ${memoryUri}`);
    } catch (memErr) {
      console.error('[DB] MongoMemoryServer initialization error:', memErr);
      process.exit(1);
    }
  }
};

const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

module.exports = { connectDB, closeDB };
