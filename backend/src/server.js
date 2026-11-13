import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load backend/.env reliably, even if the command is launched from the project root.
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
dotenv.config({ path: path.resolve(currentDir, '../.env') });
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoose from 'mongoose';
import profileRoutes from './routes/profileRoutes.js';
import authRoutes from './routes/authRoutes.js';
const app = express();
const port = process.env.PORT || 5000;
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('Set JWT_SECRET to a random secret of at least 32 characters in backend/.env');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'p25-profile-api' }));
app.use('/api/profiles', profileRoutes);
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === 'ValidationError' || error.status === 400) return res.status(400).json({ message: error.message || 'Some profile fields are invalid.' });
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});
try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/p25_marketplace');
  console.log('Connected to MongoDB');
  app.listen(port, () => console.log(`P25 API running on http://localhost:${port}`));
} catch (error) {
  console.error('Could not connect to MongoDB. Check MONGODB_URI in .env.', error.message);
  process.exit(1);
}
