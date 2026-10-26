import React, { useState } from 'react';
import { RotateCcw, UserPlus, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function Topbar({ title, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleReset = async () => {
    if (!window.confirm('Reset all demo data back to the clean baseline?')) return;
    setLoading(true);
    try {
      await api.resetDemoData();
      setMessage('Demo data reset successfully!');
      setTimeout(() => setMessage(''), 3000);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed100 = async () => {
    setLoading(true);
    try {
      const res = await api.seed100Interns();
      setMessage(res.message);
      setTimeout(() => setMessage(''), 3000);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="page-title">{title}</h1>
        <span className="demo-mode-badge">
          <Sparkles size={13} />
          DEMO MODE (Safe Mocking)
        </span>
      </div>

      <div className="topbar-right">
        {message && (
          <span style={{ fontSize: '13px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
            <CheckCircle2 size={16} />
            {message}
          </span>
        )}

        <button 
          className="btn btn-secondary btn-sm" 
          onClick={handleSeed100}
          disabled={loading}
          title="Populate 100 interns to test scalability"
        >
          <UserPlus size={14} />
          Seed 100 Interns
        </button>

        <button 
          className="btn btn-secondary btn-sm" 
          onClick={handleReset}
          disabled={loading}
          title="Reset database to default seed state"
        >
          <RotateCcw size={14} />
          Reset Demo
        </button>
      </div>
    </header>
  );
}
