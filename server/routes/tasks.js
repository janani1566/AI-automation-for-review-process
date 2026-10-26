import express from 'express';
import db from '../db/database.js';

const router = express.Router();

// Get all tasks
router.get('/', (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT t.*, 
             (SELECT COUNT(*) FROM allocations a WHERE a.task_id = t.id) as allocation_count
      FROM tasks t
      ORDER BY t.id ASC
    `).all();

    const formatted = tasks.map(t => ({
      ...t,
      requirements: Array.isArray(t.requirements) ? t.requirements : JSON.parse(t.requirements || '[]')
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get task by ID
router.get('/:id', (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(req.params.id));
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.requirements = Array.isArray(task.requirements) ? task.requirements : JSON.parse(task.requirements || '[]');
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create task
router.post('/', (req, res) => {
  try {
    const { title, description, requirements, expected_output, tech_stack, reference_url = '', review_duration_mins = 30 } = req.body;

    if (!title || !description || !expected_output || !tech_stack) {
      return res.status(400).json({ error: 'Title, description, expected output, and tech stack are required.' });
    }

    const reqArray = Array.isArray(requirements) 
      ? requirements.filter(r => r && r.trim())
      : (requirements ? requirements.split('\n').map(r => r.trim()).filter(Boolean) : []);

    if (reqArray.length === 0) {
      return res.status(400).json({ error: 'At least one requirement is required.' });
    }

    const insert = db.prepare(`
      INSERT INTO tasks (title, description, requirements, expected_output, tech_stack, reference_url, review_duration_mins)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      title.trim(),
      description.trim(),
      JSON.stringify(reqArray),
      expected_output.trim(),
      tech_stack.trim(),
      reference_url ? reference_url.trim() : null,
      Number(review_duration_mins) || 30
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      title: title.trim(),
      description: description.trim(),
      requirements: reqArray,
      expected_output: expected_output.trim(),
      tech_stack: tech_stack.trim(),
      reference_url,
      review_duration_mins
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, requirements, expected_output, tech_stack, reference_url, review_duration_mins } = req.body;

    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(id));
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    let reqJson = undefined;
    if (requirements !== undefined) {
      const reqArray = Array.isArray(requirements) 
        ? requirements.filter(r => r && r.trim())
        : (requirements ? requirements.split('\n').map(r => r.trim()).filter(Boolean) : []);
      reqJson = JSON.stringify(reqArray);
    }

    db.prepare(`
      UPDATE tasks
      SET title = coalesce(?, title),
          description = coalesce(?, description),
          requirements = coalesce(?, requirements),
          expected_output = coalesce(?, expected_output),
          tech_stack = coalesce(?, tech_stack),
          reference_url = coalesce(?, reference_url),
          review_duration_mins = coalesce(?, review_duration_mins)
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      description ? description.trim() : null,
      reqJson,
      expected_output ? expected_output.trim() : null,
      tech_stack ? tech_stack.trim() : null,
      reference_url !== undefined ? reference_url : null,
      review_duration_mins ? Number(review_duration_mins) : null,
      Number(id)
    );

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(id));
    updated.requirements = JSON.parse(updated.requirements || '[]');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
