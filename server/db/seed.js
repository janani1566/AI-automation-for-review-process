import db from './database.js';

export function seedDemoData(clearExisting = true) {
  if (clearExisting) {
    db.exec(`
      DELETE FROM email_logs;
      DELETE FROM task_explanations;
      DELETE FROM reviews;
      DELETE FROM allocations;
      DELETE FROM interns;
      DELETE FROM tasks;
      DELETE FROM sqlite_sequence WHERE name IN ('email_logs', 'task_explanations', 'reviews', 'allocations', 'interns', 'tasks');
    `);
  }

  // Check if tasks already exist
  const existingTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
  if (existingTasks.count > 0 && !clearExisting) {
    console.log('[Seed] Database already seeded.');
    return;
  }

  // 1. Seed Company Tasks
  const insertTask = db.prepare(`
    INSERT INTO tasks (title, description, requirements, expected_output, tech_stack, reference_url, review_duration_mins)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const task1Reqs = JSON.stringify([
    "Display employee details in clean visual cards (photo/avatar, name, role, department, email)",
    "Search employees by name in real-time with instant UI filtering",
    "Filter by department using a dropdown or pill selector (Engineering, Product, Design, HR, Sales)",
    "Support desktop and mobile screen sizes with fully responsive layout",
    "Show a helpful, friendly message when no employees match search or filter criteria",
    "Built using clean semantic HTML5, modern CSS, and vanilla JavaScript"
  ]);

  const task2Reqs = JSON.stringify([
    "Create Express REST API with endpoints: GET /api/tasks, POST /api/tasks, GET /api/tasks/:id, PUT /api/tasks/:id, DELETE /api/tasks/:id",
    "Validate required fields (title, description, status) with helpful error messages on invalid input",
    "Enforce valid task status values: PENDING, IN_PROGRESS, COMPLETED",
    "Persist task data locally using SQLite or structured JSON file",
    "Include a basic README with curl or Postman testing examples"
  ]);

  const task3Reqs = JSON.stringify([
    "Build a 5-star or numeric satisfaction rating component",
    "Provide category selection (Bug Report, Feature Request, General Feedback)",
    "Client-side form validation (email format, feedback text min 20 chars)",
    "Save submissions in localStorage and show a submitted feedback history list",
    "Display a celebratory confirmation alert after successful submission"
  ]);

  const t1 = insertTask.run(
    "Build an Employee Directory Web Page",
    "Develop a responsive single-page web directory that displays company team members with dynamic search and department filtering. Interns should focus on clean DOM manipulation and accessible UI.",
    task1Reqs,
    "A responsive employee directory with working search and department filtering.",
    "HTML5, CSS3 (Flexbox/Grid), Vanilla JavaScript (ES6+)",
    "https://example.com/specs/employee-directory-v1",
    30
  );

  const t2 = insertTask.run(
    "Intern Task Tracker REST API",
    "Develop a backend REST service for intern assignment tracking with validation, error handling, and persistent local storage.",
    task2Reqs,
    "A running Node.js/Express API with 5 endpoints and local persistence.",
    "Node.js, Express.js, SQLite or file-based DB",
    "https://example.com/specs/task-api-v1",
    45
  );

  const t3 = insertTask.run(
    "Customer Support Feedback Widget",
    "Create an interactive feedback widget that allows users to submit ratings and comments with instant validation and stored feedback history.",
    task3Reqs,
    "An interactive client-side feedback widget with validation and local history.",
    "HTML5, Modern CSS, JavaScript",
    "https://example.com/specs/feedback-widget-v1",
    30
  );

  const task1Id = t1.lastInsertRowid;
  const task2Id = t2.lastInsertRowid;
  const task3Id = t3.lastInsertRowid;

  console.log(`[Seed] 3 Company Tasks created (IDs: ${task1Id}, ${task2Id}, ${task3Id}).`);

  // 2. Seed Interns (5 fictional interns with reserved @example.com addresses)
  const today = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];

  const dMinus30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dMinus10 = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
  const dMinus5 = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
  const dPlus2 = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000); // Nearing end date!
  const dPlus30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const dPlus60 = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

  const insertIntern = db.prepare(`
    INSERT INTO interns (full_name, email, current_task_id, start_date, end_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertIntern.run("Alex Chen [DEMO DATA]", "alex.chen@example.com", task1Id, formatDate(dMinus30), formatDate(dPlus30), "ACTIVE");
  insertIntern.run("Maya Patel [DEMO DATA]", "maya.patel@example.com", task2Id, formatDate(dMinus10), formatDate(dPlus60), "ACTIVE");
  insertIntern.run("Liam O'Connor [DEMO DATA]", "liam.oconnor@example.com", task1Id, formatDate(dMinus30), formatDate(dPlus2), "ACTIVE"); // Nearing end date!
  insertIntern.run("Sophia Rodriguez [DEMO DATA]", "sophia.rodriguez@example.com", task3Id, formatDate(dMinus5), formatDate(dPlus60), "ACTIVE");
  insertIntern.run("Marcus Vance [DEMO DATA]", "marcus.vance@example.com", task2Id, formatDate(dMinus30), formatDate(dPlus30), "ACTIVE");

  console.log('[Seed] 5 Core Interns created.');

  // 3. Seed Task Allocations
  const insertAlloc = db.prepare(`
    INSERT INTO allocations (intern_email, task_id, allocation_date, review_date, review_time, meet_link, internship_end_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Allocation 1: Alex Chen -> Task 1 (Incomplete submission ready for review retry)
  const alloc1 = insertAlloc.run(
    "alex.chen@example.com",
    task1Id,
    formatDate(dMinus10),
    formatDate(new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000)),
    "14:00",
    "https://meet.google.com/abc-demo-xyz",
    formatDate(dPlus30),
    "HUMAN_REVIEW_PENDING"
  );

  // Allocation 2: Maya Patel -> Task 2 (Passing submission ready for approval)
  const alloc2 = insertAlloc.run(
    "maya.patel@example.com",
    task2Id,
    formatDate(dMinus5),
    formatDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)),
    "15:30",
    "https://meet.google.com/def-demo-uvw",
    formatDate(dPlus60),
    "HUMAN_REVIEW_PENDING"
  );

  // Allocation 3: Liam O'Connor -> Task 1 (Nearing end date - in 2 days!)
  const alloc3 = insertAlloc.run(
    "liam.oconnor@example.com",
    task1Id,
    formatDate(dMinus30),
    formatDate(dPlus2),
    "11:00",
    "https://meet.google.com/ghi-demo-rst",
    formatDate(dPlus2),
    "SUBMISSION_PENDING"
  );

  // Allocation 4: Sophia Rodriguez -> Task 3 (Explanation ready, scheduled)
  const alloc4 = insertAlloc.run(
    "sophia.rodriguez@example.com",
    task3Id,
    formatDate(dMinus5),
    formatDate(new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)),
    "10:00",
    "https://meet.google.com/jkl-demo-opq",
    formatDate(dPlus60),
    "REVIEW_SCHEDULED"
  );

  // Allocation 5: Marcus Vance -> Task 2 (Allocated, ready for mentor explanation)
  const alloc5 = insertAlloc.run(
    "marcus.vance@example.com",
    task2Id,
    formatDate(today),
    formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)),
    "16:00",
    "https://meet.google.com/mno-demo-lmn",
    formatDate(dPlus30),
    "ALLOCATED"
  );

  const alloc1Id = alloc1.lastInsertRowid;
  const alloc2Id = alloc2.lastInsertRowid;
  const alloc3Id = alloc3.lastInsertRowid;

  console.log('[Seed] 5 Allocations created.');

  // 4. Seed Mentor Explanation for Task 1
  const insertExplanation = db.prepare(`
    INSERT INTO task_explanations (task_id, intern_email, mentor_content)
    VALUES (?, ?, ?)
  `);

  insertExplanation.run(
    task1Id,
    "alex.chen@example.com",
    `### Mentor Walkthrough: Building the Employee Directory

Hi Alex! Welcome to your first key company project. Here is a friendly mentor breakdown of what we need and why:

**1. What we are building & why it matters**
We are building a responsive internal team directory. In a growing company with remote teammates, people constantly need a quick way to find who works in Engineering, HR, or Design, check their email, and see their face. A clean, fast directory makes cross-team collaboration effortless.

**2. Expected result**
A single-page web app where employee profile cards are displayed neatly in a grid. When you type in the search bar (e.g., "Sarah"), only cards matching that name stay visible immediately. When you pick a department filter (e.g., "Engineering"), only engineers show up. If someone searches for "Zebra" and nobody matches, a friendly notice appears instead of an empty broken screen.

**3. Recommended Step-by-Step Plan**
1. **Mock Data First**: Create a \`data.js\` array with 8–10 realistic employee objects (id, name, role, department, email, avatar).
2. **Card Template & Render**: Write a JS function \`renderCards(employees)\` that generates card HTML using template literals and mounts them into a container.
3. **Responsive Grid**: Use CSS Grid \`grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))\` so it flows nicely on both iPhone screens and wide monitors.
4. **Search Listener**: Attach an \`input\` event listener to the search input that filters the array: \`item.name.toLowerCase().includes(query)\`.
5. **Department Filter**: Attach a \`change\` listener to your department \`<select>\` dropdown.
6. **Combine Filters**: Ensure both search query and department filter work together harmoniously.
7. **Empty State**: If \`filteredEmployees.length === 0\`, show an empty state card: *"No employees found matching your filters."*

**4. How we will review your work**
We will verify that cards render properly, test search keystrokes, switch department filters, resize browser to mobile width (375px), and test an unmatched search query.

Keep it simple, maintain clean code formatting, and reach out on Slack or in our review meeting if any requirement feels ambiguous. You've got this!`
  );

  // 5. Seed Sample Reviews
  // Review 1: Alex Chen - INCOMPLETE SUBMISSION (Attempt #1)
  const alexSubmission = `
Repository: https://github.com/alexchen-demo/employee-directory-submission
Live Demo: https://alexchen-demo.github.io/employee-directory

Intern Submission Notes:
"I have created the employee cards with dummy avatar images and implemented a name search filter using Vanilla JS event listeners. Cards are displayed in a fixed table/box layout. I have not yet finished the department dropdown filter or mobile media queries because I ran out of time before the deadline."

Submitted Code Sample (index.html & app.js):
\`\`\`javascript
const employees = [
  { name: 'Alice Smith', dept: 'Engineering', email: 'alice@example.com' },
  { name: 'Bob Jones', dept: 'Marketing', email: 'bob@example.com' }
];

function render(list) {
  const container = document.getElementById('employee-list');
  container.innerHTML = list.map(e => \`
    <div class="card" style="width: 800px; height: 120px; border: 1px solid #ccc;">
      <h3>\${e.name}</h3>
      <p>\${e.dept} - \${e.email}</p>
    </div>
  \`).join('');
}

document.getElementById('search').addEventListener('keyup', (e) => {
  const q = e.target.value.toLowerCase();
  const matched = employees.filter(emp => emp.name.toLowerCase().includes(q));
  render(matched);
});
\`\`\`
  `.trim();

  const alexAiAnalysis = {
    summary: "Alex implemented the core card rendering and real-time name search. However, the department filter is completely absent, mobile responsive layout is not supported (hardcoded 800px width), and no empty state message exists when searches yield zero results.",
    requirements_analysis: [
      {
        requirement: "Display employee details in clean visual cards (photo/avatar, name, role, department, email)",
        status: "Partially Met",
        evidence: "Code renders cards with name, dept, and email. Avatar photo is missing from HTML markup.",
        explanation: "Basic employee details are shown, but photo/avatar requirement was omitted from the card layout.",
        suggested_improvement: "Add an image element with a fallback avatar placeholder for each employee card."
      },
      {
        requirement: "Search employees by name in real-time with instant UI filtering",
        status: "Met",
        evidence: "Working 'keyup' event listener filters employee list by name and calls render(matched).",
        explanation: "Name search functions as expected.",
        suggested_improvement: "Consider using the 'input' event instead of 'keyup' to catch mouse paste events."
      },
      {
        requirement: "Filter by department using a dropdown or pill selector (Engineering, Product, Design, HR, Sales)",
        status: "Missing",
        evidence: "Intern notes confirm: 'I have not yet finished the department dropdown filter'. No selector element exists in code.",
        explanation: "Department filtering requirement was not implemented.",
        suggested_improvement: "Add a <select id='dept-filter'> dropdown with department options and combine its selected value with the search filter."
      },
      {
        requirement: "Support desktop and mobile screen sizes with fully responsive layout",
        status: "Missing",
        evidence: "Cards are styled with fixed inline width 'style=\"width: 800px;\"' with no CSS media queries.",
        explanation: "The fixed 800px layout overflows and breaks on mobile screens (< 768px).",
        suggested_improvement: "Replace fixed width with CSS Grid or Flexbox, e.g. 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); width: 100%'."
      },
      {
        requirement: "Show a helpful, friendly message when no employees match search or filter criteria",
        status: "Missing",
        evidence: "When matched.length === 0, render(matched) empties container.innerHTML to blank.",
        explanation: "No empty state or feedback is shown to the user when queries have zero results.",
        suggested_improvement: "Check if (list.length === 0) inside render() and insert a friendly alert like '<p class=\"empty\">No employees matched your search.</p>'."
      },
      {
        requirement: "Built using clean semantic HTML5, modern CSS, and vanilla JavaScript",
        status: "Met",
        evidence: "Uses standard ES6 template strings, array methods (filter, map), and DOM event listeners without external frameworks.",
        explanation: "Vanilla JavaScript requirement is respected.",
        suggested_improvement: "Move inline styling out of template strings into an external stylesheet."
      }
    ],
    strengths: [
      "Real-time DOM filtering logic is clean and works quickly.",
      "Clear, honest intern notes detailing current status."
    ],
    missing_requirements: [
      "Department dropdown filtering.",
      "Responsive mobile layout (currently fixed at 800px width).",
      "Empty state message on zero results."
    ],
    important_errors: [
      "Fixed 800px width causes horizontal scroll breakage on mobile viewports."
    ],
    prioritized_next_steps: [
      "1. Add <select> department filter and synchronize with name search.",
      "2. Remove fixed 800px width and apply responsive CSS grid.",
      "3. Add conditional check for empty result state."
    ],
    questions_for_human: [
      "Should the intern be given 48 hours for the next review retry?"
    ],
    recommendation: "Revision required"
  };

  const insertReview = db.prepare(`
    INSERT INTO reviews (
      allocation_id, intern_email, task_id, attempt_number,
      review_date, review_time, meet_link, submission_type,
      submission_content, status, ai_analysis_json, human_decision,
      human_feedback, next_review_date, next_review_time
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertReview.run(
    alloc1Id,
    "alex.chen@example.com",
    task1Id,
    1,
    formatDate(new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000)),
    "14:00",
    "https://meet.google.com/abc-demo-xyz",
    "GITHUB",
    alexSubmission,
    "AI_ANALYZED",
    JSON.stringify(alexAiAnalysis),
    "PENDING",
    null,
    null,
    null
  );

  // Review 2: Maya Patel - READY FOR HUMAN APPROVAL (Task 2: REST API)
  const mayaSubmission = `
Repository: https://github.com/mayapatel-demo/task-tracker-api
Live URL: https://task-tracker-demo.onrender.com

Submission Description & Test Evidence:
"All 5 required REST endpoints are implemented in server.js using Express and SQLite.
Validation middleware checks for non-empty title and description, and restricts status to ['PENDING', 'IN_PROGRESS', 'COMPLETED'].
Returns 400 Bad Request with JSON error details if validation fails.
Tested with curl commands and automated test suite (100% passing).
README.md contains copy-paste curl commands for testing all CRUD endpoints."

Code Evidence excerpt:
\`\`\`javascript
const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
app.post('/api/tasks', (req, res) => {
  const { title, description, status = 'PENDING' } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description are required.' });
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status. Must be PENDING, IN_PROGRESS, or COMPLETED.' });
  const result = db.prepare('INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)').run(title, description, status);
  res.status(201).json({ id: result.lastInsertRowid, title, description, status });
});
\`\`\`
  `.trim();

  const mayaAiAnalysis = {
    summary: "Maya has completely satisfied all 5 company requirements for the Task Tracker REST API. Validation is rigorous, status enum is strictly checked, persistence is correctly handled with SQLite, and testing documentation is provided.",
    requirements_analysis: [
      {
        requirement: "Create Express REST API with endpoints: GET /api/tasks, POST /api/tasks, GET /api/tasks/:id, PUT /api/tasks/:id, DELETE /api/tasks/:id",
        status: "Met",
        evidence: "All 5 endpoints defined in routes with proper HTTP verbs and response status codes (200, 201, 204).",
        explanation: "Full RESTful design completed correctly.",
        suggested_improvement: "Consider adding pagination query params (?limit=10&page=1) for GET /api/tasks in a future iteration."
      },
      {
        requirement: "Validate required fields (title, description, status) with helpful error messages on invalid input",
        status: "Met",
        evidence: "Middleware returns 400 with explicit JSON message when title or description is missing.",
        explanation: "Validation logic works cleanly.",
        suggested_improvement: "Consistent JSON error structure: { error: { code, message } }."
      },
      {
        requirement: "Enforce valid task status values: PENDING, IN_PROGRESS, COMPLETED",
        status: "Met",
        evidence: "Array check '!VALID_STATUSES.includes(status)' guards all write operations.",
        explanation: "Status constraint is properly enforced.",
        suggested_improvement: "None needed; clean implementation."
      },
      {
        requirement: "Persist task data locally using SQLite or structured JSON file",
        status: "Met",
        evidence: "Uses SQLite prepared statements with parameter binding to prevent SQL injection.",
        explanation: "Persistent storage satisfies all criteria.",
        suggested_improvement: "Add indexing on status column if dataset expands."
      },
      {
        requirement: "Include a basic README with curl or Postman testing examples",
        status: "Met",
        evidence: "README.md provided with complete curl commands for all 5 CRUD operations.",
        explanation: "Documentation verified.",
        suggested_improvement: "Optionally export a Postman collection JSON file."
      }
    ],
    strengths: [
      "Rigorous input validation with accurate HTTP status codes.",
      "Clean use of prepared SQL statements preventing injection vulnerabilities.",
      "Comprehensive README with working curl examples."
    ],
    missing_requirements: [],
    important_errors: [],
    prioritized_next_steps: [
      "Reviewer approval recommended.",
      "Optional stretch: add automated integration tests."
    ],
    questions_for_human: [
      "Is supervisor satisfied with the curl documentation format?"
    ],
    recommendation: "Ready for human approval"
  };

  insertReview.run(
    alloc2Id,
    "maya.patel@example.com",
    task2Id,
    1,
    formatDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)),
    "15:30",
    "https://meet.google.com/def-demo-uvw",
    "GITHUB",
    mayaSubmission,
    "AI_ANALYZED",
    JSON.stringify(mayaAiAnalysis),
    "PENDING",
    null,
    null,
    null
  );

  // Review 3: Liam O'Connor - Nearing internship end date (submission pending)
  insertReview.run(
    alloc3Id,
    "liam.oconnor@example.com",
    task1Id,
    1,
    formatDate(dPlus2),
    "11:00",
    "https://meet.google.com/ghi-demo-rst",
    "TEXT",
    "Draft work in progress. Liam is currently working on CSS responsive queries.",
    "SCHEDULED",
    null,
    "PENDING",
    null,
    null,
    null
  );

  console.log('[Seed] 3 Sample Reviews created.');

  // 6. Seed Sample Email Logs (showing mock email outbox)
  const insertEmail = db.prepare(`
    INSERT INTO email_logs (recipient_email, recipient_name, event_type, event_fingerprint, subject, body_html, body_text, status, sent_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 hours'))
  `);

  insertEmail.run(
    "alex.chen@example.com",
    "Alex Chen",
    "TASK_ALLOCATED",
    `ALLOC-${alloc1Id}-INITIAL`,
    "Task Allocated: Build an Employee Directory Web Page",
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #1e3a8a;">Welcome to your new assignment, Alex!</h2>
      <p>You have been allocated the task: <strong>Build an Employee Directory Web Page</strong>.</p>
      <h3>What you will build:</h3>
      <p>A responsive single-page web directory that displays company team members with dynamic search and department filtering.</p>
      <h3>Scheduled Review:</h3>
      <p>📅 <strong>Date:</strong> ${formatDate(new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000))}<br>
         ⏰ <strong>Time:</strong> 14:00<br>
         🔗 <strong>Google Meet:</strong> <a href="https://meet.google.com/abc-demo-xyz">https://meet.google.com/abc-demo-xyz</a></p>
      <p>Please review the task explanation in your intern portal and submit your work before the review.</p>
      <p style="color: #64748b; font-size: 13px;">This is an automated notification from Intern Automation System.</p>
    </div>`,
    `Welcome Alex! You have been allocated: Build an Employee Directory Web Page. Review Date: ${formatDate(new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000))} 14:00. Meet: https://meet.google.com/abc-demo-xyz`,
    "SENT_MOCK"
  );

  insertEmail.run(
    "maya.patel@example.com",
    "Maya Patel",
    "TASK_ALLOCATED",
    `ALLOC-${alloc2Id}-INITIAL`,
    "Task Allocated: Intern Task Tracker REST API",
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #1e3a8a;">Welcome to your new assignment, Maya!</h2>
      <p>You have been allocated the task: <strong>Intern Task Tracker REST API</strong>.</p>
      <h3>Scheduled Review:</h3>
      <p>📅 <strong>Date:</strong> ${formatDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000))}<br>
         ⏰ <strong>Time:</strong> 15:30<br>
         🔗 <strong>Google Meet:</strong> <a href="https://meet.google.com/def-demo-uvw">https://meet.google.com/def-demo-uvw</a></p>
    </div>`,
    `Welcome Maya! You have been allocated: Intern Task Tracker REST API. Meet: https://meet.google.com/def-demo-uvw`,
    "SENT_MOCK"
  );

  console.log('[Seed] Database successfully seeded with rich demo data!');
}

