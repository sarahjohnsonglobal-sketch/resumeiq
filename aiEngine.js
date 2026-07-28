const { GoogleGenAI } = require('@google/genai');
const Anthropic = require('@anthropic-ai/sdk');

// Cache system config
const SYSTEM_PROMPT = `Analyze the resume text (and optional job description) and return a strict JSON response. No text outside the JSON.

JSON Schema:
{
  "contentScore": number, // out of 25. Score based on action verbs, quantified results, active voice, and lack of filler.
  "keywordMatchScore": number, // out of 25. Return 0 if no job description provided.
  "issues": [
    {
      "category": "content",
      "severity": "critical" | "warning" | "suggestion",
      "title": "string",
      "description": "string",
      "suggestion": "string",
      "location": "string" // e.g. "Experience Section", "Summary", "Bullet 2"
    }
  ],
  "keywordMatch": {
    "matchPercent": number,
    "missingKeywords": ["string"]
  },
  "rewriteSuggestions": [
    {
      "original": "string",
      "improved": "string"
    }
  ]
}

Rules:
1. Flag passive voice ("was responsible for", "helped with") and weak verbs.
2. Check for quantified achievements (numbers, percentages, dollar amounts).
3. If job description provided: extract key skills, compare against resume, list missing ones.
4. Be direct and specific in suggestions. Avoid generic advice.`;

/**
 * Main AI Analysis interface
 */
async function analyzeAI(resumeText, jobDescription = '') {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;

  if (hasAnthropic) {
    try {
      console.log('Running analysis with Anthropic Claude API...');
      return await analyzeWithAnthropic(resumeText, jobDescription);
    } catch (error) {
      console.error('Anthropic API failed, trying fallback...', error);
      if (hasGemini) {
        try {
          console.log('Running fallback analysis with Gemini API...');
          return await analyzeWithGemini(resumeText, jobDescription);
        } catch (geminiError) {
          console.error('Gemini API fallback also failed. Using local analysis engine...', geminiError);
        }
      }
    }
  } else if (hasGemini) {
    try {
      console.log('Running analysis with Gemini API...');
      return await analyzeWithGemini(resumeText, jobDescription);
    } catch (error) {
      console.error('Gemini API failed. Using local analysis engine...', error);
    }
  }

  // Fallback to local heuristic analyzer if no keys or API failed
  console.log('Using local analysis engine (fallback)...');
  return runHeuristicAI(resumeText, jobDescription);
}

/**
 * Anthropic Claude API integration
 */
async function analyzeWithAnthropic(resumeText, jobDescription) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const prompt = `Resume Content:
"""
${resumeText}
"""

Job Description (Optional):
${jobDescription ? `"""\n${jobDescription}\n"""` : 'Not provided.'}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 4000,
    temperature: 0.1,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }]
  });

  const content = message.content[0].text;
  return parseJSONResponse(content);
}

/**
 * Google Gemini API integration
 */
async function analyzeWithGemini(resumeText, jobDescription) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const prompt = `Resume Content:
"""
${resumeText}
"""

Job Description (Optional):
${jobDescription ? `"""\n${jobDescription}\n"""` : 'Not provided.'}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json'
    }
  });

  const text = response.text;
  return parseJSONResponse(text);
}

/**
 * Helper to safely extract JSON from LLM response
 */
function parseJSONResponse(text) {
  try {
    // Look for JSON block if returned with markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse AI JSON response:', text);
    throw new Error('Invalid JSON format from AI');
  }
}

/**
 * Local Heuristic engine that simulates AI analysis using word scanning and regex.
 * Extremely useful as a fallback and for zero-config startup.
 */
