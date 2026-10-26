import express from 'express';
import { seedDemoData, seed100Interns } from '../db/seed.js';
import { aiService } from '../services/aiService.js';
import { emailService } from '../services/emailService.js';
import { sheetsService } from '../services/sheetsService.js';

const router = express.Router();

// Reset database to standard seed data
router.post('/reset', (req, res) => {
  try {
    seedDemoData(true);
    res.json({ success: true, message: 'Database reset to initial demo state.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed 100 interns for scalability benchmark
router.post('/seed-100', (req, res) => {
  try {
    const count = seed100Interns();
    res.json({ success: true, message: `Added ${count} demo interns to the system (total 100+).` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get overall system status & integrations
router.get('/integrations-status', (req, res) => {
  res.json({
    ai: aiService.getIntegrationStatus(),
    email: emailService.getIntegrationStatus(),
    sheets: sheetsService.getIntegrationStatus(),
    meet: {
      provider: 'Google Meet',
      isConfigured: true,
      activeMode: 'AUTOMATIC_MEET_URL_GENERATOR',
      note: 'Generates valid Google Meet URLs and stores them against review appointments.'
    }
  });
});

export default router;
