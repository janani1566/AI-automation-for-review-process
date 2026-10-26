import express from 'express';
import db from '../db/database.js';
import { workflowService } from '../services/workflowService.js';

const router = express.Router();

// Get all allocations
router.get('/', (req, res) => {
  try {
    const allocations = db.prepare(`
      SELECT a.*, 
             i.full_name as intern_name, 
             t.title as task_title,
             (SELECT COUNT(*) FROM reviews r WHERE r.allocation_id = a.id) as review_count,
             (SELECT r.id FROM reviews r WHERE r.allocation_id = a.id ORDER BY r.attempt_number DESC LIMIT 1) as latest_review_id
      FROM allocations a
      JOIN interns i ON a.intern_email = i.email
      JOIN tasks t ON a.task_id = t.id
      ORDER BY a.id DESC
    `).all();

    res.json(allocations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create task allocation
router.post('/', async (req, res) => {
  try {
    const { internEmail, taskId, reviewDate, reviewTime, meetLink } = req.body;

    if (!internEmail || !taskId || !reviewDate || !reviewTime) {
      return res.status(400).json({ error: 'internEmail, taskId, reviewDate, and reviewTime are required.' });
    }

    const result = await workflowService.allocateTask({
      internEmail: internEmail.trim().toLowerCase(),
      taskId: Number(taskId),
      reviewDate,
      reviewTime,
      meetLink
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
