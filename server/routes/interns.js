import express from 'express';
import db from '../db/database.js';

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Get all interns with filters & search
router.get('/', (req, res) => {
  try {
    const { search, status, taskId, limit = 200, offset = 0 } = req.query;

    let query = `
      SELECT 
        i.*,
        t.title as current_task_title,
        a.id as allocation_id,
        a.status as allocation_status,
        a.review_date,
        a.review_time,
        a.meet_link,
        (SELECT COUNT(*) FROM reviews r WHERE r.intern_email = i.email) as review_attempts
      FROM interns i
      LEFT JOIN tasks t ON i.current_task_id = t.id
      LEFT JOIN allocations a ON a.intern_email = i.email AND a.task_id = i.current_task_id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      query += ` AND (i.full_name LIKE ? OR i.email LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (status && status !== 'ALL') {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    if (taskId) {
      query += ` AND i.current_task_id = ?`;
      params.push(taskId);
    }

    query += ` ORDER BY i.id DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const interns = db.prepare(query).all(...params);

    const totalCountQuery = `
      SELECT COUNT(*) as total FROM interns i WHERE 1=1
      ${search ? ` AND (i.full_name LIKE '%${search}%' OR i.email LIKE '%${search}%')` : ''}
      ${status && status !== 'ALL' ? ` AND i.status = '${status}'` : ''}
    `;
    const total = db.prepare(totalCountQuery).get().total;

    res.json({ interns, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single intern by ID or Email
router.get('/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;
    let intern;
    if (isNaN(identifier)) {
      intern = db.prepare('SELECT * FROM interns WHERE email = ?').get(identifier);
    } else {
      intern = db.prepare('SELECT * FROM interns WHERE id = ?').get(Number(identifier));
    }

    if (!intern) return res.status(404).json({ error: 'Intern not found' });
    res.json(intern);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new intern
router.post('/', (req, res) => {
  try {
    const { full_name, email, start_date, end_date, current_task_id = null, status = 'ACTIVE' } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Both start date and end date are required.' });
    }

    if (start_date > end_date) {
      return res.status(400).json({ error: 'Start date cannot be after end date.' });
    }

    // Check duplicate email
    const existing = db.prepare('SELECT id FROM interns WHERE email = ?').get(email.trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ error: `An intern with email '${email.trim()}' already exists.` });
    }

    const insert = db.prepare(`
      INSERT INTO interns (full_name, email, current_task_id, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      full_name.trim(),
      email.trim().toLowerCase(),
      current_task_id ? Number(current_task_id) : null,
      start_date,
      end_date,
      status
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      start_date,
      end_date,
      status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update intern
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, start_date, end_date, status, current_task_id } = req.body;

    const existing = db.prepare('SELECT * FROM interns WHERE id = ?').get(Number(id));
    if (!existing) return res.status(404).json({ error: 'Intern not found' });

    if (email && email.trim().toLowerCase() !== existing.email) {
      if (!EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }
      const duplicate = db.prepare('SELECT id FROM interns WHERE email = ? AND id != ?').get(email.trim().toLowerCase(), Number(id));
      if (duplicate) {
        return res.status(409).json({ error: `Email '${email.trim()}' is already used by another intern.` });
      }
    }

    db.prepare(`
      UPDATE interns
      SET full_name = coalesce(?, full_name),
          email = coalesce(?, email),
          start_date = coalesce(?, start_date),
          end_date = coalesce(?, end_date),
          status = coalesce(?, status),
          current_task_id = coalesce(?, current_task_id)
      WHERE id = ?
    `).run(
      full_name ? full_name.trim() : null,
      email ? email.trim().toLowerCase() : null,
      start_date || null,
      end_date || null,
      status || null,
      current_task_id !== undefined ? current_task_id : null,
      Number(id)
    );

    const updated = db.prepare('SELECT * FROM interns WHERE id = ?').get(Number(id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import Interns from CSV Text
router.post('/import-csv', (req, res) => {
  try {
    const { csvText } = req.body;
    if (!csvText || !csvText.trim()) {
      return res.status(400).json({ error: 'CSV content is empty.' });
    }

    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must contain at least a header row and 1 data row.' });
    }

    const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    const nameIdx = header.findIndex(h => h.includes('name'));
    const emailIdx = header.findIndex(h => h.includes('email'));
    const startIdx = header.findIndex(h => h.includes('start'));
    const endIdx = header.findIndex(h => h.includes('end'));
    const statusIdx = header.findIndex(h => h.includes('status'));

    if (nameIdx === -1 || emailIdx === -1) {
      return res.status(400).json({ error: 'CSV must contain "Full Name" and "Email" columns.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const defaultEnd = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO interns (full_name, email, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      const name = cols[nameIdx];
      const email = cols[emailIdx]?.toLowerCase();
      const start = (startIdx !== -1 && cols[startIdx]) ? cols[startIdx] : todayStr;
      const end = (endIdx !== -1 && cols[endIdx]) ? cols[endIdx] : defaultEnd;
      const status = (statusIdx !== -1 && cols[statusIdx]) ? cols[statusIdx].toUpperCase() : 'ACTIVE';

      if (!name || !email || !EMAIL_REGEX.test(email)) {
        skippedCount++;
        errors.push(`Row ${i + 1}: Invalid name or email`);
        continue;
      }

      const res = insertStmt.run(name, email, start, end, status);
      if (res.changes > 0) {
        importedCount++;
      } else {
        skippedCount++; // Duplicate email skipped
      }
    }

    res.json({
      success: true,
      importedCount,
      skippedCount,
      errors: errors.slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
