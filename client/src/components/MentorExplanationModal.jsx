import React from 'react';
import Modal from './Modal';
import { Sparkles, BookOpen } from 'lucide-react';

export default function MentorExplanationModal({ isOpen, onClose, explanation, taskTitle, internName }) {
  if (!explanation) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Mentor Guide: ${taskTitle || 'Task Breakdown'}`} size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#eff6ff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <Sparkles size={20} color="#2563eb" />
          <div style={{ fontSize: '13px', color: '#1e40af' }}>
            <strong>Human-in-the-Loop Mentor AI:</strong> Clear, natural, and supportive explanation crafted specifically for {internName || 'the intern'} without jargon or invented requirements.
          </div>
        </div>

        <div className="mentor-markdown" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', backgroundColor: '#ffffff', maxHeight: '550px', overflowY: 'auto' }}>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.7', color: '#334155' }}>
            {explanation.mentor_content || explanation}
          </pre>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Done Reading</button>
        </div>
      </div>
    </Modal>
  );
}
