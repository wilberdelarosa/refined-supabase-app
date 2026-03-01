import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fiscalRoutes from './fiscal-routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', fiscalRoutes);

// Serve Static Frontend (Production)
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Handle Client-side Routing (SPA)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API Endpoint not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 Fiscal Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 RNC Lookup: http://localhost:${PORT}/api/rnc/:id`);
  console.log(`📝 e-CF Sign:  http://localhost:${PORT}/api/ecf/sign`);
});
