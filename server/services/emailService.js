import nodemailer from 'nodemailer';
import db from '../db/database.js';
import dotenv from 'dotenv';
dotenv.config();

export class EmailService {
  constructor() {
    this.emailMode = process.env.EMAIL_MODE || 'mock'; // 'mock' or 'smtp'
    this.smtpHost = process.env.SMTP_HOST || '';
    this.smtpPort = process.env.SMTP_PORT || 587;
    this.smtpUser = process.env.SMTP_USER || '';
    this.smtpPass = process.env.SMTP_PASS || '';
    this.fromAddress = process.env.EMAIL_FROM || 'intern-automation@example.com';
    this.supervisorEmail = process.env.SUPERVISOR_EMAIL || 'supervisor@example.com';

    this.transporter = null;
    if (this.emailMode === 'smtp' && this.smtpHost && this.smtpUser) {
      try {
        this.transporter = nodemailer.createTransport({
          host: this.smtpHost,
          port: Number(this.smtpPort),
          secure: Number(this.smtpPort) === 465,
          auth: {
            user: this.smtpUser,
            pass: this.smtpPass
          }
        });
      } catch (err) {
        console.warn('[EmailService] SMTP transporter creation failed:', err.message);
      }
    }
  }

  getIntegrationStatus() {
    return {
      mode: this.emailMode,
      isConfigured: !!(this.smtpHost && this.smtpUser),
      fromAddress: this.fromAddress,
      supervisorEmail: this.supervisorEmail,
      activeMode: (this.emailMode === 'smtp' && this.smtpHost && this.smtpUser) ? 'LIVE_SMTP' : 'MOCK_DEMO_OUTBOX'
    };
  }

  /**
   * Prevents sending duplicate emails for the same event
   */
  isDuplicateEvent(eventFingerprint) {
    const existing = db.prepare('SELECT id FROM email_logs WHERE event_fingerprint = ?').get(eventFingerprint);
    return !!existing;
  }

  /**
   * Internal dispatcher that either logs in mock mode or sends via SMTP
   */
  async sendOrLogEmail({ recipientEmail, recipientName, eventType, eventFingerprint, subject, bodyHtml, bodyText }) {
    // 1. Guard against duplicate events
    if (this.isDuplicateEvent(eventFingerprint)) {
      console.log(`[EmailService] Suppressed duplicate email for event: ${eventFingerprint}`);
      return {
        success: true,
        suppressed: true,
        reason: 'Duplicate event fingerprint detected.',
        eventFingerprint
      };
    }

    let status = 'SENT_MOCK';
    let errorMessage = null;

    // 2. If SMTP is configured and not in mock mode, attempt real delivery
    if (this.emailMode === 'smtp' && this.transporter && !recipientEmail.endsWith('@example.com')) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to: recipientEmail,
          subject,
          text: bodyText,
          html: bodyHtml
        });
        status = 'SENT_SMTP';
      } catch (err) {
        status = 'FAILED';
        errorMessage = err.message;
        console.error(`[EmailService] Failed to send real email to ${recipientEmail}:`, err.message);
      }
    } else {
      // In demo mode or for @example.com addresses, ALWAYS mock
      status = 'SENT_MOCK';
    }

    // 3. Persist email log
    const stmt = db.prepare(`
      INSERT INTO email_logs (
        recipient_email, recipient_name, event_type, event_fingerprint,
        subject, body_html, body_text, status, error_message, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(recipientEmail, recipientName, eventType, eventFingerprint, subject, bodyHtml, bodyText, status, errorMessage);

    return {
      success: status !== 'FAILED',
      status,
      eventFingerprint,
      subject,
      recipientEmail
    };
  }

  /**
   * Task Allocation & Review Scheduled Email
   */
  async sendTaskAllocatedEmail({ intern, task, allocation }) {
    const eventFingerprint = `ALLOC_${allocation.id}_${intern.email}`;
    const subject = `New Task Allocated: ${task.title}`;

    const requirementsList = Array.isArray(task.requirements) 
      ? task.requirements 
      : JSON.parse(task.requirements || '[]');

    const bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0; font-size: 22px;">Welcome to Your Next Company Task</h2>
          <p style="color: #64748b; margin: 4px 0 0; font-size: 14px;">Intern Task Review & Automation System</p>
        </div>

        <p>Hi <strong>${intern.full_name}</strong>,</p>
        <p>You have been assigned a new project: <strong>${task.title}</strong>.</p>

        <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 14px 18px; margin: 18px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 6px; color: #1e293b;">Project Overview:</h4>
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #334155;">${task.description}</p>
        </div>

        <h4 style="color: #0f172a; margin-bottom: 8px;">Key Requirements:</h4>
        <ul style="padding-left: 20px; font-size: 14px; line-height: 1.6; color: #334155;">
          ${requirementsList.map(req => `<li>${req}</li>`).join('')}
        </ul>

        <div style="margin: 16px 0;">
          <p style="margin: 4px 0; font-size: 14px;"><strong>Expected Output:</strong> ${task.expected_output}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Tech Stack:</strong> <code>${task.tech_stack}</code></p>
          ${task.reference_url ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Reference Documentation:</strong> <a href="${task.reference_url}" style="color: #2563eb;">${task.reference_url}</a></p>` : ''}
        </div>

        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 8px; color: #1e40af;">📅 Scheduled Review Appointment</h4>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Review Date:</strong> ${allocation.review_date}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Review Time:</strong> ${allocation.review_time}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Google Meet Link:</strong> <a href="${allocation.meet_link}" style="color: #1d4ed8; font-weight: 600;">${allocation.meet_link}</a></p>
          <p style="margin: 8px 0 0; font-size: 13px; color: #475569;">Please test your microphone and screen sharing before the call.</p>
        </div>

        <h4 style="color: #0f172a; margin-bottom: 6px;">How to Prepare:</h4>
        <p style="font-size: 14px; line-height: 1.5; color: #334155;">
          Submit your work repository link or code excerpt via your intern dashboard prior to the meeting. Our AI review mentor will provide preliminary feedback to ensure you're well-prepared for discussion with your supervisor.
        </p>

        <p style="margin-top: 24px; font-size: 14px; color: #475569;">Best regards,<br><strong>Internship Engineering Mentorship Team</strong></p>
      </div>
    `;

    const bodyText = `Hi ${intern.full_name},
