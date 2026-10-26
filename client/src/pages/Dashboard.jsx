import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CheckSquare, 
  Calendar, 
  Clock, 
  Award, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  Mail, 
  CheckCircle2,
  FileSearch
} from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

export default function Dashboard({ setCurrentTab, onSelectReview }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading company dashboard...</div>;
  }

  const s = stats || {};

  return (
    <div className="page-body">
      {/* Ending Soon Banner if any */}
      {s.endingSoon > 0 && (
        <div className="alert-box alert-warning">
          <AlertTriangle size={20} />
          <div style={{ flex: 1 }}>
            <strong>Action Required:</strong> {s.endingSoon} intern(s) have an internship end date approaching within 7 days. Ensure reviews are scheduled before the deadline to prevent automatic completion timeout.
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setCurrentTab('interns')}
          >
            View Interns
          </button>
        </div>
      )}

      {/* Primary KPI Stats Grid */}
      <div className="stats-grid">
        <StatCard 
          title="Total Interns" 
          value={s.totalInterns || 0} 
          subtitle="Enrolled in program" 
          icon={Users} 
          color="blue" 
        />
        <StatCard 
          title="Tasks Allocated" 
          value={s.tasksAllocated || 0} 
          subtitle="Active project assignments" 
          icon={CheckSquare} 
          color="indigo" 
        />
        <StatCard 
          title="Reviews Scheduled" 
          value={s.reviewsScheduled || 0} 
          subtitle="Awaiting submission or date" 
          icon={Calendar} 
          color="purple" 
        />
        <StatCard 
          title="Pending Submissions" 
          value={s.pendingSubmissions || 0} 
          subtitle="Intern working on code" 
          icon={Clock} 
          color="amber" 
        />
        <StatCard 
          title="Awaiting Approval" 
          value={s.awaitingApproval || 0} 
          subtitle="AI analyzed & ready for supervisor" 
          icon={FileSearch} 
          color="rose" 
        />
        <StatCard 
          title="Completed Tasks" 
          value={s.completedTasks || 0} 
          subtitle="Approved by supervisor" 
          icon={Award} 
          color="emerald" 
        />
      </div>

      {/* Quick Interactive Scenarios for 2-Minute Interview Demo */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px 24px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#2563eb" />
              Demo Test Scenarios (1-Click Walkthroughs)
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>
              Jump directly into pre-configured intern review situations to demonstrate the full automation loop.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <strong style={{ fontSize: '14px', color: '#1e293b' }}>Scenario A: Incomplete Submission</strong>
                <span className="badge badge-revision">Needs Revision</span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.5, marginBottom: '12px' }}>
                <strong>Alex Chen</strong> submitted cards & name search, but missed mobile layout and department filter. Test AI review & retry scheduling.
              </p>
            </div>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (onSelectReview) onSelectReview(1);
                setCurrentTab('reviews');
              }}
            >
              Open Alex's Review Studio <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <strong style={{ fontSize: '14px', color: '#1e293b' }}>Scenario B: 100% Passing Submission</strong>
                <span className="badge badge-completed">Ready to Approve</span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.5, marginBottom: '12px' }}>
                <strong>Maya Patel</strong> completed all 5 Task Tracker REST API requirements with curl tests. Test human approval & completion email.
              </p>
            </div>
            <button 
              className="btn btn-success btn-sm"
              onClick={() => {
                if (onSelectReview) onSelectReview(2);
                setCurrentTab('reviews');
              }}
            >
              Open Maya's Review Studio <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <strong style={{ fontSize: '14px', color: '#1e293b' }}>Scenario C: Nearing End Date</strong>
                <span className="badge badge-incomplete">Critical Watch</span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.5, marginBottom: '12px' }}>
                <strong>Liam O'Connor</strong> has an internship ending in 2 days. Demonstrates safeguards preventing retries past end date.
              </p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (onSelectReview) onSelectReview(3);
                setCurrentTab('reviews');
              }}
            >
              Inspect Liam's Assignment <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Allocation Status Breakdown & Recent Outbox Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Status Distribution */}
        <div className="table-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
            Assignment Workflow Pipeline
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(s.statusDistribution || []).map((item) => (
              <div key={item.status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <StatusBadge status={item.status} />
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#334155' }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Email Transmissions */}
        <div className="table-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              Recent Automated Emails
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('emails')}>
              View All Outbox
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(s.recentActivity || []).length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>No email events yet.</div>
            ) : (
              (s.recentActivity || []).map((act, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
                  <Mail size={16} color="#2563eb" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {act.title}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      To: {act.detail} • {act.timestamp}
                    </div>
                  </div>
                  <span className="badge badge-active" style={{ fontSize: '10.5px' }}>
                    {act.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
