# Product Requirements Document (PRD)
## ResumeIQ — AI-Powered Resume Testing & Scoring Platform

**Version:** 1.0  
**Author:** AddizTech  
**Date:** August 2026  
**Status:** Current Implementation  

---

## 1. Executive Summary

ResumeIQ is a web-based SaaS application that helps job seekers evaluate their resumes against Applicant Tracking Systems (ATS) and job descriptions. Users upload their resume (PDF, DOCX, or TXT), optionally paste a job description, and receive a comprehensive analysis including an overall score, category breakdowns, identified issues, keyword gap analysis, and improvement suggestions. The platform also supports PDF report generation and resume text enhancement via AI.

---

## 2. Problem Statement

- **75% of resumes** are rejected by ATS systems before a human ever sees them due to formatting, keyword, or structural issues.
- Job seekers lack accessible tools to test their resumes against ATS parsers and job descriptions.
- Existing solutions are either too expensive, too complex, or don't provide actionable feedback.
- Manual resume review is time-consuming and inconsistent.

---

## 3. Target Users

| Persona | Description |
|---------|-------------|
| **Job Seekers** | Active applicants who want to optimize resumes before applying |
| **Career Changers** | Professionals transitioning industries who need keyword alignment |
| **Students/Graduates** | Entry-level candidates building their first resume |
| **Freelancers** | Independent workers tailoring resumes for specific contracts |

---

## 4. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Help users improve ATS pass rate | Resume score improvement after suggestions | 20%+ avg improvement |
| Fast analysis turnaround | Time from upload to results | < 10 seconds |
| High user satisfaction | Return usage rate | 40%+ users return |
| Accessible to all | Zero-config startup (no API keys required) | 100% functionality without keys |

---

## 5. Feature Requirements

### 5.1 Core Features (MVP — Implemented)

#### F-001: User Authentication
- **Description:** Email/password registration and login with Firebase Authentication
- **Priority:** P0 (Critical)
- **Implementation:** Firebase Auth (email/password + Google OAuth)
- **User Flow:**
  1. User lands on login page
  2. Enters credentials or signs in with Google
  3. On success, redirected to analyze page
  4. Auth token stored in localStorage for API calls
- **Pages:** `login.html`, `signup.html`

#### F-002: Resume Upload & Parsing
- **Description:** Multi-format resume upload with server-side text extraction
- **Priority:** P0 (Critical)
- **Supported Formats:** PDF, DOCX, TXT
- **File Size Limit:** 5MB
- **Implementation:**
  - PDF: `pdfjs-dist` (primary) with raw binary extraction fallback
  - DOCX: `mammoth` library
  - TXT: Direct buffer read
- **Edge Cases:**
  - Empty/unreadable files → 422 error
  - Corrupted PDFs → fallback extraction → 422 if still empty
  - Unsupported formats → 400 error

#### F-003: ATS Compatibility Analysis
- **Description:** Automated scoring of resume against ATS parser requirements
- **Priority:** P0 (Critical)
- **Engine:** `atsEngine.js` (local heuristic)
- **Checks Performed:**
  - File format validation (PDF/DOCX preferred)
  - Contact info detection (email, phone, LinkedIn, location)
  - Section header detection (Experience, Education, Skills, Summary, Projects)
  - Multi-column/table layout detection
  - Image/graphics detection
  - Resume length validation (word count, page count)
  - Bullet point vs paragraph ratio
- **Output:** `atsScore` (0-20), `structureScore` (0-20), array of issues

#### F-004: AI Content Analysis
- **Description:** Deep analysis of resume writing quality, action verbs, and quantifiable achievements
- **Priority:** P0 (Critical)
- **Engine:** `aiEngine.js` with multi-provider support
- **AI Providers (in order of priority):**
  1. Anthropic Claude (claude-3-5-sonnet)
  2. Google Gemini (gemini-2.5-flash)
  3. Local heuristic fallback (zero-config)
- **Checks Performed:**
  - Weak/passive verb detection
  - Strong action verb count
  - Quantifiable achievements (numbers, percentages, $)
  - Passive voice detection
  - Redundant/outdated phrase detection
  - Section-wise quality scoring
- **Output:** `contentScore` (0-25), `keywordMatchScore` (0-25), issues, rewrite suggestions, section analysis

#### F-005: Job Description Keyword Matching
- **Description:** Compare resume against pasted job description for keyword gaps
- **Priority:** P1 (High)
- **Implementation:**
  - Extracts tech keywords from JD (500+ keyword dictionary)
  - Calculates match percentage
  - Lists missing keywords
- **Scoring:** Only active when JD is provided; excluded from overall score otherwise
- **Output:** `matchPercent`, `missingKeywords[]`

#### F-006: Overall Score Calculation
- **Description:** Composite score from all analysis categories
- **Priority:** P0 (Critical)
- **Scoring Formula:**
  - **With JD:** `(ats + structure + content + keywordMatch) / 85 * 100`
  - **Without JD:** `(ats + structure + content) / 60 * 100`