You have been assigned: ${task.title}.
Description: ${task.description}
Expected Output: ${task.expected_output}

Scheduled Review:
Date: ${allocation.review_date} at ${allocation.review_time}
Meet Link: ${allocation.meet_link}

Please submit your work prior to the meeting.`;

    return this.sendOrLogEmail({
      recipientEmail: intern.email,
      recipientName: intern.full_name,
      eventType: 'TASK_ALLOCATED',
      eventFingerprint,
      subject,
      bodyHtml,
      bodyText
    });
  }

  /**
   * Feedback Email for Incomplete Review (Personalized, Constructive, Next Review Scheduled)
   */
  async sendRevisionFeedbackEmail({ intern, task, review, nextReviewDate, nextReviewTime, meetLink, aiAnalysis }) {
    const eventFingerprint = `FEEDBACK_REV_${review.id}_ATTEMPT_${review.attempt_number}`;
    const subject = `Action Required: Revision Feedback for ${task.title} (Attempt #${review.attempt_number})`;

    const completedReqs = (aiAnalysis.requirements_analysis || []).filter(r => r.status === 'Met');
    const incompleteReqs = (aiAnalysis.requirements_analysis || []).filter(r => r.status !== 'Met');

    const bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #b45309; margin: 0; font-size: 22px;">Review Feedback & Improvement Plan</h2>
          <p style="color: #64748b; margin: 4px 0 0; font-size: 14px;">Task: <strong>${task.title}</strong> (Review Attempt #${review.attempt_number})</p>
        </div>

        <p>Hi <strong>${intern.full_name}</strong>,</p>
        <p>Thank you for submitting your work for <strong>${task.title}</strong>. We've reviewed your submission against company requirements and prepared constructive feedback to help you get this across the finish line.</p>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin: 18px 0;">
          <h4 style="margin: 0 0 8px; color: #15803d;">✅ What Was Completed Correctly</h4>
          ${completedReqs.length > 0 ? `
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5; color: #166534;">
              ${completedReqs.map(r => `<li><strong>${r.requirement}</strong><br><span style="font-size: 13px; color: #4b5563;">Evidence: ${r.evidence}</span></li>`).join('')}
            </ul>
          ` : '<p style="margin: 0; font-size: 14px; color: #166534;">Foundational setup started.</p>'}
        </div>

        <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; margin: 18px 0;">
          <h4 style="margin: 0 0 8px; color: #b45309;">⚠️ Areas Needing Revision</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5; color: #78350f;">
            ${incompleteReqs.map(r => `
              <li style="margin-bottom: 10px;">
                <strong>${r.requirement}</strong> [<em>${r.status}</em>]<br>
                <span style="font-size: 13px; color: #92400e;"><strong>Issue:</strong> ${r.explanation}</span><br>
                <span style="font-size: 13px; color: #1e3a8a;"><strong>How to Improve:</strong> ${r.suggested_improvement}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        ${review.human_feedback ? `
          <div style="background-color: #f8fafc; border-left: 4px solid #64748b; padding: 12px 16px; margin: 18px 0;">
            <h4 style="margin: 0 0 6px; color: #0f172a;">Supervisor Notes:</h4>
            <p style="margin: 0; font-size: 14px; color: #334155;">${review.human_feedback}</p>
          </div>
        ` : ''}

        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 8px; color: #1e40af;">📅 Next Review Meeting Scheduled</h4>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Next Review Date:</strong> ${nextReviewDate}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Next Review Time:</strong> ${nextReviewTime}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Google Meet Link:</strong> <a href="${meetLink}" style="color: #1d4ed8; font-weight: 600;">${meetLink}</a></p>
        </div>

        <p style="font-size: 14px; line-height: 1.5; color: #334155;">
          Remember, revisions are a standard part of professional software engineering! Take your time to address each item above and re-submit prior to our next meeting.
        </p>

        <p style="margin-top: 24px; font-size: 14px; color: #475569;">Best regards,<br><strong>Internship Review Committee</strong></p>
      </div>
    `;

    const bodyText = `Hi ${intern.full_name},
Feedback for ${task.title} (Attempt #${review.attempt_number}):
Next Review: ${nextReviewDate} at ${nextReviewTime}
Meet Link: ${meetLink}

Please address the outstanding requirements before the next meeting.`;

    return this.sendOrLogEmail({
      recipientEmail: intern.email,
      recipientName: intern.full_name,
      eventType: 'FEEDBACK_REVISION',
      eventFingerprint,
      subject,
      bodyHtml,
      bodyText
    });
  }

  /**
   * Task Completion Email (Approved!)
   */
  async sendTaskCompletionEmail({ intern, task, review }) {
    const eventFingerprint = `COMPLETE_${task.id}_${intern.email}`;
    const subject = `Congratulations! Task Approved: ${task.title}`;

    const bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #047857; margin: 0; font-size: 22px;">🎉 Task Approved & Completed!</h2>
          <p style="color: #64748b; margin: 4px 0 0; font-size: 14px;">Internship Milestone Verified</p>
        </div>

        <p>Dear <strong>${intern.full_name}</strong>,</p>
        <p>We are delighted to inform you that your submission for <strong>${task.title}</strong> has met all company standards and is officially <strong>APPROVED</strong>!</p>

        <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 18px 0;">
          <h4 style="margin: 0 0 6px; color: #15803d;">Review Outcome: Completed</h4>
          <p style="margin: 0; font-size: 14px; color: #166534;">All company requirements have been verified with supporting evidence. Excellent work adhering to quality standards and iterating diligently.</p>
        </div>

        ${review?.human_feedback ? `
          <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; margin: 18px 0;">
            <h4 style="margin: 0 0 6px; color: #0f172a;">Supervisor Endorsement:</h4>
            <p style="margin: 0; font-size: 14px; color: #334155;">${review.human_feedback}</p>
          </div>
        ` : ''}

        <p style="font-size: 14px; color: #334155;">Your supervisor has recorded this milestone in your internship profile. Keep up the fantastic momentum!</p>
        <p style="margin-top: 24px; font-size: 14px; color: #475569;">Warm congratulations,<br><strong>Internship Engineering Leadership</strong></p>
      </div>
    `;

    const bodyText = `Congratulations ${intern.full_name}! Your task "${task.title}" has been approved and completed.`;

    return this.sendOrLogEmail({
      recipientEmail: intern.email,
      recipientName: intern.full_name,
      eventType: 'TASK_COMPLETED',
      eventFingerprint,
      subject,
      bodyHtml,
      bodyText
    });
  }

  /**
   * Supervisor Alert: Internship End Date Reached without Task Completion
   * Stops further automated review scheduling.
   */
  async sendSupervisorEndDateAlert({ intern, task, allocation }) {
    const eventFingerprint = `ALERT_END_DATE_${allocation.id}_${intern.email}`;
    const subject = `⚠️ Supervisor Action Required: Internship End Date Reached for ${intern.full_name}`;

    const bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #fecaca; border-radius: 12px; color: #1e293b; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #b91c1c; margin: 0; font-size: 20px;">Internship End Date Reached Without Completion</h2>
          <p style="color: #64748b; margin: 4px 0 0; font-size: 14px;">Automated Review Scheduling Halted</p>
        </div>

        <p>Dear Supervisor,</p>
        <p>This is an automated notification from the Intern Automation System. The scheduled internship end date has been reached for intern <strong>${intern.full_name}</strong> (${intern.email}) while their assigned task remains incomplete.</p>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 18px 0;">
          <h4 style="margin: 0 0 8px; color: #991b1b;">Record Summary:</h4>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Intern Name:</strong> ${intern.full_name}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${intern.email}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Task Title:</strong> ${task.title}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Internship End Date:</strong> ${intern.end_date}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Current Status:</strong> <span style="color: #b91c1c; font-weight: bold;">INCOMPLETE_AT_END_DATE</span></p>
        </div>

        <p style="font-size: 14px; color: #475569;">
          <strong>Action Taken:</strong> The system has stopped automated review retries and feedback scheduling for this assignment. No further emails will be sent to the intern.
        </p>
        <p style="font-size: 14px; color: #475569;">
          Please conduct a final offboarding interview or adjust the intern's completion status manually in the management dashboard if an extension was approved.
        </p>

        <p style="margin-top: 24px; font-size: 14px; color: #64748b;">Internship Automation Daemon</p>
      </div>
    `;

    const bodyText = `Supervisor Alert: Intern ${intern.full_name} (${intern.email}) has reached internship end date ${intern.end_date} without completing ${task.title}. Automated review scheduling stopped.`;

    return this.sendOrLogEmail({
      recipientEmail: this.supervisorEmail,
      recipientName: 'Supervisor',
      eventType: 'SUPERVISOR_END_DATE_ALERT',
      eventFingerprint,
      subject,
      bodyHtml,
      bodyText
    });
  }
}

export const emailService = new EmailService();
