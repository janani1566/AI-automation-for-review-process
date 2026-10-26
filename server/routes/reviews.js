import express from 'express';
import db from '../db/database.js';
import { workflowService } from '../services/workflowService.js';

const router = express.Router();

// Get all reviews with rich details
router.get('/', (req, res) => {
  try {
    const { status, internEmail } = req.query;

    let query = `
      SELECT r.*,
             i.full_name as intern_name, i.end_date as internship_end_date,
             t.title as task_title, t.description as task_description,
             t.requirements as task_requirements, t.expected_output as task_expected_output,
             t.tech_stack as task_tech_stack
      FROM reviews r
      JOIN interns i ON r.intern_email = i.email
      JOIN tasks t ON r.task_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL' && status !== 'undefined' && status !== 'null' && status.trim()) {
      query += ` AND r.status = ?`;
      params.push(status.trim());
    }
    if (internEmail && internEmail !== 'undefined' && internEmail !== 'null' && internEmail.trim()) {
      query += ` AND r.intern_email = ?`;
      params.push(internEmail.trim());
    }

    query += ` ORDER BY r.id DESC`;

    const reviews = db.prepare(query).all(...params);

    const formatted = reviews.map(r => ({
      ...r,
      task_requirements: JSON.parse(r.task_requirements || '[]'),
      ai_analysis: r.ai_analysis_json ? JSON.parse(r.ai_analysis_json) : null
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single review by ID with side-by-side details
router.get('/:id', (req, res) => {
  try {
    const review = db.prepare(`
      SELECT r.*,
             i.full_name as intern_name, i.end_date as internship_end_date, i.start_date as internship_start_date,
             t.title as task_title, t.description as task_description,
             t.requirements as task_requirements, t.expected_output as task_expected_output,
             t.tech_stack as task_tech_stack, t.reference_url as task_reference_url,
             a.status as allocation_status
      FROM reviews r
      JOIN interns i ON r.intern_email = i.email
      JOIN tasks t ON r.task_id = t.id
      JOIN allocations a ON r.allocation_id = a.id
      WHERE r.id = ?
    `).get(Number(req.params.id));

    if (!review) return res.status(404).json({ error: 'Review not found' });

    // Fetch previous review attempts for timeline
    const history = db.prepare(`
      SELECT id, attempt_number, review_date, review_time, status, human_decision, human_feedback, created_at
      FROM reviews
      WHERE allocation_id = ?
      ORDER BY attempt_number ASC
    `).all(review.allocation_id);

    res.json({
      ...review,
      task_requirements: JSON.parse(review.task_requirements || '[]'),
      ai_analysis: review.ai_analysis_json ? JSON.parse(review.ai_analysis_json) : null,
      history
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit work for a review
router.post('/:id/submit', async (req, res) => {
  try {
    const { submissionType = 'TEXT', submissionContent } = req.body;
    const result = await workflowService.submitWork({
      reviewId: Number(req.params.id),
      submissionType,
      submissionContent
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Run AI review analysis
router.post('/:id/ai-analyze', async (req, res) => {
  try {
    const analysis = await workflowService.runAIReview({
      reviewId: Number(req.params.id)
    });
    res.json({ success: true, analysis });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Submit human decision (Approve or Request Revision)
router.post('/:id/decision', async (req, res) => {
  try {
    const { decision, feedback, nextReviewDate, nextReviewTime } = req.body;

    if (!['APPROVED', 'REVISION_REQUESTED'].includes(decision)) {
      return res.status(400).json({ error: "Decision must be 'APPROVED' or 'REVISION_REQUESTED'." });
    }

    const result = await workflowService.processHumanDecision({
      reviewId: Number(req.params.id),
      decision,
      feedback,
      nextReviewDate,
      nextReviewTime
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