- **Score Range:** 0-100 (capped)
- **Grades:**
  - 85+ → Strong
  - 70-84 → Good
  - 50-69 → Fair
  - <50 → Needs Work

#### F-007: PDF Report Generation
- **Description:** Downloadable PDF report of complete analysis
- **Priority:** P1 (High)
- **Engine:** `pdfkit`
- **Report Contents:**
  - Header with timestamp
  - Overall score hero box with grade
  - Sub-category breakdowns (ATS, Content, Structure, JD Keyword Match)
  - JD keyword matching analysis (if applicable)
  - Detailed issues & recommendations with severity badges
  - Rewrite suggestions with before/after comparisons
- **Endpoint:** `POST /api/report/pdf`

#### F-008: Resume Text Improvement
- **Description:** AI-powered resume rewriting for clarity, impact, and ATS readability
- **Priority:** P2 (Medium)
- **Endpoint:** `POST /api/improve`
- **Capabilities:**
  - Replace weak phrases with strong action verbs
  - Fix grammatical errors
  - Tighten wordy sentences
  - Preserve original structure
  - Optional JD-aware keyword injection
- **Output:** Improved resume text

#### F-009: Role-Based Pre-fill
- **Description:** Quick-start templates that pre-fill job descriptions for common roles
- **Priority:** P2 (Medium)
- **Supported Roles:** 6 pre-configured
  - Software Engineer (15+ keywords)
  - Data Scientist (15+ keywords)
  - Product Manager (14+ keywords)
  - UI/UX Designer (13+ keywords)
  - Marketing Manager (13+ keywords)
  - Finance Analyst (14+ keywords)

### 5.2 Frontend Features

#### F-010: Landing Page
- **Description:** Marketing page with hero, features, how-it-works, and role cards
- **Priority:** P0 (Critical)
- **Sections:**
  - Hero with CTA buttons
  - "What the scanner checks" (3-card grid)
  - "How it works" (3-step timeline)
  - "What you get" (4 feature cards)
  - "Quick-start by role" (6 role cards)

#### F-011: Analyze Page
- **Description:** Main analysis interface with upload, results display, and actions
- **Priority:** P0 (Critical)
- **UI Components:**
  - Resume file upload area
  - Job description text area (optional)
  - Analysis results dashboard
  - Score visualization
  - Issues list with severity indicators
  - Rewrite suggestions
  - Section analysis breakdown
  - Download PDF button
  - Improve Resume button

#### F-012: Animations & UX
- **Description:** Smooth, modern UI with scroll animations
- **Priority:** P2 (Medium)
- **Libraries Used:**
  - GSAP (scroll-triggered animations)
  - Lenis (smooth scrolling)
  - Lucide Icons

---

## 6. Architecture

### 6.1 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JS |
| **Backend** | Node.js, Express.js |
| **Authentication** | Firebase Auth (email/password, Google OAuth) |
| **File Upload** | Multer (memory storage) |
| **PDF Parsing** | pdfjs-dist (primary), raw binary fallback |
| **DOCX Parsing** | mammoth |
| **AI Engine** | Anthropic Claude, Google Gemini, Local Heuristic |
| **PDF Generation** | PDFKit |
| **Hosting** | Vercel (serverless) |

### 6.2 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/analyze` | Token | Upload resume + optional JD → full analysis |
| `POST` | `/api/improve` | Token | Submit resume text → improved version |
| `POST` | `/api/report/pdf` | Token | Submit analysis data → PDF download |
| `GET` | `*` | — | Serves login.html (SPA fallback) |

### 6.3 Project Structure

```
ResumeIQ/
├── server.js              # Express server, routes, middleware
├── atsEngine.js           # ATS compatibility analysis (local)
├── aiEngine.js            # AI analysis (Claude/Gemini/Heuristic)
├── pdfGenerator.js        # PDF report generation
├── api/
│   └── index.js           # Vercel serverless function entry
├── public/
│   ├── index.html         # Landing page
│   ├── login.html         # Login page
│   ├── signup.html        # Signup page
│   ├── analyze.html       # Main analysis page
│   ├── css/style.css      # Global styles
│   └── js/
│       ├── auth.js        # Firebase auth logic
│       ├── landing.js     # Landing page interactions
│       └── app.js         # Analyze page logic
├── .env                   # Environment variables (local)
├── .env.example           # Env template
├── vercel.json            # Vercel deployment config
├── package.json           # Dependencies & scripts
└── sample_resume.txt      # Test resume file
```

---

## 7. Data Flow

