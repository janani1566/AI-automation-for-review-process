import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Edit2, Sparkles, BookOpen, Clock, Code, Link as LinkIcon } from 'lucide-react';
import Modal from '../components/Modal';
import MentorExplanationModal from '../components/MentorExplanationModal';
import { api } from '../services/api';

export default function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Mentor Explanation Modal
  const [selectedExplanation, setSelectedExplanation] = useState(null);
  const [explanationModalOpen, setExplanationModalOpen] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    expected_output: '',
    tech_stack: '',
    reference_url: '',
    review_duration_mins: 30
  });
  const [formError, setFormError] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      description: '',
      requirements: '1. Requirement one\n2. Requirement two\n3. Requirement three',
      expected_output: '',
      tech_stack: '',
      reference_url: '',
      review_duration_mins: 30
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      requirements: Array.isArray(task.requirements) ? task.requirements.join('\n') : task.requirements,
      expected_output: task.expected_output,
      tech_stack: task.tech_stack,
      reference_url: task.reference_url || '',
      review_duration_mins: task.review_duration_mins || 30
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.createTask({
        ...formData,
        requirements: formData.requirements.split('\n').filter(r => r.trim())
      });
      setShowAddModal(false);
      fetchTasks();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.updateTask(editingTask.id, {
        ...formData,
        requirements: formData.requirements.split('\n').filter(r => r.trim())
      });
      setShowEditModal(false);
      fetchTasks();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleOpenExplanation = async (task) => {
    try {
      setExplanationLoading(true);
      let exp;
      try {
        exp = await api.getTaskExplanation(task.id);
      } catch (e) {
        // Generate if not exists
        exp = await api.generateTaskExplanation(task.id);
      }
      setSelectedExplanation({
        taskTitle: task.title,
        content: exp.mentor_content
      });
      setExplanationModalOpen(true);
    } catch (err) {
      alert('Could not generate mentor explanation: ' + err.message);
    } finally {
      setExplanationLoading(false);
    }
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Company Task Master Repository</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Standardized technical tasks allocated to interns. Each task contains unambiguous requirements serving as the source of truth for AI reviews.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Create Task
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No tasks found.</div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="table-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <code style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>
                      TASK #{task.id}
                    </code>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{task.title}</h3>
                  </div>
                  <p style={{ fontSize: '13.5px', color: '#475569', marginTop: '6px', lineHeight: 1.5 }}>
                    {task.description}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenExplanation(task)}
                    disabled={explanationLoading}
                    title="View mentor AI explanation breakdown"
                  >
                    <Sparkles size={14} color="#2563eb" />
                    Mentor Guide
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenEdit(task)}
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                </div>
              </div>

              {/* Requirements & Meta Badges */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '10px' }}>
                  Original Company Requirements ({task.requirements.length}):
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {task.requirements.map((req, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#334155' }}>
                      <span style={{ color: '#2563eb', fontWeight: 700 }}>{idx + 1}.</span>
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px', fontSize: '12.5px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontWeight: 600 }}>Expected Output:</span>
                  <span style={{ color: '#0f172a', fontWeight: 500 }}>{task.expected_output}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontWeight: 600 }}>Tech Stack:</span>
                  <code style={{ color: '#0f172a' }}>{task.tech_stack}</code>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontWeight: 600 }}>Review Duration:</span>
                  <span style={{ color: '#0f172a', fontWeight: 500 }}>{task.review_duration_mins} minutes</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontWeight: 600 }}>Allocated Count:</span>
                  <span style={{ color: '#0f172a', fontWeight: 500 }}>{task.allocation_count || 0} interns</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create New Company Task" size="lg">
        <form onSubmit={handleSaveAdd}>
          {formError && <div className="alert-box alert-danger">{formError}</div>}

          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Build an Employee Directory Web Page"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Task Description *</label>
            <textarea 
              className="form-textarea" 
              rows="3"
              placeholder="Describe the objective and why the company needs this built..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Company Requirements (One per line) *</label>
            <textarea 
              className="form-textarea" 
              rows="6"
              placeholder="Enter exact requirements, one per line..."
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              style={{ fontFamily: 'monospace', fontSize: '13px' }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Expected Output *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. A responsive directory with working search and department filtering."
              value={formData.expected_output}
              onChange={(e) => setFormData({ ...formData, expected_output: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Required Tech Stack *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. HTML5, CSS3, Vanilla JavaScript"
                value={formData.tech_stack}
                onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Review Duration (Mins)</label>
              <input 
                type="number" 
                className="form-input" 
                value={formData.review_duration_mins}
                onChange={(e) => setFormData({ ...formData, review_duration_mins: e.target.value })}
                min="15"
                max="120"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reference Documentation / Spec URL</label>
            <input 
              type="url" 
              className="form-input" 
              placeholder="https://example.com/spec-v1"
              value={formData.reference_url}
              onChange={(e) => setFormData({ ...formData, reference_url: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px -24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Task</button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Company Task" size="lg">
        <form onSubmit={handleSaveEdit}>
          {formError && <div className="alert-box alert-danger">{formError}</div>}

          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Task Description *</label>
            <textarea 
              className="form-textarea" 
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Company Requirements (One per line) *</label>
            <textarea 
              className="form-textarea" 
              rows="6"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              style={{ fontFamily: 'monospace', fontSize: '13px' }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Expected Output *</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.expected_output}
              onChange={(e) => setFormData({ ...formData, expected_output: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Required Tech Stack *</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.tech_stack}
                onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Review Duration (Mins)</label>
              <input 
                type="number" 
                className="form-input" 
                value={formData.review_duration_mins}
                onChange={(e) => setFormData({ ...formData, review_duration_mins: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px -24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Mentor Guide Modal */}
      <MentorExplanationModal 
        isOpen={explanationModalOpen}
        onClose={() => setExplanationModalOpen(false)}
        explanation={selectedExplanation?.content}
        taskTitle={selectedExplanation?.taskTitle}
      />
    </div>
  );
}
