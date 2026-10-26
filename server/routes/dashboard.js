import express from 'express';
import db from '../db/database.js';
import { workflowService } from '../services/workflowService.js';

const router = express.Router();

router.get('/stats', (req, res) => {
  try {
    // Run automated end-date check periodically on dashboard refresh
    workflowService.checkInternshipEndDates();

    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Total interns
    const totalInterns = db.prepare('SELECT COUNT(*) as count FROM interns').get().count;

    // Tasks allocated
    const tasksAllocated = db.prepare('SELECT COUNT(*) as count FROM allocations').get().count;

    // Reviews scheduled (status = 'REVIEW_SCHEDULED' or 'SCHEDULED')
    const reviewsScheduled = db.prepare(`
      SELECT COUNT(*) as count FROM reviews WHERE status = 'SCHEDULED'
    `).get().count;

    // Pending submissions (allocated but not yet submitted)
    const pendingSubmissions = db.prepare(`
      SELECT COUNT(*) as count FROM allocations WHERE status IN ('REVIEW_SCHEDULED', 'ALLOCATED', 'TASK_EXPLANATION_READY', 'SUBMISSION_PENDING')
    `).get().count;

    // Awaiting reviewer approval (AI analyzed or human review pending)
    const awaitingApproval = db.prepare(`
      SELECT COUNT(*) as count FROM reviews WHERE status = 'AI_ANALYZED' AND human_decision = 'PENDING'
    `).get().count;

    // Completed tasks
    const completedTasks = db.prepare(`
      SELECT COUNT(*) as count FROM allocations WHERE status = 'COMPLETED'
    `).get().count;

    // Internships ending soon (within 7 days)
    const endingSoon = db.prepare(`
      SELECT COUNT(*) as count FROM interns 
      WHERE status NOT IN ('COMPLETED', 'INCOMPLETE_AT_END_DATE')
        AND date(end_date) >= date(?)
        AND date(end_date) <= date(?)
    `).get(todayStr, sevenDaysFromNow).count;

    // Status distribution
    const statusDistribution = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM allocations 
      GROUP BY status
    `).all();

    // Recent activity list
    const recentActivity = db.prepare(`
      SELECT 'email' as type, subject as title, sent_at as timestamp, recipient_email as detail, status
      FROM email_logs
      ORDER BY id DESC
      LIMIT 6
    `).all();

    res.json({
      totalInterns,
      tasksAllocated,
      reviewsScheduled,
      pendingSubmissions,
      awaitingApproval,
      completedTasks,
      endingSoon,
      statusDistribution,
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