```
User Uploads Resume
        │
        ▼
┌─────────────────────┐
│   File Validation   │──→ 400 (invalid format)
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│   Text Extraction   │──→ 422 (empty/corrupt)
│  (PDF/DOCX/TXT)     │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│   ATS Analysis      │──→ atsScore, structureScore, issues
│   (atsEngine.js)    │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│   AI Analysis       │──→ contentScore, keywordMatchScore, issues,
│   (aiEngine.js)     │    rewriteSuggestions, sectionAnalysis
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│   Score Calculation │──→ overallScore, categoryScores
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│   Response JSON     │──→ Frontend renders results
└─────────────────────┘
```

---

## 8. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `ANTHROPIC_API_KEY` | No | Anthropic Claude API key (enables AI analysis) |
| `GEMINI_API_KEY` | No | Google Gemini API key (fallback AI provider) |

**Note:** App works without any API keys using the local heuristic engine.

---

## 9. Scoring System

### Category Weights

| Category | Max Points | Description |
|----------|------------|-------------|
| ATS Compatibility | 20 | File format, parseability, layout |
| Structure | 20 | Contact info, sections, length, formatting |
| Content Quality | 25 | Action verbs, achievements, writing quality |
| JD Keyword Match | 25 | Keyword overlap with job description (optional) |

### Overall Score Calculation

```javascript
if (jobDescription provided) {
  overallScore = (ats + structure + content + keywordMatch) / 85 * 100
} else {
  overallScore = (ats + structure + content) / 60 * 100
  keywordMatch = 0  // excluded
}
```

---

## 10. Security Considerations

| Concern | Implementation |
|---------|----------------|
| API Authentication | Bearer token required on all `/api/*` endpoints |
| File Size Limits | 5MB max upload |
| File Type Validation | Server-side extension + content validation |
| API Key Storage | Environment variables only (never committed) |
| CORS | Enabled (configurable) |
| Resume Privacy | No resume data stored; processed in-memory only |

---

## 11. Deployment

### Vercel Configuration (`vercel.json`)
- Serverless function entry via `api/index.js`
- Static file serving from `public/`
- Environment variables configured in Vercel dashboard

### Local Development
```bash
npm install
npm run dev    # Uses Node --watch for auto-reload
```

---

## 12. Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| No persistent user data | Analysis history not saved | None (by design — privacy-focused) |
| No rate limiting | Potential API abuse | Implement middleware in future |
| AI API costs | Per-analysis cost with Claude/Gemini | Local heuristic fallback |
| PDF image extraction | Cannot extract text from image-only PDFs | Manual text input |
| No mobile app | Desktop-only experience | Responsive web design |
| No resume storage | Users can't revisit past analyses | Download PDF report |

---

## 13. Future Enhancements (Backlog)

### P1 — High Priority
- [ ] Rate limiting middleware
- [ ] Analysis history with database persistence
- [ ] Multiple resume comparison
- [ ] Custom keyword dictionary editor
- [ ] Batch resume processing

### P2 — Medium Priority
- [ ] Resume template builder
- [ ] Cover letter analysis
- [ ] LinkedIn profile analysis
- [ ] Integration with job boards (Indeed, LinkedIn)
- [ ] Email delivery of PDF reports

### P3 — Low Priority
- [ ] Mobile responsive overhaul
- [ ] PWA support
- [ ] Multi-language support
- [ ] Resume versioning
- [ ] Team/enterprise accounts

---

## 14. Metrics & Analytics (Recommended)

| Metric | Purpose |
|--------|---------|
| Uploads per day | Usage volume |
| Avg analysis time | Performance monitoring |
| Score distribution | User resume quality insights |
| AI fallback rate | API reliability tracking |
| PDF download rate | Feature adoption |
| Return user rate | User retention |

---

## 15. Appendix

### A. Sample API Response

```json
{
  "overallScore": 72,
  "categoryScores": {
    "ats": 18,
    "structure": 16,
    "content": 20,
    "keywordMatch": 18
  },
  "issues": [
    {
      "category": "ats",
      "severity": "warning",
      "title": "Multi-column Layout Detected",
      "description": "Signs of side-by-side columns found.",
      "suggestion": "Use single-column format for ATS compatibility.",
      "location": "Formatting & Layout"
    }
  ],
  "keywordMatch": {
    "matchPercent": 65,
    "missingKeywords": ["Docker", "Kubernetes", "CI/CD"]
  },
  "rewriteSuggestions": [
    {
      "original": "Responsible for writing code",
      "Improved": "Engineered responsive backend systems"
    }
  ],
  "sectionAnalysis": {
    "experience": {
      "label": "Experience",
      "score": 7,
      "wordCount": 120,
      "readiness": "Average"
    }
  },
  "isFallback": false,
  "extractedText": "..."
}
```

### B. Dependencies

```json
{
  "@anthropic-ai/sdk": "^0.22.0",
  "@google/genai": "^2.11.0",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.19.2",
  "mammoth": "^1.7.2",
  "multer": "^1.4.5-lts.1",
  "pdfkit": "^0.15.0",
  "pdfjs-dist": "^6.1.200"
}
```

---

*Document generated by AddizTech — August 2026*
