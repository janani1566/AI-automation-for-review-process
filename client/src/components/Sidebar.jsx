import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  UserCheck, 
  FileSearch, 
  Sparkles, 
  Mail, 
  Table, 
  SlidersHorizontal 
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, counts = {} }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'interns', label: 'Intern Management', icon: Users, badge: counts.totalInterns },
    { id: 'tasks', label: 'Company Tasks', icon: CheckSquare },
    { id: 'allocation', label: 'Task Allocation', icon: UserCheck },
    { id: 'reviews', label: 'Review Management', icon: FileSearch, badge: counts.awaitingApproval },
    { id: 'emails', label: 'Email Outbox', icon: Mail, badge: counts.emailsCount },
    { id: 'sheets', label: 'Sheets & Reports', icon: Table },
    { id: 'integrations', label: 'Integrations & .env', icon: SlidersHorizontal }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Sparkles size={20} />
        </div>
        <div>
          <div className="sidebar-title">InternAuto AI</div>
          <div className="sidebar-subtitle">Review & Feedback Platform</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div>Demo Mode Active</div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
          Emails safely mocked • DB Local
        </div>
      </div>
    </aside>
  );
}
