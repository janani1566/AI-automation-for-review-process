import React from 'react';
import Modal from './Modal';
import { Mail, Calendar, User, ShieldCheck } from 'lucide-react';

export default function EmailPreviewModal({ isOpen, onClose, email }) {
  if (!email) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Email Transmission Preview" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>To:</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>{email.recipient_name} &lt;{email.recipient_email}&gt;</span>

            <span style={{ color: '#64748b', fontWeight: 600 }}>Subject:</span>
            <span style={{ fontWeight: 700, color: '#1e40af' }}>{email.subject}</span>

            <span style={{ color: '#64748b', fontWeight: 600 }}>Event:</span>
            <span><code>{email.event_type}</code></span>

            <span style={{ color: '#64748b', fontWeight: 600 }}>Timestamp:</span>
            <span>{email.sent_at}</span>

            <span style={{ color: '#64748b', fontWeight: 600 }}>Mode:</span>
            <span style={{ color: email.status === 'SENT_MOCK' ? '#0284c7' : '#15803d', fontWeight: 600 }}>
              {email.status === 'SENT_MOCK' ? 'Mock Transmitted (Recorded Safely in Outbox)' : 'SMTP Live'}
            </span>
          </div>
        </div>

        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', backgroundColor: '#ffffff', minHeight: '300px' }}>
          <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
          <span>Fingerprint: <code>{email.event_fingerprint}</code> (Prevents duplicate sends)</span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close Preview</button>
        </div>
      </div>
    </Modal>
  );
}