function runHeuristicAI(text, jobDescription) {
  const issues = [];
  const normalizedText = text.toLowerCase();
  const lines = text.split(/\r?\n/);
  
  let contentScore = 20;

  // Check if resume is very short
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 50) {
    contentScore -= 12;
    issues.push({
      category: 'content',
      severity: 'critical',
      title: 'Resume is Nearly Empty',
      description: `Your resume contains only ${wordCount} words. A proper resume needs substantial content.`,
      suggestion: 'Add your work experience, education, skills, and achievements with proper detail. Aim for at least 300-500 words.',
      location: 'Overall Content'
    });
  } else if (wordCount < 150) {
    contentScore -= 7;
    issues.push({
      category: 'content',
      severity: 'critical',
      title: 'Resume Has Very Little Content',
      description: `Your resume has only ${wordCount} words.`,
      suggestion: 'Expand your resume with detailed descriptions of your roles, responsibilities, and accomplishments. Target 300-800 words.',
      location: 'Overall Content'
    });
  }

  // 1. Weak Action Verbs Check
  const weakVerbs = ['responsible for', 'assisted with', 'helped with', 'duties included', 'worked on', 'handled', 'managed the', 'participated in'];
  const detectedWeakVerbs = [];
  
  for (const verb of weakVerbs) {
    if (normalizedText.includes(verb)) {
      detectedWeakVerbs.push(verb);
    }
  }

  if (detectedWeakVerbs.length > 0) {
    contentScore -= 5;
    issues.push({
      category: 'content',
      severity: 'warning',
      title: 'Weak or Passive Action Phrases',
      description: `We detected phrases like: "${detectedWeakVerbs.slice(0, 3).join('", "')}".`,
      suggestion: 'Replace passive language with strong action verbs (e.g., "orchestrated", "engineered", "streamlined") at the start of your bullet points.',
      location: 'Experience Section'
    });
  }

  // Check for strong action verbs count
  const strongActionVerbs = ['achieved', 'improved', 'led', 'managed', 'created', 'developed', 'implemented', 'designed', 'launched', 'delivered', 'increased', 'reduced', 'generated', 'transformed', 'optimized', 'spearheaded', 'engineered', 'orchestrated', 'streamlined', 'accelerated', 'pioneered', 'established', 'produced', 'drove', 'built'];
  let strongVerbCount = 0;
  for (const verb of strongActionVerbs) {
    const regex = new RegExp(`\\b${verb}\\b`, 'gi');
    if (regex.test(normalizedText)) {
      strongVerbCount++;
    }
  }
  if (strongVerbCount < 2 && wordCount > 100) {
    contentScore -= 4;
    issues.push({
      category: 'content',
      severity: 'warning',
      title: 'Few Strong Action Verbs',
      description: `Found only ${strongVerbCount} strong action verb(s). Strong action verbs make your impact clear.`,
      suggestion: 'Use powerful action verbs like "spearheaded", "engineered", "optimized", "delivered" to start each bullet point and convey strong ownership.',
      location: 'Experience Section'
    });
  }

  // 2. Quantifiable Achievements Check (Looking for percentages or numbers)
  const numbersRegex = /\b\d+(%|\+)?\b/g;
  const numbersCount = (text.match(numbersRegex) || []).length;
  
  if (numbersCount < 3) {
    contentScore -= 5;
    issues.push({
      category: 'content',
      severity: 'critical',
      title: 'Lack of Quantifiable Achievements',
      description: 'Your resume lists responsibilities but lacks metrics or quantifiable business outcomes.',
      suggestion: 'Add numbers, percentages, or dollar amounts to prove your impact (e.g., "reduced latency by 20%", "led a team of 4", "saved $5,000 annually").',
      location: 'Experience Section'
    });
  }

  // 3. Passive Voice Detection Heuristic
  const passiveVoiceRegex = /\b(was|were|been|is|are|am)\s+([a-z]+ed)\b/gi;
  const passiveMatches = text.match(passiveVoiceRegex) || [];
  if (passiveMatches.length > 1) {
    contentScore -= 3;
    issues.push({
      category: 'content',
      severity: 'suggestion',
      title: 'Passive Voice Detected',
      description: `Found passive phrases such as: "${passiveMatches.slice(0, 2).join('", "')}".`,
      suggestion: 'Rewrite sentences to use active voice to make your contributions feel direct and impactful (e.g., "Led team of 5" instead of "Team of 5 was led by me").',
      location: 'Experience Section'
    });
  }

  // 4. Grammar / Spelling (Simple heuristics or common mistakes)
  // Let's add a generic warning if some common resume mistakes occur
  if (normalizedText.includes('curriculum vitae') || normalizedText.includes('references available upon request')) {
    issues.push({
      category: 'content',
      severity: 'suggestion',
      title: 'Redundant Phrases Included',
      description: 'Found traditional but outdated elements (e.g., "References available upon request" or "CV" title).',
      suggestion: 'Remove these elements to save space. Recruiters assume references are available, and stating it is outdated.',
      location: 'Footer / Summary'
    });
  }

  // 5. Keyword Match against Job Description
  let matchPercent = 0;
  let keywordMatchScore = 0;
  const missingKeywords = [];
  const suggestions = [];

  if (jobDescription && jobDescription.trim().length > 0) {
    const normalizedJD = jobDescription.toLowerCase();
    
    // Core tech keywords to test semantic matching locally
    const techKeywords = [
      'javascript', 'python', 'java', 'c++', 'typescript', 'react', 'vue', 'angular', 'node', 'express', 
      'nest', 'mongodb', 'postgresql', 'mysql', 'sql', 'sqlite', 'aws', 'docker', 'kubernetes', 'git', 
      'agile', 'scrum', 'jira', 'ci/cd', 'devops', 'cloud', 'machine learning', 'data science', 'html', 
      'css', 'sass', 'tailwind', 'bootstrap', 'webpack', 'vite', 'figma', 'graphql', 'rest api', 'graphql',
      'redis', 'elasticsearch', 'testing', 'jest', 'cypress', 'project management', 'ui/ux', 'redistribution',
      'communication', 'leadership', 'teamwork', 'problem solving', 'analytical', 'product owner', 'product manager'
    ];

    const jdKeywords = [];
    for (const kw of techKeywords) {
      if (normalizedJD.includes(kw)) {
        jdKeywords.push(kw);
      }
    }

    // Check how many of the JD keywords are in the resume
    if (jdKeywords.length > 0) {
      let matchedCount = 0;
      for (const kw of jdKeywords) {
        if (normalizedText.includes(kw)) {
          matchedCount++;
        } else {
          // Capitalize first letters of keyword for output
          const formattedKw = kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          missingKeywords.push(formattedKw);
        }
      }
      
      matchPercent = Math.round((matchedCount / jdKeywords.length) * 100);
      keywordMatchScore = Math.round((matchPercent / 100) * 25);
    } else {
      // General fallbacks if no matched tech keywords found in JD text
      matchPercent = 50;
      keywordMatchScore = 12;
      missingKeywords.push('Leadership', 'Agile Methodologies', 'Key Deliverables');
    }
  }

  // Ensure content score doesn't fall below 0
  contentScore = Math.max(0, contentScore);

  // Generate rewrite suggestions based on scanned text
  const rewriteSuggestions = [];

  // Try to find actual weak lines from the resume
  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    if (trimmed.length < 20 || trimmed.length > 150) continue;

    if (lower.includes('responsible for')) {
      rewriteSuggestions.push({
        original: trimmed,
        improved: trimmed.replace(/responsible for/gi, 'Led')
      });
      break;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    if (trimmed.length < 20 || trimmed.length > 150) continue;

    if (lower.includes('assisted with') || lower.includes('helped with')) {
      rewriteSuggestions.push({
        original: trimmed,
        improved: trimmed.replace(/assisted with|helped with/gi, 'Collaborated on')
      });
      break;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    if (trimmed.length < 20 || trimmed.length > 150) continue;

    if (lower.includes('worked on')) {
      rewriteSuggestions.push({
        original: trimmed,
        improved: trimmed.replace(/worked on/gi, 'Built')
      });
      break;
    }
  }

  // Fallback only if nothing was found
  if (rewriteSuggestions.length === 0 && wordCount > 50) {
    rewriteSuggestions.push({
      original: 'Add specific numbers to your experience bullets.',
      improved: 'Try including metrics like team size, revenue impact, or percentage improvements to make your contributions more concrete.'
    });
  }

  // Section-wise analysis
  const sectionAnalysis = analyzeSections(text, issues);

  return {
    contentScore,
    keywordMatchScore,
    issues,
    keywordMatch: {
      matchPercent,
      missingKeywords: missingKeywords.slice(0, 5)
    },
    rewriteSuggestions: rewriteSuggestions.slice(0, 3),
    sectionAnalysis
  };
}

