import db from '../db/database.js';
import { emailService } from './emailService.js';
import { aiService } from './aiService.js';

export class WorkflowService {
  /**
   * Helper to check if a given date is today or past
   */
  isDatePast(dateString) {
    if (!dateString) return false;
    const target = new Date(dateString + 'T23:59:59');
    const now = new Date();
    return target < now;
  }

  /**
   * Evaluates all allocations for interns whose end date has passed,
   * transitioning incomplete assignments to INCOMPLETE_AT_END_DATE and notifying supervisor.
   */
  checkInternshipEndDates() {
    const todayStr = new Date().toISOString().split('T')[0];

    const expiredAllocations = db.prepare(`
      SELECT a.*, i.full_name as intern_name, i.email as intern_email, i.end_date as intern_end_date,
             t.title as task_title, t.description as task_desc, t.requirements as task_reqs, t.expected_output as task_output
      FROM allocations a
      JOIN interns i ON a.intern_email = i.email
      JOIN tasks t ON a.task_id = t.id
      WHERE a.status NOT IN ('COMPLETED', 'INCOMPLETE_AT_END_DATE')
        AND date(a.internship_end_date) < date(?)
    `).all(todayStr);

    const updated = [];

    for (const alloc of expiredAllocations) {
      // Transition allocation
      db.prepare(`UPDATE allocations SET status = 'INCOMPLETE_AT_END_DATE' WHERE id = ?`).run(alloc.id);
      db.prepare(`UPDATE interns SET status = 'INCOMPLETE_AT_END_DATE' WHERE email = ?`).run(alloc.intern_email);
      db.prepare(`UPDATE reviews SET status = 'INCOMPLETE_AT_END_DATE' WHERE allocation_id = ? AND status NOT IN ('APPROVED')`).run(alloc.id);

      // Send supervisor alert email
      emailService.sendSupervisorEndDateAlert({
        intern: {
          full_name: alloc.intern_name,
          email: alloc.intern_email,
          end_date: alloc.intern_end_date
        },
        task: {
          title: alloc.task_title
        },
        allocation: alloc
      });

      updated.push({
        allocationId: alloc.id,
        internEmail: alloc.intern_email,
        taskTitle: alloc.task_title
      });
    }

    return updated;
  }

  /**
   * Step 1: Allocate a task to an intern
   */
  async allocateTask({ internEmail, taskId, reviewDate, reviewTime, meetLink }) {
    // 1. Validate intern exists
    const intern = db.prepare('SELECT * FROM interns WHERE email = ?').get(internEmail);
    if (!intern) {
      throw new Error(`Intern with email ${internEmail} not found.`);
    }

    // 2. Validate task exists
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found.`);
    }

    // 3. Validate dates
    const todayStr = new Date().toISOString().split('T')[0];
    if (this.isDatePast(intern.end_date)) {
      throw new Error(`Cannot allocate task: Intern's end date (${intern.end_date}) has already passed.`);
    }

    if (reviewDate > intern.end_date) {
      throw new Error(`Review date (${reviewDate}) cannot be scheduled after internship end date (${intern.end_date}).`);
    }

