import mongoose from 'mongoose';

/**
 * Connect to MongoDB database using Mongoose. Falls back to a throwaway
 * in-memory MongoDB instance in non-production environments when no real
 * MongoDB server is reachable, so the project can be demoed without
 * requiring a local MongoDB install.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tendai';
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
  }

  if (process.env.NODE_ENV === 'production') return;

  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri('tendai'));
    console.log('No local MongoDB found — connected to an in-memory MongoDB instance for this demo run (data resets on restart).');
  } catch (fallbackError) {
    console.error(`In-memory MongoDB fallback failed: ${fallbackError.message}`);
  }
};

export default connectDB;