// Function to generate 100 interns for testing scalability (Requirement 3.B)
export function seed100Interns() {
  const firstNames = ['James', 'Emma', 'Oliver', 'Ava', 'William', 'Sophia', 'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Evelyn', 'Alexander', 'Harper', 'Daniel', 'Camila', 'Matthew', 'Gianna', 'Jackson', 'Abigail'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

  const today = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];

  const tasks = db.prepare('SELECT id FROM tasks').all();
  const taskIds = tasks.map(t => t.id);

  const insertIntern = db.prepare(`
    INSERT OR IGNORE INTO interns (full_name, email, current_task_id, start_date, end_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let added = 0;
  for (let i = 1; i <= 100; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[Math.floor(i / 5) % lastNames.length];
    const email = `intern${i}.${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`;
    const taskId = taskIds.length > 0 ? taskIds[i % taskIds.length] : null;
    const start = new Date(today.getTime() - (i % 60) * 24 * 60 * 60 * 1000);
    const end = new Date(today.getTime() + (90 - (i % 60)) * 24 * 60 * 60 * 1000);

    const res = insertIntern.run(`${fn} ${ln} [DEMO #${i}]`, email, taskId, formatDate(start), formatDate(end), "ACTIVE");
    if (res.changes > 0) added++;
  }

  console.log(`[Seed] Added ${added} benchmark interns (Total ~100+).`);
  return added;
}
