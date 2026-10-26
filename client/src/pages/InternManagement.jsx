import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Upload, 
  Edit2, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ExternalLink 
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { api } from '../services/api';

export default function InternManagement({ onSelectIntern, onAllocateIntern }) {
  const [interns, setInterns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tasks, setTasks] = useState([]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingIntern, setEditingIntern] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'ACTIVE',
    current_task_id: ''
  });
  const [formError, setFormError] = useState('');
  const [csvText, setCsvText] = useState('');
  const [csvResult, setCsvResult] = useState(null);

  const fetchInterns = async () => {
    try {
      setLoading(true);
      const data = await api.getInterns({ search, status: statusFilter, limit: 300 });
      setInterns(data.interns || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchInterns();
  }, [search, statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      full_name: '',
      email: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'ACTIVE',
      current_task_id: ''
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (intern) => {
    setEditingIntern(intern);
    setFormData({
      full_name: intern.full_name,
      email: intern.email,
      start_date: intern.start_date,
      end_date: intern.end_date,
      status: intern.status,
      current_task_id: intern.current_task_id || ''
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.createIntern({
        ...formData,
        current_task_id: formData.current_task_id ? Number(formData.current_task_id) : null
      });
      setShowAddModal(false);
      fetchInterns();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.updateIntern(editingIntern.id, {
        ...formData,
        current_task_id: formData.current_task_id ? Number(formData.current_task_id) : null
      });
      setShowEditModal(false);
      fetchInterns();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleImportCsv = async (e) => {
    e.preventDefault();
    setCsvResult(null);
    setFormError('');
    try {
      const res = await api.importInternsCSV(csvText);
      setCsvResult(res);
      fetchInterns();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const sampleCsvContent = `Full Name,Email,Start Date,End Date,Status
Jordan Taylor [DEMO],jordan.taylor@example.com,2026-09-01,2026-12-01,ACTIVE
Morgan Reed [DEMO],morgan.reed@example.com,2026-09-15,2026-12-15,ACTIVE
Casey Rivera [DEMO],casey.rivera@example.com,2026-08-01,2026-11-01,ACTIVE`;

  return (
    <div className="page-body">
      {/* Page Header Toolbar */}
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div className="search-box">
              <Search size={16} color="#64748b" />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses ({total})</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="INCOMPLETE_AT_END_DATE">Incomplete at End Date</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowImportModal(true)}>
              <Upload size={14} />
              Import CSV
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
              <Plus size={14} />
              Add Intern
            </button>
          </div>
        </div>

        {/* Interns Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Assigned Task</th>
                <th>Duration (Start - End)</th>
                <th>Review Status</th>
                <th>Intern Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Loading interns...
                  </td>
                </tr>
              ) : interns.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No interns found matching the filters.
                  </td>
                </tr>
              ) : (
                interns.map((intern) => (
                  <tr key={intern.id}>
                    <td>
                      <code style={{ fontSize: '11.5px', color: '#64748b' }}>#{intern.id}</code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{intern.full_name}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', color: '#2563eb' }}>{intern.email}</code>
                    </td>
                    <td>
                      {intern.current_task_title ? (
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>
                          {intern.current_task_title}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#475569' }}>
                        {intern.start_date} <span style={{ color: '#94a3b8' }}>→</span> {intern.end_date}
                      </div>
                    </td>
                    <td>
                      {intern.allocation_status ? (
                        <StatusBadge status={intern.allocation_status} />
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>No review scheduled</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={intern.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="Edit intern"
                          onClick={() => handleOpenEdit(intern)}
                        >
                          <Edit2 size={13} />
                        </button>
                        {!intern.current_task_id && onAllocateIntern && (
                          <button 
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            title="Allocate task"
                            onClick={() => onAllocateIntern(intern.email)}
                          >
                            Allocate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Intern Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Intern">
        <form onSubmit={handleSaveAdd}>
          {formError && <div className="alert-box alert-danger">{formError}</div>}
          
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Maya Lin"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (Unique ID) *</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="e.g. maya.lin@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Internship Start Date *</label>
              <input 
                type="date" 
                className="form-input" 
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Internship End Date *</label>
              <input 
                type="date" 
                className="form-input" 
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Task (Optional)</label>
            <select 
              className="form-select"
              value={formData.current_task_id}
              onChange={(e) => setFormData({ ...formData, current_task_id: e.target.value })}
            >
              <option value="">-- No initial task --</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px -24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Intern</button>
          </div>
        </form>
      </Modal>

      {/* Edit Intern Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Intern Details">
        <form onSubmit={handleSaveEdit}>
          {formError && <div className="alert-box alert-danger">{formError}</div>}

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input 
              type="email" 
              className="form-input" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assigned Task</label>
              <select 
                className="form-select"
                value={formData.current_task_id}
                onChange={(e) => setFormData({ ...formData, current_task_id: e.target.value })}
              >
                <option value="">-- No task assigned --</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select 
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="INCOMPLETE_AT_END_DATE">INCOMPLETE_AT_END_DATE</option>
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px -24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Update Intern</button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Interns from CSV" size="lg">
        <form onSubmit={handleImportCsv}>
          {formError && <div className="alert-box alert-danger">{formError}</div>}

          {csvResult && (
            <div className="alert-box alert-info">
              <CheckCircle2 size={18} />
              <div>
                <strong>Import Result:</strong> Successfully imported <strong>{csvResult.importedCount}</strong> interns. 
                {csvResult.skippedCount > 0 && ` (${csvResult.skippedCount} skipped due to duplicate email or invalid format)`}
              </div>
            </div>
          )}

          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '10px' }}>
            Paste CSV text with column headers: <code>Full Name, Email, Start Date, End Date, Status</code>
          </p>

          <div style={{ marginBottom: '10px' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => setCsvText(sampleCsvContent)}
            >
              Paste Sample CSV Template
            </button>
          </div>

          <textarea 
            className="form-textarea" 
            rows="8" 
            placeholder="Full Name,Email,Start Date,End Date,Status..."
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            style={{ fontFamily: 'monospace', fontSize: '12.5px' }}
            required
          />

          <div className="modal-footer" style={{ margin: '20px -24px -24px -24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowImportModal(false)}>Close</button>
            <button type="submit" className="btn btn-primary">Execute CSV Import</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
