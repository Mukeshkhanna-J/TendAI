import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './src/config/db.js';
import { seedDatabase } from './src/seeders/seed.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
const startServer = async () => {
  await connectDB();
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
