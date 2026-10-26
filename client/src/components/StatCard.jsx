import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: { bg: '#eff6ff', text: '#2563eb' },
    emerald: { bg: '#ecfdf5', text: '#10b981' },
    amber: { bg: '#fffbeb', text: '#f59e0b' },
    purple: { bg: '#faf5ff', text: '#9333ea' },
    rose: { bg: '#fff1f2', text: '#f43f5e' },
    indigo: { bg: '#eef2ff', text: '#4f46e5' }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-title">{title}</span>
        {Icon && (
          <div className="stat-icon" style={{ backgroundColor: scheme.bg, color: scheme.text }}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  );
}
