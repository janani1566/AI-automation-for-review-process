import React, { useState, useEffect } from 'react';
import { Table, Download, RefreshCw, CheckCircle2, FileSpreadsheet, ExternalLink } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

export default function SheetsAndReports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.getSheetsExportData();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await api.syncGoogleSheets();
      setSyncMessage(res);
      setTimeout(() => setSyncMessage(null), 6000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="page-body">
      <div className="table-card" style={{ marginBottom: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Google Sheets Integration & Master Export</h3>
                <p style={{ fontSize: '12.5px', color: '#64748b' }}>Export company roster and review records directly into Google Sheets format</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Synchronizing...' : 'Sync to Google Sheets'}
            </button>
            <a 
              href="/api/sheets/download-csv" 
              className="btn btn-primary btn-sm"
              download="intern_automation_roster.csv"
              style={{ textDecoration: 'none' }}
            >
              <Download size={14} /> Download Google Sheets CSV
            </a>
          </div>
        </div>

        {syncMessage && (
          <div className="alert-box alert-info" style={{ marginTop: '16px', marginBottom: 0 }}>
            <CheckCircle2 size={18} />
            <div>
              <strong>Sync Outcome ({syncMessage.mode}):</strong> {syncMessage.message}
            </div>
          </div>
        )}
      </div>

      {/* Structured Preview Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
            Live Spreadsheet Data Preview ({data.length} records)
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Intern</th>
                <th>Assigned Task</th>
                <th>Internship Duration</th>
                <th>Status</th>
                <th>Workflow</th>
                <th>Next Review</th>
                <th>Attempts</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Loading data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No intern records found.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.intern_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.full_name}</div>
                      <code style={{ fontSize: '11px', color: '#2563eb' }}>{row.email}</code>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>
                        {row.assigned_task || <span style={{ color: '#94a3b8' }}>Unassigned</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#475569' }}>
                        {row.start_date} → {row.end_date}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={row.intern_status} />
                    </td>
                    <td>
                      <StatusBadge status={row.allocation_status || 'NONE'} />
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {row.review_date ? `${row.review_date} ${row.review_time}` : 'N/A'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '12px', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                        {row.review_attempts}
                      </span>
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
