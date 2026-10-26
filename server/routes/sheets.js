import express from 'express';
import { sheetsService } from '../services/sheetsService.js';

const router = express.Router();

// Get export data in JSON format
router.get('/export-data', (req, res) => {
  try {
    const data = sheetsService.getInternsExportData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download CSV for Google Sheets
router.get('/download-csv', (req, res) => {
  try {
    const csv = sheetsService.generateCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="intern_automation_roster.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sync to Google Sheets
router.post('/sync', async (req, res) => {
  try {
    const result = await sheetsService.syncToGoogleSheets();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Integration status
router.get('/status', (req, res) => {
  res.json(sheetsService.getIntegrationStatus());
});

export default router;
