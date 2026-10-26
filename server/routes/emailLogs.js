import express from 'express';
import db from '../db/database.js';
import { emailService } from '../services/emailService.js';

const router = express.Router();

// Get all email logs
router.get('/', (req, res) => {
  try {
    const { recipientEmail, eventType, limit = 100 } = req.query;
    let query = 'SELECT * FROM email_logs WHERE 1=1';
    const params = [];

    if (recipientEmail && recipientEmail !== 'undefined' && recipientEmail !== 'null' && recipientEmail.trim()) {
      query += ' AND recipient_email = ?';
      params.push(recipientEmail.trim());
    }
    if (eventType && eventType !== 'undefined' && eventType !== 'null' && eventType !== 'ALL' && eventType.trim()) {
      query += ' AND event_type = ?';
      params.push(eventType.trim());
    }

    query += ' ORDER BY id DESC LIMIT ?';
    params.push(Number(limit));

    const logs = db.prepare(query).all(...params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single email preview by ID
router.get('/:id', (req, res) => {
  try {
    const email = db.prepare('SELECT * FROM email_logs WHERE id = ?').get(Number(req.params.id));
    if (!email) return res.status(404).json({ error: 'Email log not found' });
    res.json(email);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get email service status
router.get('/status/integration', (req, res) => {
  res.json(emailService.getIntegrationStatus());
});

export default router;
