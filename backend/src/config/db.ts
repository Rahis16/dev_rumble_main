import mongoose from 'mongoose';

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/malangcode';
  
  try {
    console.log(`Connecting to MongoDB at: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000 // fail fast if not running
    });
    console.log('MongoDB successfully connected.');
  } catch (error) {
    console.error('MongoDB connection failed. MalangCode will operate in Local File Memory Mode only.');
    console.error((error as Error).message);
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