/**
 * Analyzes each section of the resume individually
 */
function analyzeSections(text, globalIssues) {
  const normalizedText = text.toLowerCase();
  const lines = text.split(/\r?\n/);
  const sections = {};
  let currentSection = null;

  // Define section headers to detect
  const sectionDefs = {
    summary: { keywords: ['professional summary', 'summary', 'profile', 'objective', 'about me'], label: 'Professional Summary' },
    experience: { keywords: ['experience', 'work history', 'employment history', 'professional experience', 'career history', 'work experience'], label: 'Experience' },
    education: { keywords: ['education', 'academic background', 'academic history', 'degrees', 'qualifications'], label: 'Education' },
    skills: { keywords: ['skills', 'core competencies', 'technical skills', 'skills & tools', 'areas of expertise', 'expertise'], label: 'Skills' },
    projects: { keywords: ['projects', 'key projects', 'academic projects', 'personal projects', 'project'], label: 'Projects' }
  };

  // Parse text into sections
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let matched = false;
    for (const [key, def] of Object.entries(sectionDefs)) {
      if (def.keywords.some(kw => trimmed.toLowerCase() === kw || trimmed.toLowerCase().startsWith(kw + ':') || trimmed.toLowerCase().startsWith(kw + '\n') || trimmed.toLowerCase().startsWith(kw + ' '))) {
        currentSection = key;
        if (!sections[key]) {
          sections[key] = { label: def.label, content: [], raw: '' };
        }
        matched = true;
        break;
      }
    }
    if (!matched && currentSection) {
      sections[currentSection].content.push(trimmed);
    }
  }

  // Build raw text per section
  for (const key of Object.keys(sections)) {
    sections[key].raw = sections[key].content.join('\n');
  }

  // If no sections found, try fallback detection with Contains
  if (Object.keys(sections).length === 0) {
    for (const [key, def] of Object.entries(sectionDefs)) {
      for (const kw of def.keywords) {
        if (normalizedText.includes(kw)) {
          // Find the section content
          const idx = normalizedText.indexOf(kw);
          const beforeKw = normalizedText.substring(0, idx);
          const afterKw = normalizedText.substring(idx + kw.length);
          const nextSectionIdx = afterKw.search(/\n\n/);
          const content = nextSectionIdx > -1 ? afterKw.substring(0, nextSectionIdx) : afterKw;
          sections[key] = { label: def.label, content: [content.trim()], raw: content.trim() };
          break;
        }
      }
    }
  }

  // Analyze each section
  const results = {};
  const strongActionVerbs = ['achieved', 'improved', 'led', 'managed', 'created', 'developed', 'implemented', 'designed', 'launched', 'delivered', 'increased', 'reduced', 'generated', 'transformed', 'optimized', 'spearheaded', 'engineered', 'orchestrated', 'streamlined', 'accelerated', 'pioneered', 'established', 'produced', 'drove', 'built'];
  const weakVerbs = ['responsible for', 'assisted with', 'helped with', 'duties included', 'worked on', 'handled', 'managed the', 'participated in'];

  for (const [key, section] of Object.entries(sections)) {
    const sText = section.raw.toLowerCase();
    const sWords = sText.split(/\s+/).filter(w => w.length > 0);
    const sWordCount = sWords.length;

    let score = 10;
    const secIssues = [];

    // Check word count
    if (key === 'summary') {
      if (sWordCount < 30) {
        score -= 3;
        secIssues.push('Too short. Add 2-3 lines highlighting your key strengths, years of experience, and top achievements.');
      }
      for (const v of weakVerbs) {
        if (sText.includes(v)) {
          score -= 2;
          secIssues.push('Avoid weak phrases in your summary. Use confident, impact-driven language.');
          break;
        }
      }
    }

    if (key === 'experience') {
      if (sWordCount < 50) {
        score -= 4;
        secIssues.push('Very light. Add detailed bullet points with responsibilities and achievements for each role.');
      }
      for (const v of weakVerbs) {
        if (sText.includes(v)) {
          score -= 2;
          secIssues.push(`Replace "${v}" with strong action verbs like "spearheaded", "engineered", "delivered".`);
          break;
        }
      }
      let svCount = 0;
      for (const v of strongActionVerbs) {
        const re = new RegExp(`\\b${v}\\b`, 'gi');
        if (re.test(sText)) svCount++;
      }
      if (svCount < 2) {
        score -= 2;
        secIssues.push('Use more strong action verbs to describe your contributions.');
      }
    }

    if (key === 'skills' && sWordCount < 10) {
      score -= 2;
      secIssues.push('Too few skills listed (only ' + sWordCount + ' words). Add more relevant technical and soft skills.');
    }

    if (key === 'education' && sWordCount < 15) {
      score -= 2;
      secIssues.push('Minimal details. Add degree, institution, graduation year, and relevant coursework.');
    }

    // Check metrics/numbers
    const numbers = sText.match(/\b\d+(%|\+)?\b/g) || [];
    if (key === 'experience' && numbers.length < 2) {
      score -= 2;
      secIssues.push('Add measurable achievements with numbers (e.g., "reduced costs by 20%", "led team of 5").');
    }
    if (key === 'summary' && numbers.length < 1 && sWordCount > 10) {
      score -= 1;
      secIssues.push('Consider adding a key metric or years of experience to make your summary more impactful.');
    }

    // Determine job-readiness
    let readiness = 'weak';
    let readinessClass = 'severity-badge critical';
    if (score >= 8) {
      readiness = 'Strong';
      readinessClass = 'severity-badge suggestion';
    } else if (score >= 5) {
      readiness = 'Average';
      readinessClass = 'severity-badge warning';
    }

    results[key] = {
      label: section.label,
      score: Math.max(0, score),
      wordCount: sWordCount,
      issues: secIssues,
      readiness,
      readinessClass
    };
  }

  // If a section wasn't found, add it as missing
  for (const [key, def] of Object.entries(sectionDefs)) {
    if (!results[key]) {
      if (key === 'projects') continue; // optional
      results[key] = {
        label: def.label,
        score: 0,
        wordCount: 0,
        issues: [`No "${def.label}" section found. Add this section to improve your resume.`],
        readiness: 'Missing',
        readinessClass: 'severity-badge critical'
      };
    }
  }

  return results;
}

