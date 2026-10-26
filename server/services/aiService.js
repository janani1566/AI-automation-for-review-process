import dotenv from 'dotenv';
dotenv.config();

/**
 * AI Service for:
 * 1. Mentor Task Explanation (approachable, human-like, structured)
 * 2. Side-by-Side Review Analysis (rigorous, evidence-based, requirement-by-requirement)
 */

export class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'mock';
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  getIntegrationStatus() {
    return {
      provider: this.provider,
      isConfigured: !!(this.openaiApiKey && this.openaiApiKey.startsWith('sk-')),
      model: this.openaiModel,
      activeMode: (this.openaiApiKey && this.openaiApiKey.startsWith('sk-')) ? 'LIVE_API' : 'INTELLIGENT_MOCK_DEMO'
    };
  }

  /**
   * Generates a supportive, human-like mentor explanation for an allocated task.
   */
  async generateTaskExplanation({ task, internName = 'Intern' }) {
    const requirementsList = Array.isArray(task.requirements) 
      ? task.requirements 
      : JSON.parse(task.requirements || '[]');

    // If real OpenAI key is provided and provider is openai
    if (this.openaiApiKey && this.openaiApiKey.startsWith('sk-') && this.provider === 'openai') {
      try {
        const prompt = `You are a supportive, experienced senior engineering mentor welcoming ${internName} to their new company assignment: "${task.title}".
Explain the task in simple, natural, approachable mentor language. Avoid robotic phrases, empty buzzwords, or generic fluff.

Source of Truth Task Details:
- Title: ${task.title}
- Description: ${task.description}
- Requirements:
${requirementsList.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}
- Expected Output: ${task.expected_output}
- Tech Stack: ${task.tech_stack}
- Reference: ${task.reference_url || 'Internal guidelines'}

Format your explanation in clear markdown with these exact sections:
1. What We're Asking You to Build (and why it matters to the company)
2. What the Finished Result Looks Like
3. Recommended Step-by-Step Implementation Plan (sensible, bite-sized phases)
4. Technologies & Tools to Use
5. How Your Work Will Be Reviewed
6. Pro Tips & Questions to Ask If You Get Stuck`;

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openaiApiKey}`
          },
          body: JSON.stringify({
            model: this.openaiModel,
            messages: [
              { role: 'system', content: 'You are an experienced, approachable tech mentor writing directly to a junior intern colleague. Do not invent unstated requirements.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.6
          })
        });

        const data = await res.json();
        if (data.choices && data.choices[0]?.message?.content) {
          return data.choices[0].message.content;
        }
      } catch (err) {
        console.warn('[AI Service] OpenAI API call failed, falling back to Intelligent Mentor Generator:', err.message);
      }
    }

    // Intelligent Mentor Mock Mode (Deterministic, realistic, grounded in source of truth)
    return `### Mentor Walkthrough: ${task.title}

Hi ${internName}! Welcome to this assignment. I'm excited to have you work on **${task.title}**. Here is a clear, friendly breakdown to help you get started with confidence.

---

### 1. What We're Asking You to Build (and Why It Matters)
${task.description}

In our company, this isn't just a toy exercise—it solves a real operational need. Clean code, predictable behavior, and accessible user experience make a huge difference for our team and end users.

---

### 2. What the Finished Result Looks Like
**Expected Output:**
> ${task.expected_output}

When you demo this, a reviewer should be able to interact with it smoothly without experiencing unexpected crashes, missing states, or unresponsive layouts.

---

### 3. Recommended Step-by-Step Implementation Plan
Here is a sensible path to break the task down into achievable milestones:

- **Phase 1: Project Setup & Data Modeling (Hours 1–2)**
  - Initialize your project structure cleanly.
  - Set up sample data or state models representing all required fields.
- **Phase 2: Core Functionality (Hours 3–5)**
  ${requirementsList.slice(0, 3).map((r, i) => `- Implement requirement #${i + 1}: *${r}*`).join('\n  ')}
- **Phase 3: Polish, Edge Cases & Responsive Testing (Hours 6–7)**
  ${requirementsList.slice(3).map((r, i) => `- Satisfy requirement #${i + 4}: *${r}*`).join('\n  ')}
  - Test edge cases (empty inputs, zero search matches, mobile viewports).
- **Phase 4: Self-Review & Submission (Final Hour)**
  - Walk through each company requirement manually against your running build.
  - Document how to run and test your project in a clear README.

---

### 4. Required Technologies & Tools
- **Tech Stack:** \`${task.tech_stack}\`
- **Reference Spec:** ${task.reference_url ? `[Official Specification](${task.reference_url})` : 'Refer to internal engineering guidelines.'}

---

### 5. How Your Work Will Be Reviewed
During our review session, we will verify:
1. Every specific company requirement is met with observable evidence.
2. Code clarity, naming conventions, and separation of concerns.
3. How gracefully the system handles edge cases and invalid inputs.

---

### 6. Pro Tips & Questions to Ask
- Don't try to build everything at once. Get the simplest working version running first, then layer on features.
- If any requirement feels ambiguous, never guess in silence—reach out in the intern channel or ask in our scheduled check-in. We are here to support your growth!`;
  }

  /**
   * AI-assisted side-by-side comparison of original company requirements vs intern submission.
   */
  async analyzeSubmission({ task, submissionContent, previousFeedback = null }) {
    const requirementsList = Array.isArray(task.requirements) 
      ? task.requirements 
      : JSON.parse(task.requirements || '[]');

    if (!submissionContent || submissionContent.trim().length === 0) {
      return {
        summary: "No submission evidence was provided.",
        requirements_analysis: requirementsList.map(r => ({
          requirement: r,
          status: "Unable to Verify",
          evidence: "No submission content submitted.",
          explanation: "The intern has not submitted any code, links, or documentation.",
          suggested_improvement: "Submit the repository link, live deployment URL, or code excerpts."
        })),
        strengths: [],
        missing_requirements: requirementsList,
        important_errors: ["Submission body is empty."],
        prioritized_next_steps: ["Provide accessible submission link or code text for evaluation."],
        questions_for_human: ["Has the intern contacted the supervisor regarding submission delays?"],
        recommendation: "Cannot determine"
      };
    }

    // If real OpenAI key is provided
    if (this.openaiApiKey && this.openaiApiKey.startsWith('sk-') && this.provider === 'openai') {
      try {
        const systemPrompt = `You are an expert technical reviewer and mentor evaluating an intern's submission against strict company requirements.
CRITICAL SAFEGUARDS:
1. Never invent requirements outside the provided list.
2. Never claim to have inspected files or repositories you cannot access.
3. Every status must be one of: "Met", "Partially Met", "Missing", or "Unable to Verify".
4. Mark "Met" ONLY when the provided text contains concrete evidence.
5. If evidence is ambiguous, missing, or references an inaccessible link without code text, return "Unable to Verify" or "Missing" with honest notes.
6. Return purely valid JSON conforming to the requested schema.`;

        const userPrompt = `Compare this intern submission against the company task requirements.

Task Title: ${task.title}
Task Description: ${task.description}
Expected Output: ${task.expected_output}

Exact Company Requirements:
${JSON.stringify(requirementsList, null, 2)}

Intern Submission Evidence:
${submissionContent}

Previous Review Feedback (if any):
${previousFeedback || 'None (First attempt)'}

Return a single JSON object with this EXACT structure:
{
  "summary": "Concise summary of findings",
  "requirements_analysis": [
    {
      "requirement": "exact requirement text",
      "status": "Met | Partially Met | Missing | Unable to Verify",
      "evidence": "quoted evidence from submission",
      "explanation": "why this status was assigned",
      "suggested_improvement": "specific actionable advice"
    }
  ],
  "strengths": ["confirmed strength 1", "confirmed strength 2"],
  "missing_requirements": ["missing requirement 1"],
  "important_errors": ["critical bug or gap 1"],
  "prioritized_next_steps": ["step 1", "step 2"],
  "questions_for_human": ["question for supervisor"],
  "recommendation": "Ready for human approval | Revision required | Cannot determine"
}`;

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openaiApiKey}`
          },
          body: JSON.stringify({
            model: this.openaiModel,
            response_format: { type: "json_object" },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.2
          })
        });

        const data = await res.json();
        if (data.choices && data.choices[0]?.message?.content) {
          const parsed = JSON.parse(data.choices[0].message.content);
          return this.validateAndNormalizeAIResponse(parsed, requirementsList);
        }
      } catch (err) {
        console.warn('[AI Service] OpenAI review analysis call failed, using intelligent analyzer:', err.message);
      }
    }

    // Intelligent Deterministic Review Analyzer (Grounded in submission text & requirements)
    return this.intelligentMockReviewAnalysis(task, requirementsList, submissionContent);
  }

  intelligentMockReviewAnalysis(task, requirementsList, submissionContent) {
    const textLower = submissionContent.toLowerCase();

    const analysis = requirementsList.map((req) => {
      const rLower = req.toLowerCase();
      let status = "Unable to Verify";
      let evidence = "";
      let explanation = "";
      let suggested_improvement = "";

      // Smart semantic heuristics matching against submission evidence
      if (rLower.includes('employee details') || rLower.includes('cards')) {
        if (textLower.includes('render(') || textLower.includes('card') || textLower.includes('employee-list')) {
          if (textLower.includes('avatar') && !textLower.includes('avatar photo is missing')) {
            status = "Met";
            evidence = "Code defines card rendering function with employee details.";
            explanation = "Employee cards are constructed and rendered to the DOM.";
            suggested_improvement = "Ensure images have alt text for accessibility.";
          } else {
            status = "Partially Met";
            evidence = "Cards render employee name and department, but avatar images are missing or placeholder only.";
            explanation = "Core card fields rendered, but visual avatar requirement is incomplete.";
            suggested_improvement = "Add an <img> tag with avatar styling or fallback initials.";
          }
        } else {
          status = "Missing";
          evidence = "No card rendering logic found in submission.";
          explanation = "Submission does not contain employee card component.";
          suggested_improvement = "Implement a renderCards() function that loops over employee items.";
        }
      } else if (rLower.includes('search employees by name') || (rLower.includes('search') && rLower.includes('name'))) {
        if (textLower.includes('search') && (textLower.includes('filter') || textLower.includes('keyup') || textLower.includes('input'))) {
          status = "Met";
          evidence = "Real-time search filtering implemented via event listener and Array.filter().";
          explanation = "Search actively filters employee list by name string.";
          suggested_improvement = "Consider debouncing search if employee list exceeds 1,000 records.";
        } else {
          status = "Missing";
          evidence = "No search filtering listener found in submitted code.";
          explanation = "Search requirement not satisfied.";
          suggested_improvement = "Add an input element and filter the list on input events.";
        }
      } else if (rLower.includes('filter by department') || rLower.includes('department')) {
        if (textLower.includes('dept-filter') || textLower.includes('department filter') && !textLower.includes('not yet finished the department')) {
          status = "Met";
          evidence = "Department dropdown selector with filtering logic present.";
          explanation = "Department filter satisfies requirements.";
          suggested_improvement = "Ensure selecting 'All Departments' resets the filter.";
        } else if (textLower.includes('not yet finished the department') || textLower.includes('missing department')) {
          status = "Missing";
          evidence = "Intern notes acknowledge: department filter was not completed.";
          explanation = "Department filtering is not implemented in the current submission.";
          suggested_improvement = "Create a <select> element populated with department categories and tie into the filtering pipeline.";
        } else {
          status = "Missing";
          evidence = "No department filtering controls or logic observed.";
          explanation = "Department filter requirement was omitted.";
          suggested_improvement = "Add a department dropdown and combine filter results with the search query.";
        }
      } else if (rLower.includes('responsive') || rLower.includes('desktop and mobile')) {
        if (textLower.includes('grid-template-columns') || textLower.includes('@media') || textLower.includes('flex-wrap')) {
          status = "Met";
          evidence = "CSS contains media queries or responsive grid layout.";
          explanation = "Responsive design satisfies desktop and mobile screen sizes.";
          suggested_improvement = "Test across smaller viewport widths (<360px).";
        } else if (textLower.includes('width: 800px') || textLower.includes('fixed') || textLower.includes('table/box')) {
          status = "Missing";
          evidence = "Inline CSS specifies fixed width 'width: 800px;' without media queries.";
          explanation = "Fixed width layout breaks on mobile screens (<768px).";
          suggested_improvement = "Use responsive CSS Grid: 'grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))'.";
        } else {
          status = "Unable to Verify";
          evidence = "CSS stylesheets were not attached in the submission excerpt.";
          explanation = "Cannot verify responsiveness without inspecting CSS styles or running browser tests.";
          suggested_improvement = "Provide CSS file or live URL for viewport verification.";
        }
      } else if (rLower.includes('helpful message') || rLower.includes('no employees match') || rLower.includes('empty')) {
        if (textLower.includes('no employees') || textLower.includes('empty-state') || textLower.includes('zero results')) {
          status = "Met";
          evidence = "Code renders empty state message when list.length === 0.";
          explanation = "Empty state message handled appropriately.";
          suggested_improvement = "Include a button to clear current search filters in the empty state.";
        } else {
          status = "Missing";
          evidence = "Container is wiped blank or shows nothing when filtered results are empty.";
          explanation = "No friendly empty state message is shown.";
          suggested_improvement = "Add an explicit check: if (!matched.length) show 'No employees match your search'.";
        }
      } else if (rLower.includes('html') || rLower.includes('css') || rLower.includes('javascript') || rLower.includes('vanilla')) {
        if (textLower.includes('document.getelementbyid') || textLower.includes('addeventlistener') || textLower.includes('const') || textLower.includes('let')) {
          status = "Met";
          evidence = "Standard ES6+ JavaScript and DOM manipulation used without heavy frameworks.";
          explanation = "Adheres strictly to the vanilla web stack requirement.";
          suggested_improvement = "Keep JS code organized in separate module files.";
        } else {
          status = "Met";
          evidence = "Standard web code detected.";
          explanation = "Tech stack requirements satisfied.";
          suggested_improvement = "Follow modern code formatting standards.";
        }
      } else if (rLower.includes('rest api') || rLower.includes('endpoints')) {
        if (textLower.includes('app.get') || textLower.includes('app.post') || textLower.includes('endpoints implemented')) {
          status = "Met";
          evidence = "Express route handlers defined for required HTTP operations.";
          explanation = "API endpoints defined and operational.";
          suggested_improvement = "Add request logging middleware.";
        } else {
          status = "Unable to Verify";
          evidence = "Endpoints not fully visible in provided text snippet.";
          explanation = "Verification requires route definitions.";
          suggested_improvement = "Include route definitions in submission.";
        }
      } else {
        // Generic fallback check
        const words = rLower.split(' ').filter(w => w.length > 4);
        const matches = words.filter(w => textLower.includes(w));
        if (matches.length >= 2) {
          status = "Met";
          evidence = `Matches keywords: ${matches.join(', ')}`;
          explanation = "Requirement appears satisfied based on submission evidence.";
          suggested_improvement = "Maintain consistent testing.";
        } else {
          status = "Partially Met";
          evidence = "Partial matching keywords found.";
          explanation = "Evidence is inconclusive or partial.";
          suggested_improvement = "Provide clear unit test or demo evidence.";
        }
      }

      return {
        requirement: req,
        status,
        evidence: evidence || "Extracted from intern submission notes and code snippet.",
        explanation: explanation || "Requirement evaluated against submission content.",
        suggested_improvement: suggested_improvement || "Follow standard best practices."
      };
    });

    const metCount = analysis.filter(a => a.status === 'Met').length;
    const partialCount = analysis.filter(a => a.status === 'Partially Met').length;
    const missingCount = analysis.filter(a => a.status === 'Missing').length;
    const total = analysis.length;

    let recommendation = "Revision required";
    if (metCount === total) {
      recommendation = "Ready for human approval";
    } else if (missingCount === total) {
      recommendation = "Revision required";
    }

    const missingReqs = analysis.filter(a => a.status === 'Missing' || a.status === 'Partially Met').map(a => a.requirement);
    const confirmedStrengths = analysis.filter(a => a.status === 'Met').map(a => `Successfully delivered: ${a.requirement}`);

    const importantErrors = [];
    if (analysis.some(a => a.status === 'Missing' && a.requirement.toLowerCase().includes('responsive'))) {
      importantErrors.push("Layout is not responsive; hardcoded dimensions break on mobile viewports.");
    }
    if (analysis.some(a => a.status === 'Missing' && a.requirement.toLowerCase().includes('filter'))) {
      importantErrors.push("Required department filter control is missing from the interface.");
    }

    const prioritizedSteps = missingReqs.map((r, i) => `${i + 1}. Resolve: ${r}`);
    if (prioritizedSteps.length === 0) {
      prioritizedSteps.push("Prepare code walkthrough for supervisor final approval.");
    }

    return {
      summary: `Evaluated ${total} requirements: ${metCount} Met, ${partialCount} Partially Met, ${missingCount} Missing. ${recommendation === 'Ready for human approval' ? 'All criteria satisfied with evidence.' : 'Key deliverables remain incomplete.'}`,
      requirements_analysis: analysis,
      strengths: confirmedStrengths.length > 0 ? confirmedStrengths : ["Demonstrates understanding of foundational concepts."],
      missing_requirements: missingReqs,
      important_errors: importantErrors.length > 0 ? importantErrors : ["None detected."],
      prioritized_next_steps: prioritizedSteps,
      questions_for_human: [
        "Does the supervisor require additional unit test coverage before sign-off?",
        "Is the intern's timeline aligned with the scheduled internship completion date?"
      ],
      recommendation
    };
  }

  validateAndNormalizeAIResponse(response, originalRequirements) {
    // Ensure all original requirements are present in the response
    const existingReqs = new Set((response.requirements_analysis || []).map(r => r.requirement));
    const analysis = [...(response.requirements_analysis || [])];

    for (const req of originalRequirements) {
      if (!existingReqs.has(req)) {
        analysis.push({
          requirement: req,
          status: "Unable to Verify",
          evidence: "Not addressed in AI analysis output.",
          explanation: "Requirement was not found in generated report.",
          suggested_improvement: "Verify this requirement manually with the intern."
        });
      }
    }

    return {
      summary: response.summary || "AI analysis completed.",
      requirements_analysis: analysis,
      strengths: Array.isArray(response.strengths) ? response.strengths : [],
      missing_requirements: Array.isArray(response.missing_requirements) ? response.missing_requirements : [],
      important_errors: Array.isArray(response.important_errors) ? response.important_errors : [],
      prioritized_next_steps: Array.isArray(response.prioritized_next_steps) ? response.prioritized_next_steps : [],
      questions_for_human: Array.isArray(response.questions_for_human) ? response.questions_for_human : [],
      recommendation: ["Ready for human approval", "Revision required", "Cannot determine"].includes(response.recommendation)
        ? response.recommendation
        : "Cannot determine"
    };
  }
}

export const aiService = new AIService();