    const finalMeetLink = meetLink && meetLink.trim() ? meetLink.trim() : `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;

    // 4. Create allocation record
    const insertAlloc = db.prepare(`
      INSERT INTO allocations (intern_email, task_id, allocation_date, review_date, review_time, meet_link, internship_end_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ALLOCATED')
    `);
    const allocResult = insertAlloc.run(internEmail, taskId, todayStr, reviewDate, reviewTime, finalMeetLink, intern.end_date);
    const allocationId = allocResult.lastInsertRowid;

    // Update intern's current task
    db.prepare('UPDATE interns SET current_task_id = ?, status = ? WHERE email = ?').run(taskId, 'ACTIVE', internEmail);

    // 5. Generate Mentor Task Explanation
    const mentorContent = await aiService.generateTaskExplanation({ task, internName: intern.full_name });
    db.prepare(`
      INSERT INTO task_explanations (task_id, intern_email, mentor_content)
      VALUES (?, ?, ?)
    `).run(taskId, internEmail, mentorContent);

    // Update status to TASK_EXPLANATION_READY
    db.prepare(`UPDATE allocations SET status = 'TASK_EXPLANATION_READY' WHERE id = ?`).run(allocationId);

    // 6. Create initial Review record (Attempt #1)
    const insertReview = db.prepare(`
      INSERT INTO reviews (allocation_id, intern_email, task_id, attempt_number, review_date, review_time, meet_link, status)
      VALUES (?, ?, ?, 1, ?, ?, ?, 'SCHEDULED')
    `);
    const reviewResult = insertReview.run(allocationId, internEmail, taskId, reviewDate, reviewTime, finalMeetLink);

    // Update allocation to REVIEW_SCHEDULED
    db.prepare(`UPDATE allocations SET status = 'REVIEW_SCHEDULED' WHERE id = ?`).run(allocationId);

    // 7. Send Task Allocated & Review Scheduled Email
    await emailService.sendTaskAllocatedEmail({
      intern,
      task,
      allocation: {
        id: allocationId,
        review_date: reviewDate,
        review_time: reviewTime,
        meet_link: finalMeetLink
      }
    });

    return {
      allocationId,
      reviewId: reviewResult.lastInsertRowid,
      status: 'REVIEW_SCHEDULED',
      mentorContent
    };
  }

  /**
   * Step 2: Intern or Supervisor submits work for review
   */
  async submitWork({ reviewId, submissionType = 'TEXT', submissionContent }) {
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId);
    if (!review) throw new Error(`Review with ID ${reviewId} not found.`);

    if (!submissionContent || !submissionContent.trim()) {
      throw new Error('Submission content cannot be empty.');
    }

    db.prepare(`
      UPDATE reviews
      SET submission_type = ?, submission_content = ?, status = 'SUBMITTED', updated_at = datetime('now')
      WHERE id = ?
    `).run(submissionType, submissionContent.trim(), reviewId);

    db.prepare(`UPDATE allocations SET status = 'SUBMISSION_PENDING' WHERE id = ?`).run(review.allocation_id);

    return { success: true, reviewId, status: 'SUBMITTED' };
  }

  /**
   * Step 3: Run AI Review Comparison
   */
  async runAIReview({ reviewId }) {
    const review = db.prepare(`
      SELECT r.*, t.title as task_title, t.description as task_desc, t.requirements as task_reqs, t.expected_output as task_output,
             i.full_name as intern_name, i.email as intern_email
      FROM reviews r
      JOIN tasks t ON r.task_id = t.id
      JOIN interns i ON r.intern_email = i.email
      WHERE r.id = ?
    `).get(reviewId);

    if (!review) throw new Error(`Review with ID ${reviewId} not found.`);

    const task = {
      title: review.task_title,
      description: review.task_desc,
      requirements: review.task_reqs,
      expected_output: review.task_output
    };

    // Get previous feedback if attempt > 1
    let previousFeedback = null;
    if (review.attempt_number > 1) {
      const prev = db.prepare(`
        SELECT human_feedback, ai_analysis_json
        FROM reviews
        WHERE allocation_id = ? AND attempt_number = ?
      `).get(review.allocation_id, review.attempt_number - 1);
      if (prev) {
        previousFeedback = prev.human_feedback || 'Revision requested in previous attempt.';
      }
    }

    // Call AI Service
    const aiAnalysis = await aiService.analyzeSubmission({
      task,
      submissionContent: review.submission_content,
      previousFeedback
    });

    const aiJsonStr = JSON.stringify(aiAnalysis);

    db.prepare(`
      UPDATE reviews
      SET ai_analysis_json = ?, status = 'AI_ANALYZED', updated_at = datetime('now')
      WHERE id = ?
    `).run(aiJsonStr, reviewId);

    db.prepare(`UPDATE allocations SET status = 'HUMAN_REVIEW_PENDING' WHERE id = ?`).run(review.allocation_id);

    return aiAnalysis;
  }

  /**
   * Step 4: Human Reviewer Decision
   * - Approved: Complete task, notify intern
   * - Revision Required: Retry review loop, check end-date, schedule next review, notify intern
   */
  async processHumanDecision({ reviewId, decision, feedback = '', nextReviewDate = null, nextReviewTime = null }) {
    const review = db.prepare(`
      SELECT r.*, a.internship_end_date, a.id as allocation_id,
             t.id as task_id, t.title as task_title, t.requirements as task_reqs, t.expected_output as task_output,
             i.full_name as intern_name, i.email as intern_email, i.end_date as intern_end_date
      FROM reviews r
      JOIN allocations a ON r.allocation_id = a.id
      JOIN tasks t ON r.task_id = t.id
      JOIN interns i ON r.intern_email = i.email
      WHERE r.id = ?
    `).get(reviewId);

    if (!review) throw new Error(`Review with ID ${reviewId} not found.`);

    const intern = {
      full_name: review.intern_name,
      email: review.intern_email,
      end_date: review.intern_end_date
    };
    const task = {
      id: review.task_id,
      title: review.task_title,
      requirements: review.task_reqs,
      expected_output: review.task_output
    };

    if (decision === 'APPROVED') {
      // 1. Mark review approved
      db.prepare(`
        UPDATE reviews
        SET human_decision = 'APPROVED', human_feedback = ?, status = 'APPROVED', updated_at = datetime('now')
        WHERE id = ?
      `).run(feedback, reviewId);

      // 2. Mark allocation completed
      db.prepare(`UPDATE allocations SET status = 'COMPLETED' WHERE id = ?`).run(review.allocation_id);

      // 3. Mark intern completed if appropriate
      db.prepare(`UPDATE interns SET status = 'COMPLETED' WHERE email = ?`).run(review.intern_email);

      // 4. Send Completion Email
      await emailService.sendTaskCompletionEmail({
        intern,
        task,
        review: { human_feedback: feedback }
      });

      return {
        status: 'COMPLETED',
        message: `Task "${task.title}" approved successfully! Completion email dispatched.`
      };
    } else if (decision === 'REVISION_REQUESTED') {
      // Check if internship end date has passed or will pass
      const todayStr = new Date().toISOString().split('T')[0];
      const isPastEndDate = this.isDatePast(review.internship_end_date);

      if (isPastEndDate) {
        // Internship has ended! Stop retry loop!
        db.prepare(`
          UPDATE reviews
          SET human_decision = 'REVISION_REQUESTED', human_feedback = ?, status = 'INCOMPLETE_AT_END_DATE', updated_at = datetime('now')
          WHERE id = ?
        `).run(feedback, reviewId);

        db.prepare(`UPDATE allocations SET status = 'INCOMPLETE_AT_END_DATE' WHERE id = ?`).run(review.allocation_id);
        db.prepare(`UPDATE interns SET status = 'INCOMPLETE_AT_END_DATE' WHERE email = ?`).run(review.intern_email);

        // Alert supervisor
        await emailService.sendSupervisorEndDateAlert({
          intern,
          task,
          allocation: { id: review.allocation_id }
        });

        return {
          status: 'INCOMPLETE_AT_END_DATE',
          message: `Internship end date (${review.internship_end_date}) has passed. Further reviews stopped and supervisor alerted.`
        };
      }

      // Validate next review date
      if (!nextReviewDate) {
        throw new Error('A next review date is required when requesting revisions.');
      }

      if (nextReviewDate > review.internship_end_date) {
        // Next review date exceeds internship duration!
        db.prepare(`
          UPDATE reviews
          SET human_decision = 'REVISION_REQUESTED', human_feedback = ?, status = 'INCOMPLETE_AT_END_DATE', updated_at = datetime('now')
          WHERE id = ?
        `).run(feedback, reviewId);

        db.prepare(`UPDATE allocations SET status = 'INCOMPLETE_AT_END_DATE' WHERE id = ?`).run(review.allocation_id);
        db.prepare(`UPDATE interns SET status = 'INCOMPLETE_AT_END_DATE' WHERE email = ?`).run(review.intern_email);

        await emailService.sendSupervisorEndDateAlert({
          intern,
          task,
          allocation: { id: review.allocation_id }
        });

        return {
          status: 'INCOMPLETE_AT_END_DATE',
          message: `The proposed next review date (${nextReviewDate}) exceeds the internship end date (${review.internship_end_date}). Automated reviews terminated and supervisor alerted.`
        };
      }

      const finalNextTime = nextReviewTime || '14:00';
      const newMeetLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;

      // Update current review
      db.prepare(`
        UPDATE reviews
        SET human_decision = 'REVISION_REQUESTED', human_feedback = ?,
            next_review_date = ?, next_review_time = ?,
            status = 'REVISION_REQUESTED', updated_at = datetime('now')
        WHERE id = ?
      `).run(feedback, nextReviewDate, finalNextTime, reviewId);

      // Create Next Review Attempt
      const nextAttempt = review.attempt_number + 1;
      const insertNext = db.prepare(`
        INSERT INTO reviews (
          allocation_id, intern_email, task_id, attempt_number,
          review_date, review_time, meet_link, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'SCHEDULED')
      `);
      const nextReviewResult = insertNext.run(
        review.allocation_id,
        review.intern_email,
        review.task_id,
        nextAttempt,
        nextReviewDate,
        finalNextTime,
        newMeetLink
      );

      // Update allocation status to REVIEW_SCHEDULED
      db.prepare(`
        UPDATE allocations
        SET review_date = ?, review_time = ?, meet_link = ?, status = 'REVIEW_SCHEDULED'
        WHERE id = ?
      `).run(nextReviewDate, finalNextTime, newMeetLink, review.allocation_id);

      // Parse AI analysis for personalized feedback email
      let aiAnalysisObj = {};
      try {
        aiAnalysisObj = JSON.parse(review.ai_analysis_json || '{}');
      } catch (e) {}

      // Send feedback email
      await emailService.sendRevisionFeedbackEmail({
        intern,
        task,
        review: {
          id: reviewId,
          attempt_number: review.attempt_number,
          human_feedback: feedback
        },
        nextReviewDate,
        nextReviewTime: finalNextTime,
        meetLink: newMeetLink,
        aiAnalysis: aiAnalysisObj
      });

      return {
        status: 'REVISION_REQUESTED',
        nextAttemptNumber: nextAttempt,
        nextReviewId: nextReviewResult.lastInsertRowid,
        nextReviewDate,
        message: `Revision feedback saved. Next review attempt #${nextAttempt} scheduled for ${nextReviewDate} at ${finalNextTime}.`
      };
    } else {
      throw new Error(`Invalid human review decision: ${decision}`);
    }
  }
}

export const workflowService = new WorkflowService();
