const BASE_URL = '/api';

function buildQueryString(params = {}) {
  const clean = {};
  for (const [key, value] of Object.entries(params)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== 'ALL' &&
      value !== 'undefined'
    ) {
      clean[key] = value;
    }
  }
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  // Dashboard
  getDashboardStats: async () => {
    const res = await fetch(`${BASE_URL}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to load dashboard stats');
    return res.json();
  },

  // Interns
  getInterns: async (params = {}) => {
    const res = await fetch(`${BASE_URL}/interns${buildQueryString(params)}`);
    if (!res.ok) throw new Error('Failed to load interns');
    return res.json();
  },

  getInternById: async (id) => {
    const res = await fetch(`${BASE_URL}/interns/${id}`);
    if (!res.ok) throw new Error('Failed to load intern details');
    return res.json();
  },

  createIntern: async (data) => {
    const res = await fetch(`${BASE_URL}/interns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create intern');
    return json;
  },

  updateIntern: async (id, data) => {
    const res = await fetch(`${BASE_URL}/interns/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update intern');
    return json;
  },

  importInternsCSV: async (csvText) => {
    const res = await fetch(`${BASE_URL}/interns/import-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvText })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to import CSV');
    return json;
  },

  // Tasks
  getTasks: async () => {
    const res = await fetch(`${BASE_URL}/tasks`);
    if (!res.ok) throw new Error('Failed to load tasks');
    return res.json();
  },

  createTask: async (data) => {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create task');
    return json;
  },

  updateTask: async (id, data) => {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update task');
    return json;
  },

  // Allocations
  getAllocations: async () => {
    const res = await fetch(`${BASE_URL}/allocations`);
    if (!res.ok) throw new Error('Failed to load allocations');
    return res.json();
  },

  createAllocation: async (data) => {
    const res = await fetch(`${BASE_URL}/allocations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to allocate task');
    return json;
  },

  // Reviews
  getReviews: async (params = {}) => {
    const res = await fetch(`${BASE_URL}/reviews${buildQueryString(params)}`);
    if (!res.ok) throw new Error('Failed to load reviews');
    return res.json();
  },

  getReviewById: async (id) => {
    const res = await fetch(`${BASE_URL}/reviews/${id}`);
    if (!res.ok) throw new Error('Failed to load review');
    return res.json();
  },

  submitWork: async (id, data) => {
    const res = await fetch(`${BASE_URL}/reviews/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to submit work');
    return json;
  },

  runAIReview: async (id) => {
    const res = await fetch(`${BASE_URL}/reviews/${id}/ai-analyze`, {
      method: 'POST'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to run AI review');
    return json;
  },

  submitHumanDecision: async (id, data) => {
    const res = await fetch(`${BASE_URL}/reviews/${id}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to submit decision');
    return json;
  },

  // Mentor Explanations
  getTaskExplanation: async (taskId, internEmail) => {
    const qs = internEmail ? `?internEmail=${encodeURIComponent(internEmail)}` : '';
    const res = await fetch(`${BASE_URL}/explanations/task/${taskId}${qs}`);
    if (!res.ok) throw new Error('Failed to load explanation');
    return res.json();
  },

  generateTaskExplanation: async (taskId, internEmail) => {
    const res = await fetch(`${BASE_URL}/explanations/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, internEmail })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to generate explanation');
    return json;
  },

  // Emails & Logs
  getEmailLogs: async (params = {}) => {
    const res = await fetch(`${BASE_URL}/emails${buildQueryString(params)}`);
    if (!res.ok) throw new Error('Failed to load email logs');
    return res.json();
  },

  getEmailById: async (id) => {
    const res = await fetch(`${BASE_URL}/emails/${id}`);
    if (!res.ok) throw new Error('Failed to load email preview');
    return res.json();
  },

  // Google Sheets
  getSheetsExportData: async () => {
    const res = await fetch(`${BASE_URL}/sheets/export-data`);
    if (!res.ok) throw new Error('Failed to load export data');
    return res.json();
  },

  syncGoogleSheets: async () => {
    const res = await fetch(`${BASE_URL}/sheets/sync`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to sync sheets');
    return json;
  },

  // Demo & Reset
  resetDemoData: async () => {
    const res = await fetch(`${BASE_URL}/demo/reset`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to reset demo data');
    return json;
  },

  seed100Interns: async () => {
    const res = await fetch(`${BASE_URL}/demo/seed-100`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to seed 100 interns');
    return json;
  },

  getIntegrationsStatus: async () => {
    const res = await fetch(`${BASE_URL}/demo/integrations-status`);
    if (!res.ok) throw new Error('Failed to load integration status');
    return res.json();
  }
};
