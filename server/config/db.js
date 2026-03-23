import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not defined');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    bufferCommands: false,
  });

  console.log('✅ MongoDB connected');
};
