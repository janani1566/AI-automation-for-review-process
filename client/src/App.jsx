import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

import Dashboard from './pages/Dashboard';
import InternManagement from './pages/InternManagement';
import TaskManagement from './pages/TaskManagement';
import TaskAllocation from './pages/TaskAllocation';
import ReviewManagement from './pages/ReviewManagement';
import EmailOutbox from './pages/EmailOutbox';
import SheetsAndReports from './pages/SheetsAndReports';
import Integrations from './pages/Integrations';

import { api } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [counts, setCounts] = useState({});
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [preselectedInternEmail, setPreselectedInternEmail] = useState('');

  const refreshCounts = async () => {
    try {
      const stats = await api.getDashboardStats();
      const emails = await api.getEmailLogs({ limit: 1 });
      setCounts({
        totalInterns: stats.totalInterns,
        awaitingApproval: stats.awaitingApproval,
        emailsCount: stats.tasksAllocated || 0
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshCounts();
  }, [currentTab]);

  const handleSelectReview = (reviewId) => {
    setSelectedReviewId(reviewId);
    setCurrentTab('reviews');
  };

  const handleAllocateIntern = (email) => {
    setPreselectedInternEmail(email);
    setCurrentTab('allocation');
  };

  const pageTitles = {
    dashboard: 'Company Executive Dashboard',
    interns: 'Intern Cohort Management',
    tasks: 'Company Task Repository',
    allocation: 'Task Allocation & Scheduling',
    reviews: 'Review Management & Studio',
    emails: 'Automated Email Outbox & Audit Log',
    sheets: 'Google Sheets Integration & Exports',
    integrations: 'Integrations & Environment Configuration'
  };

  return (
    <div className="app-container">
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={(tab) => {
          if (tab !== 'reviews') setSelectedReviewId(null);
          setCurrentTab(tab);
        }} 
        counts={counts}
      />

      <div className="main-content">
        <Topbar 
          title={pageTitles[currentTab] || 'Intern Automation System'}
          onRefresh={refreshCounts}
        />

        {currentTab === 'dashboard' && (
          <Dashboard 
            setCurrentTab={setCurrentTab}
            onSelectReview={handleSelectReview}
          />
        )}

        {currentTab === 'interns' && (
          <InternManagement 
            onAllocateIntern={handleAllocateIntern}
          />
        )}

        {currentTab === 'tasks' && (
          <TaskManagement />
        )}

        {currentTab === 'allocation' && (
          <TaskAllocation 
            preselectedEmail={preselectedInternEmail}
            onSelectReview={handleSelectReview}
          />
        )}

        {currentTab === 'reviews' && (
          <ReviewManagement 
            initialReviewId={selectedReviewId}
            onClearInitialReview={() => setSelectedReviewId(null)}
          />
        )}

        {currentTab === 'emails' && (
          <EmailOutbox />
        )}

        {currentTab === 'sheets' && (
          <SheetsAndReports />
        )}

        {currentTab === 'integrations' && (
          <Integrations />
        )}
      </div>
    </div>
  );
}
