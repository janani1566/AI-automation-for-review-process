import React, { useState, useEffect } from 'react';
import { UserCheck, Calendar, Video, Clock, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

export default function TaskAllocation({ preselectedEmail = '', onSelectReview }) {
  const [interns, setInterns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    internEmail: preselectedEmail || '',
    taskId: '',
    reviewDate: tomorrow,
    reviewTime: '14:00',
    meetLink: `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`
  });

  const [formError, setFormError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const loadData = async () => {
    try {
      const [internsRes, tasksRes, allocsRes] = await Promise.all([
        api.getInterns({ limit: 300 }),
        api.getTasks(),
        api.getAllocations()
      ]);
      setInterns(internsRes.interns || []);
      setTasks(tasksRes || []);
      setAllocations(allocsRes || []);

      if (tasksRes.length > 0 && !formData.taskId) {
        setFormData(prev => ({ ...prev, taskId: tasksRes[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (preselectedEmail) {
      setFormData(prev => ({ ...prev, internEmail: preselectedEmail }));
    }
  }, [preselectedEmail]);

  const selectedIntern = interns.find(i => i.email === formData.internEmail);

  const handleAllocate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessResult(null);
    setLoading(true);

    try {
      const res = await api.createAllocation(formData);
      setSuccessResult({
        ...res,
        message: `Task successfully allocated to ${formData.internEmail}! Mentor explanation generated and email invite recorded.`
      });
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-body">
      <div style={{ display: 'grid', gridTemplateColumns: '450px 1fr', gap: '24px' }}>
        {/* Allocation Form Card */}
        <div className="table-card" style={{ padding: '24px', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <UserCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Allocate Company Task</h3>
              <p style={{ fontSize: '12.5px', color: '#64748b' }}>Assign task, schedule review & generate mentor guide</p>
            </div>
          </div>

          {formError && <div className="alert-box alert-danger">{formError}</div>}

          {successResult && (
            <div className="alert-box alert-info" style={{ flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <CheckCircle2 size={16} />
                Task Allocated Successfully
              </div>
              <div style={{ fontSize: '12.5px' }}>{successResult.message}</div>
              {onSelectReview && successResult.reviewId && (
                <button 
                  className="btn btn-primary btn-sm"
                  style={{ alignSelf: 'flex-start', marginTop: '6px' }}
                  onClick={() => onSelectReview(successResult.reviewId)}
                >
                  Open Review Studio <ArrowRight size={13} />
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleAllocate}>
            <div className="form-group">
              <label className="form-label">Select Intern (By Email) *</label>
              <select 
                className="form-select"
                value={formData.internEmail}
                onChange={(e) => setFormData({ ...formData, internEmail: e.target.value })}
                required
              >
                <option value="">-- Choose Intern --</option>
                {interns.map((i) => (
                  <option key={i.email} value={i.email}>
                    {i.full_name} ({i.email})
                  </option>
                ))}
              </select>
            </div>

            {selectedIntern && (
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b' }}>Internship Duration:</div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  {selectedIntern.start_date} → <strong>{selectedIntern.end_date}</strong>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Select Company Task *</label>
              <select 
                className="form-select"
                value={formData.taskId}
                onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                required
              >
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.id} - {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Review Date *</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={formData.reviewDate}
                  onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Review Time *</label>
                <input 
                  type="time" 
                  className="form-input"
                  value={formData.reviewTime}
                  onChange={(e) => setFormData({ ...formData, reviewTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Google Meet Link *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="url" 
                  className="form-input"
                  value={formData.meetLink}
                  onChange={(e) => setFormData({ ...formData, meetLink: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px', color: '#1e40af' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                <Sparkles size={14} />
                Automated Actions on Submit:
              </div>
              <ul style={{ paddingLeft: '18px', lineHeight: 1.5 }}>
                <li>Generates human-like mentor task explanation</li>
                <li>Schedules initial review attempt</li>
                <li>Sends polite invitation email with Meet link</li>
              </ul>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Allocating & Generating Mentor AI...' : 'Allocate Task & Schedule Review'}
            </button>
          </form>
        </div>

        {/* Existing Allocations Table */}
        <div className="table-card">
          <div className="table-toolbar">
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              Active Task Allocations ({allocations.length})
            </h3>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Intern</th>
                  <th>Task Title</th>
                  <th>Review Appointment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allocations.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      No allocations yet. Use the form on the left to allocate a task.
                    </td>
                  </tr>
                ) : (
                  allocations.map((alloc) => (
                    <tr key={alloc.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{alloc.intern_name}</div>
                        <code style={{ fontSize: '11px', color: '#64748b' }}>{alloc.intern_email}</code>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: '13px' }}>{alloc.task_title}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>Allocated: {alloc.allocation_date}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b' }}>
                          {alloc.review_date} at {alloc.review_time}
                        </div>
                        <a 
                          href={alloc.meet_link} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'none' }}
                        >
                          Google Meet Link
                        </a>
                      </td>
                      <td>
                        <StatusBadge status={alloc.status} />
                      </td>
                      <td>
                        {alloc.latest_review_id && onSelectReview ? (
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => onSelectReview(alloc.latest_review_id)}
                          >
                            Review Studio
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>None</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