/**
 * Main AI CV Improvement interface
 */
async function improveAI(resumeText, jobDescription = '') {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;

  if (hasAnthropic) {
    try {
      console.log('Running CV improvement with Anthropic Claude API...');
      return await improveWithAnthropic(resumeText, jobDescription);
    } catch (error) {
      console.error('Anthropic CV improvement failed, trying fallback...', error);
      if (hasGemini) {
        try {
          console.log('Running fallback CV improvement with Gemini API...');
          return await improveWithGemini(resumeText, jobDescription);
        } catch (geminiError) {
          console.error('Gemini API fallback also failed. Using local improvement engine...', geminiError);
        }
      }
    }
  } else if (hasGemini) {
    try {
      console.log('Running CV improvement with Gemini API...');
      return await improveWithGemini(resumeText, jobDescription);
    } catch (error) {
      console.error('Gemini API failed. Using local improvement engine...', error);
    }
  }

  // Fallback to local heuristic improver if no keys or API failed
  console.log('Using local CV improvement engine...');
  return runHeuristicImprovement(resumeText, jobDescription);
}

/**
 * Anthropic CV Improvement
 */
async function improveWithAnthropic(resumeText, jobDescription) {
  const Anthropic = require('@anthropic-ai/sdk');
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const prompt = `Resume Content:
"""
${resumeText}
"""

Job Description (Optional):
${jobDescription ? `"""\n${jobDescription}\n"""` : 'Not provided.'}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 4000,
    temperature: 0.2,
    system: IMPROVE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }]
  });

  return message.content[0].text;
}

/**
 * Gemini CV Improvement
 */
async function improveWithGemini(resumeText, jobDescription) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const prompt = `Resume Content:
"""
${resumeText}
"""

Job Description (Optional):
${jobDescription ? `"""\n${jobDescription}\n"""` : 'Not provided.'}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: IMPROVE_SYSTEM_PROMPT
    }
  });

  return response.text;
}

