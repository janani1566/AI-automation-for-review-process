import React, { useState, useEffect } from 'react';
import { Mail, Search, Eye, ShieldCheck, CheckCircle2 } from 'lucide-react';
import EmailPreviewModal from '../components/EmailPreviewModal';
import { api } from '../services/api';

export default function EmailOutbox() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [previewEmail, setPreviewEmail] = useState(null);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const data = await api.getEmailLogs({
        recipientEmail: search.trim() || undefined,
        eventType: eventTypeFilter || undefined
      });
      setEmails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [eventTypeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmails();
  };

  return (
    <div className="page-body">
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearchSubmit} className="search-box">
              <Search size={16} color="#64748b" />
              <input 
                type="text" 
                placeholder="Search recipient email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            <select 
              className="filter-select"
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
            >
              <option value="">All Event Types</option>
              <option value="TASK_ALLOCATED">TASK_ALLOCATED</option>
              <option value="FEEDBACK_REVISION">FEEDBACK_REVISION</option>
              <option value="TASK_COMPLETED">TASK_COMPLETED</option>
              <option value="SUPERVISOR_END_DATE_ALERT">SUPERVISOR_END_DATE_ALERT</option>
            </select>
          </div>

          <div style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="#059669" />
            Duplicate email deduplication active
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event Type</th>
                <th>Recipient</th>
                <th>Subject</th>
                <th>Transmission Mode</th>
                <th>Timestamp</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Loading outbox...
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No emails logged in outbox.
                  </td>
                </tr>
              ) : (
                emails.map((email) => (
                  <tr key={email.id}>
                    <td>
                      <code style={{ fontSize: '11px', color: '#64748b' }}>#{email.id}</code>
                    </td>
                    <td>
                      <code style={{ fontSize: '11.5px', color: '#0f172a', fontWeight: 600 }}>{email.event_type}</code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{email.recipient_name || 'Intern'}</div>
                      <code style={{ fontSize: '11px', color: '#2563eb' }}>{email.recipient_email}</code>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>
                        {email.subject}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${email.status === 'SENT_MOCK' ? 'badge-active' : 'badge-completed'}`} style={{ fontSize: '11px' }}>
                        {email.status === 'SENT_MOCK' ? 'Mock Transmitted' : 'Live SMTP'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {email.sent_at}
                      </div>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setPreviewEmail(email)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Eye size={13} /> Preview
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rendered Email Preview Modal */}
      <EmailPreviewModal 
        isOpen={!!previewEmail}
        onClose={() => setPreviewEmail(null)}
        email={previewEmail}
      />
    </div>
  );
}
