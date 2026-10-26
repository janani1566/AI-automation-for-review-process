import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { initDatabase } from './db/database.js';
import { seedDemoData } from './db/seed.js';

import dashboardRoutes from './routes/dashboard.js';
import internsRoutes from './routes/interns.js';
import tasksRoutes from './routes/tasks.js';
import allocationsRoutes from './routes/allocations.js';
import reviewsRoutes from './routes/reviews.js';
import explanationsRoutes from './routes/explanations.js';
import emailLogsRoutes from './routes/emailLogs.js';
import sheetsRoutes from './routes/sheets.js';
import demoRoutes from './routes/demo.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize DB and Seed Data
initDatabase();
seedDemoData(false); // seed if empty

// Mount API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/interns', internsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/allocations', allocationsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/explanations', explanationsRoutes);
app.use('/api/emails', emailLogsRoutes);
app.use('/api/sheets', sheetsRoutes);
app.use('/api/demo', demoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AI Intern Task Review & Automation Backend'
  });
});

// Serve frontend dist if available
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
  console.log(`[Static] Serving production frontend build from ${CLIENT_DIST}`);
}

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Intern Automation Server running on http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
