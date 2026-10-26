import express from 'express';
import db from '../db/database.js';
import { aiService } from '../services/aiService.js';

const router = express.Router();

router.get('/task/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const { internEmail } = req.query;

    let explanation;
    if (internEmail) {
      explanation = db.prepare(`
        SELECT * FROM task_explanations 
        WHERE task_id = ? AND intern_email = ? 
        ORDER BY id DESC LIMIT 1
      `).get(Number(taskId), internEmail);
    }

    if (!explanation) {
      explanation = db.prepare(`
        SELECT * FROM task_explanations 
        WHERE task_id = ? 
        ORDER BY id DESC LIMIT 1
      `).get(Number(taskId));
    }

    if (!explanation) {
      return res.status(404).json({ error: 'No mentor explanation found for this task.' });
    }

    res.json(explanation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { taskId, internEmail } = req.body;
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(taskId));
    if (!task) return res.status(404).json({ error: 'Task not found' });

    let internName = 'Intern';
    if (internEmail) {
      const intern = db.prepare('SELECT full_name FROM interns WHERE email = ?').get(internEmail);
      if (intern) internName = intern.full_name;
    }

    const mentorContent = await aiService.generateTaskExplanation({ task, internName });

    if (internEmail) {
      db.prepare(`
        INSERT INTO task_explanations (task_id, intern_email, mentor_content)
        VALUES (?, ?, ?)
      `).run(Number(taskId), internEmail, mentorContent);
    }

    res.json({
      taskId: Number(taskId),
      internEmail,
      mentorContent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
