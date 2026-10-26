import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Clock, 
  Calendar, 
  Video, 
  Save, 
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  Send
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

export default function ReviewStudio({ reviewId, onBack, onComplete }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);

  // Submission Editing
  const [submissionContent, setSubmissionContent] = useState('');
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);
  const [savingSubmission, setSavingSubmission] = useState(false);

  // Human Decision Form
  const tomorrow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [decision, setDecision] = useState('REVISION_REQUESTED');
  const [humanFeedback, setHumanFeedback] = useState('');
  const [nextReviewDate, setNextReviewDate] = useState(tomorrow);
  const [nextReviewTime, setNextReviewTime] = useState('14:00');
  const [actionMessage, setActionMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchReviewDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getReviewById(reviewId);
      setReview(data);
      setSubmissionContent(data.submission_content || '');
      if (data.human_feedback) setHumanFeedback(data.human_feedback);
      if (data.next_review_date) setNextReviewDate(data.next_review_date);
      if (data.next_review_time) setNextReviewTime(data.next_review_time);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reviewId) fetchReviewDetails();
  }, [reviewId]);

  const handleSaveSubmission = async () => {
    try {
      setSavingSubmission(true);
      await api.submitWork(reviewId, {
        submissionType: 'TEXT',
        submissionContent
      });
      setIsEditingSubmission(false);
      fetchReviewDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingSubmission(false);
    }
  };

  const handleRunAIReview = async () => {
    try {
      setAiLoading(true);
      setErrorMessage('');
      const res = await api.runAIReview(reviewId);
      fetchReviewDetails();
      setActionMessage({ type: 'success', text: 'AI analysis completed and saved!' });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmitHumanDecision = async (e) => {
    e.preventDefault();
    try {
      setDecisionLoading(true);
      setErrorMessage('');
      const res = await api.submitHumanDecision(reviewId, {
        decision,
        feedback: humanFeedback,
        nextReviewDate: decision === 'REVISION_REQUESTED' ? nextReviewDate : null,
        nextReviewTime: decision === 'REVISION_REQUESTED' ? nextReviewTime : null
      });

      setActionMessage({ type: 'success', text: res.message });
      fetchReviewDetails();
      if (onComplete) onComplete();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setDecisionLoading(false);
    }
  };

  if (loading && !review) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading Review Studio...</div>;
  }

  if (!review) {
    return (
      <div className="page-body">
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={14} /> Back to Reviews
        </button>
        <div style={{ padding: '40px', color: '#ef4444' }}>Review not found.</div>
      </div>
    );
  }

  const ai = review.ai_analysis || null;
  const isPastEndDate = review.internship_end_date && new Date(review.internship_end_date) < new Date();
  const isCompleted = review.status === 'APPROVED' || review.human_decision === 'APPROVED';
  const isTerminated = review.status === 'INCOMPLETE_AT_END_DATE';

  return (
    <div className="page-body">
      {/* Top Navigation & Context Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={14} /> Back to All Reviews
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Review Status:</span>
          <StatusBadge status={review.status} />
          <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '10px' }}>Attempt:</span>
          <span style={{ fontWeight: 700, fontSize: '13px', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
            #{review.attempt_number}
          </span>
        </div>
      </div>

      {/* Review Header Card */}
      <div className="table-card" style={{ padding: '20px 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Review Studio • Side-by-Side Comparison
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
              {review.task_title}
            </h2>
            <div style={{ fontSize: '13.5px', color: '#475569' }}>
              Intern: <strong>{review.intern_name}</strong> &lt;{review.intern_email}&gt;
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <div style={{ fontSize: '12.5px', color: '#64748b' }}>
              Review Meeting: <strong>{review.review_date} at {review.review_time}</strong>
            </div>
            <a 
              href={review.meet_link} 
              target="_blank" 
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
            >
              <Video size={14} /> Open Google Meet
            </a>
            <div style={{ fontSize: '11.5px', color: isPastEndDate ? '#dc2626' : '#64748b' }}>
              Internship End Date: <strong>{review.internship_end_date}</strong> {isPastEndDate && '(Ended)'}
            </div>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="alert-box alert-info">
          <CheckCircle2 size={18} />
          <div>{actionMessage.text}</div>
        </div>
      )}

      {errorMessage && (
        <div className="alert-box alert-danger">
          <AlertTriangle size={18} />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Side-by-Side Inspection Panels */}
      <div className="review-studio-split" style={{ marginBottom: '24px' }}>
        {/* Left: Original Company Requirements */}
        <div className="studio-panel">
          <div className="studio-panel-header">
            <span className="studio-panel-title">
              <ShieldCheck size={16} color="#2563eb" />
              Original Company Requirements (Source of Truth)
            </span>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              {review.task_requirements.length} Requirements
            </span>
          </div>

          <div className="studio-panel-body">
            <div style={{ marginBottom: '14px', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              {review.task_description}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '8px', textTransform: 'uppercase' }}>
                Requirements:
              </div>
              {review.task_requirements.map((req, idx) => (
                <div key={idx} className="requirement-box">
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
                    <span style={{ color: '#2563eb', marginRight: '6px' }}>#{idx + 1}</span>
                    {req}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontSize: '12.5px' }}>
              <div style={{ marginBottom: '6px' }}>
                <strong style={{ color: '#64748b' }}>Expected Output:</strong>
                <p style={{ color: '#0f172a', margin: '2px 0' }}>{review.task_expected_output}</p>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Required Tech:</strong>
                <code style={{ display: 'block', marginTop: '2px', color: '#0f172a' }}>{review.task_tech_stack}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Intern Submitted Work */}
        <div className="studio-panel">
          <div className="studio-panel-header">
            <span className="studio-panel-title">
              <Clock size={16} color="#059669" />
              Intern Submission Evidence
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isEditingSubmission ? (
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditingSubmission(true)}
                  disabled={isCompleted || isTerminated}
                >
                  Edit Evidence
                </button>
              ) : (
                <button 
                  className="btn btn-success btn-sm"
                  onClick={handleSaveSubmission}
                  disabled={savingSubmission}
                >
                  <Save size={13} /> {savingSubmission ? 'Saving...' : 'Save Evidence'}
                </button>
              )}
            </div>
          </div>

          <div className="studio-panel-body">
            {!isEditingSubmission ? (
              review.submission_content ? (
                <div className="code-viewer">
                  {review.submission_content}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <p style={{ marginBottom: '12px' }}>No submission evidence provided yet.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setIsEditingSubmission(true)}>
                    Enter Submission Text / Links
                  </button>
                </div>
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
                <textarea 
                  className="form-textarea"
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '12.5px', resize: 'none' }}
                  placeholder="Paste repository links, pull request URLs, or submitted code excerpts here..."
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => setIsEditingSubmission(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center Action: Run AI Analysis Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0' }}>
        <button 
          className="btn btn-primary btn-lg"
          onClick={handleRunAIReview}
          disabled={aiLoading || !review.submission_content || isCompleted || isTerminated}
          style={{ boxShadow: 'var(--shadow-md)', minWidth: '280px' }}
        >
          <Sparkles size={18} />
          {aiLoading ? 'AI Evaluating Requirements...' : '⚡ Run AI Review Comparison'}
        </button>
      </div>

      {/* AI Structured Analysis Results Section */}
      {ai && (
        <div className="ai-results-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#2563eb" />
                AI Requirement-by-Requirement Analysis
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>
                {ai.summary}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', color: '#64748b' }}>AI Recommendation:</span>
              <span className={`badge ${ai.recommendation === 'Ready for human approval' ? 'badge-completed' : 'badge-revision'}`}>
                {ai.recommendation}
              </span>
            </div>
          </div>

          {/* Requirement Status Cards Grid */}
          <div className="ai-req-grid">
            {(ai.requirements_analysis || []).map((item, idx) => {
              const statusClass = item.status === 'Met' ? 'met' : item.status === 'Partially Met' ? 'partially' : item.status === 'Missing' ? 'missing' : 'unverifiable';
              const reqBadgeClass = item.status === 'Met' ? 'req-met' : item.status === 'Partially Met' ? 'req-partially' : item.status === 'Missing' ? 'req-missing' : 'req-unverifiable';

              return (
                <div key={idx} className={`ai-req-card ${statusClass}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                      <span style={{ color: '#2563eb', marginRight: '6px' }}>#{idx + 1}</span>
                      {item.requirement}
                    </div>
                    <span className={`req-badge ${reqBadgeClass}`}>
                      {item.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '12.5px', marginTop: '8px' }}>
                    <div style={{ backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                        Observed Evidence:
                      </span>
                      <span style={{ color: '#0f172a' }}>{item.evidence || 'None found'}</span>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                        Analysis & Issue:
                      </span>
                      <span style={{ color: '#334155' }}>{item.explanation}</span>
                    </div>
                  </div>

                  {item.suggested_improvement && item.status !== 'Met' && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '12px', color: '#1e40af' }}>
                      <strong>Suggested Improvement:</strong> {item.suggested_improvement}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Strengths & Errors Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px 18px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#15803d', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> Confirmed Strengths
              </h4>
              <ul style={{ paddingLeft: '18px', fontSize: '12.5px', color: '#166534', lineHeight: 1.5 }}>
                {(ai.strengths || []).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#b91c1c', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} /> Important Errors & Gaps
              </h4>
              <ul style={{ paddingLeft: '18px', fontSize: '12.5px', color: '#991b1b', lineHeight: 1.5 }}>
                {(ai.important_errors || []).length > 0 ? (
                  ai.important_errors.map((e, i) => <li key={i}>{e}</li>)
                ) : (
                  <li>No critical runtime errors detected in provided submission text.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Human Reviewer Decision Card */}
      <div className="table-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
          Human Reviewer Final Decision
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>
          In accordance with company policy, AI recommendations require an authorized human supervisor's review before completion or retry scheduling.
        </p>

        {isCompleted ? (
          <div className="alert-box alert-info">
            <CheckCircle2 size={20} />
            <div>
              <strong>This assignment is APPROVED and COMPLETED.</strong> A completion email has been transmitted to {review.intern_name}.
            </div>
          </div>
        ) : isTerminated ? (
          <div className="alert-box alert-danger">
            <XCircle size={20} />
            <div>
              <strong>Assignment Terminated:</strong> The internship end date has passed. Automated retries have halted and the supervisor has been alerted.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitHumanDecision}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <label 
                style={{ 
                  border: `2px solid ${decision === 'APPROVED' ? '#10b981' : '#e2e8f0'}`,
                  backgroundColor: decision === 'APPROVED' ? '#f0fdf4' : '#ffffff',
                  padding: '16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <input 
                  type="radio" 
                  name="decision" 
                  value="APPROVED" 
                  checked={decision === 'APPROVED'}
                  onChange={() => setDecision('APPROVED')} 
                />
                <div>
                  <div style={{ fontWeight: 700, color: '#065f46', fontSize: '14px' }}>Approve Task (Mark Completed)</div>
                  <div style={{ fontSize: '12px', color: '#047857' }}>All requirements verified. Dispatches completion email.</div>
                </div>
              </label>

              <label 
                style={{ 
                  border: `2px solid ${decision === 'REVISION_REQUESTED' ? '#f59e0b' : '#e2e8f0'}`,
                  backgroundColor: decision === 'REVISION_REQUESTED' ? '#fffbeb' : '#ffffff',
                  padding: '16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <input 
                  type="radio" 
                  name="decision" 
                  value="REVISION_REQUESTED" 
                  checked={decision === 'REVISION_REQUESTED'}
                  onChange={() => setDecision('REVISION_REQUESTED')} 
                />
                <div>
                  <div style={{ fontWeight: 700, color: '#92400e', fontSize: '14px' }}>Request Revisions (Schedule Next Review)</div>
                  <div style={{ fontSize: '12px', color: '#b45309' }}>Sends personalized feedback & schedules Attempt #{review.attempt_number + 1}.</div>
                </div>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Supervisor Feedback & Guidance for Intern</label>
              <textarea 
                className="form-textarea"
                rows="3"
                placeholder="Add personalized encouraging comments or specific technical hints for the intern..."
                value={humanFeedback}
                onChange={(e) => setHumanFeedback(e.target.value)}
              />
            </div>

            {decision === 'REVISION_REQUESTED' && (
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', marginBottom: '10px' }}>
                  Schedule Next Review Meeting (Attempt #{review.attempt_number + 1}):
                </h4>
                <div className="form-row">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Next Review Date *</label>
                    <input 
                      type="date"
                      className="form-input"
                      value={nextReviewDate}
                      onChange={(e) => setNextReviewDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Next Review Time *</label>
                    <input 
                      type="time"
                      className="form-input"
                      value={nextReviewTime}
                      onChange={(e) => setNextReviewTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div style={{ fontSize: '11.5px', color: '#b45309', marginTop: '8px' }}>
                  ⚠️ Automated check: If the next review date exceeds the internship end date ({review.internship_end_date}), the system will stop scheduling and notify the supervisor.
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className={`btn ${decision === 'APPROVED' ? 'btn-success' : 'btn-primary'}`}
              disabled={decisionLoading}
              style={{ minWidth: '220px' }}
            >
              <Send size={15} />
              {decisionLoading ? 'Processing Decision...' : decision === 'APPROVED' ? 'Confirm Approval & Complete' : 'Submit Revisions & Dispatch Email'}
            </button>
          </form>
        )}
      </div>

      {/* Review History Timeline */}
      {review.history && review.history.length > 0 && (
        <div className="table-card" style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
            Review History Timeline for this Assignment
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {review.history.map((hist) => (
              <div 
                key={hist.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: hist.id === review.id ? '#eff6ff' : '#f8fafc',
                  border: `1px solid ${hist.id === review.id ? '#bfdbfe' : '#e2e8f0'}`,
                  borderRadius: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px' }}>Attempt #{hist.attempt_number}</span>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>Scheduled: {hist.review_date} {hist.review_time}</span>
                  {hist.human_feedback && (
                    <span style={{ fontSize: '12px', color: '#334155', fontStyle: 'italic' }}>
                      "{hist.human_feedback}"
                    </span>
                  )}
                </div>
                <StatusBadge status={hist.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
