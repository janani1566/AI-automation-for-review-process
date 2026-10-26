import React, { useState, useEffect } from 'react';
import { FileSearch, Video, Calendar, Clock, Sparkles, ArrowRight, Filter } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ReviewStudio from './ReviewStudio';
import { api } from '../services/api';

export default function ReviewManagement({ initialReviewId = null, onClearInitialReview }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeReviewId, setActiveReviewId] = useState(initialReviewId);

  useEffect(() => {
    if (initialReviewId) {
      setActiveReviewId(initialReviewId);
    }
  }, [initialReviewId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await api.getReviews({ status: statusFilter !== 'ALL' ? statusFilter : undefined });
      setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeReviewId) {
      fetchReviews();
    }
  }, [statusFilter, activeReviewId]);

  if (activeReviewId) {
    return (
      <ReviewStudio 
        reviewId={activeReviewId} 
        onBack={() => {
          setActiveReviewId(null);
          if (onClearInitialReview) onClearInitialReview();
        }}
        onComplete={() => {
          fetchReviews();
        }}
      />
    );
  }

  return (
    <div className="page-body">
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
              Review Appointments & Records ({reviews.length})
            </div>
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Review Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="AI_ANALYZED">AI Analyzed</option>
              <option value="APPROVED">Approved (Completed)</option>
              <option value="REVISION_REQUESTED">Revision Requested</option>
              <option value="INCOMPLETE_AT_END_DATE">Incomplete at End Date</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Attempt</th>
                <th>Intern Name & Email</th>
                <th>Task Title</th>
                <th>Review Appointment</th>
                <th>Submission Status</th>
                <th>AI Analysis</th>
                <th>Human Decision</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Loading reviews...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => (
                  <tr key={rev.id}>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '12.5px', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
                        #{rev.attempt_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{rev.intern_name}</div>
                      <code style={{ fontSize: '11px', color: '#64748b' }}>{rev.intern_email}</code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '13px' }}>{rev.task_title}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                        {rev.review_date} {rev.review_time}
                      </div>
                      <a 
                        href={rev.meet_link} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'none' }}
                      >
                        Meet Link
                      </a>
                    </td>
                    <td>
                      {rev.submission_content ? (
                        <span className="badge badge-completed" style={{ fontSize: '11px' }}>
                          Evidence Submitted
                        </span>
                      ) : (
                        <span className="badge badge-pending" style={{ fontSize: '11px' }}>
                          Awaiting Evidence
                        </span>
                      )}
                    </td>
                    <td>
                      {rev.ai_analysis ? (
                        <span className="badge badge-active" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Sparkles size={11} /> AI Evaluated
                        </span>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Not run</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={rev.human_decision || 'PENDING'} />
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => setActiveReviewId(rev.id)}
                      >
                        Open Studio <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