/**
 * Local Heuristic CV Improver
 */
function runHeuristicImprovement(text, jobDescription) {
  let improvedText = text;

  const replacements = [
    {
      regex: /was responsible for writing code/gi,
      replacement: 'Engineered responsive backend systems and developed reusable code modules'
    },
    {
      regex: /responsible for/gi,
      replacement: 'Spearheaded'
    },
    {
      regex: /assisted with/gi,
      replacement: 'Collaborated on and streamlined'
    },
    {
      regex: /helped with/gi,
      replacement: 'Partnered with cross-functional teams to improve'
    },
    {
      regex: /worked on/gi,
      replacement: 'Orchestrated and executed'
    },
    {
      regex: /handled/gi,
      replacement: 'Managed and optimized'
    },
    {
      regex: /duties included/gi,
      replacement: 'Led high-priority deliverables including'
    },
    {
      regex: /managed the/gi,
      replacement: 'Orchestrated the development and deployment of'
    },
    {
      regex: /participated in/gi,
      replacement: 'Contributed to strategic initiatives in'
    }
  ];

  for (const rep of replacements) {
    improvedText = improvedText.replace(rep.regex, rep.replacement);
  }

  let header = '';
  if (jobDescription && jobDescription.trim().length > 0) {
    header = `[OPTIMIZED FOR TARGET JOB]\n\n`;
    const techKeywords = ['react', 'vue', 'angular', 'node', 'express', 'aws', 'docker', 'kubernetes', 'typescript', 'mongodb', 'postgresql', 'mysql'];
    const normalizedJD = jobDescription.toLowerCase();
    const normalizedText = text.toLowerCase();
    const addedSkills = [];
    for (const kw of techKeywords) {
      if (normalizedJD.includes(kw) && !normalizedText.includes(kw)) {
        addedSkills.push(kw.toUpperCase());
      }
    }
    if (addedSkills.length > 0) {
      improvedText = improvedText.replace(/skills:/gi, `Skills:\n- ${addedSkills.join(', ')} (Added for JD match)\n-`);
    }
  } else {
    header = `[IMPROVED]\n\n`;
  }

  return header + improvedText;
}

const IMPROVE_SYSTEM_PROMPT = `You are a professional resume editor. Take the provided resume text and improve it for clarity, impact, and ATS readability.

Instructions:
1. Fix grammatical errors and spelling mistakes.
2. Replace weak phrases like "was responsible for", "worked on" with direct action verbs.
3. Tighten wordy sentences. Remove filler words.
4. Keep the original structure and section headers intact.
5. Do NOT invent metrics, numbers, or achievements that aren't in the original text. Only enhance what's already there.
6. Keep formatting clean with clear section headers.

Return only the improved resume text. No intro, outro, or markdown wrapping.`;

module.exports = {
  analyzeAI,
  improveAI
};
