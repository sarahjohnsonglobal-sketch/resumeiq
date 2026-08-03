const fs = require('fs');

function analyzeATS(text, fileExtension, pdfInfo = {}, fileBuffer = null) {
  const issues = [];
  let atsScore = 20;
  let structureScore = 20;

  const normalizedText = text.toLowerCase();
  const fileExt = fileExtension.toLowerCase().replace('.', '');

  // File format check
  if (fileExt !== 'pdf' && fileExt !== 'docx') {
    atsScore -= 8;
    issues.push({
      category: 'ats',
      severity: 'critical',
      title: 'Suboptimal File Format',
      description: 'Your resume was uploaded in a non-standard format.',
      suggestion: 'Save and upload your resume as a PDF (.pdf) or Word document (.docx) to ensure ATS parsers can read it properly.',
      location: 'File Metadata'
    });
  }

  // Contact info check
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}/g; // general phone
  const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi;
  
  const hasEmail = emailRegex.test(text);
  const hasPhone = phoneRegex.test(text);
  const hasLinkedIn = linkedinRegex.test(text);
  
  // Location check — pattern-based + keyword-based
  // 1. Regex: detect "City, State/Country/Province" pattern (e.g. "Chishtian, Punjab, Pakistan")
  const locationPatternRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)?/g;
  const locationPatternMatches = text.match(locationPatternRegex) || [];
  
  // 2. Keyword-based: expanded list covering more countries and cities
  const locationKeywords = [
    // US States
    'alaska', 'alabama', 'arkansas', 'arizona', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'iowa', 'idaho', 'illinois', 'indiana', 'kansas', 'kentucky', 'louisiana', 'massachusetts', 'maryland', 'maine', 'michigan', 'minnesota', 'missouri', 'mississippi', 'montana', 'north carolina', 'north dakota', 'nebraska', 'new hampshire', 'new jersey', 'new mexico', 'nevada', 'new york', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'virginia', 'vermont', 'washington', 'wisconsin', 'west virginia', 'wyoming',
    // Major world cities
    'london', 'toronto', 'sydney', 'singapore', 'berlin', 'paris', 'tokyo', 'mumbai', 'bangalore', 'delhi', 'san francisco', 'seattle', 'boston', 'chicago', 'los angeles', 'austin', 'denver', 'atlanta',
    // Pakistan
    'pakistan', 'punjab', 'sindh', 'khyber', 'balochistan', 'islamabad', 'karachi', 'lahore', 'faisalabad', 'rawalpindi', 'multan', 'hyderabad', 'peshawar', 'quetta', 'sialkot', 'gujranwala', 'lahore', 'chishtian', 'bahawalnagar', 'bahawalpur', 'sargodha', ' Abbottabad', 'mardan', 'swat',
    // India
    'india', 'maharashtra', 'karnataka', 'tamil nadu', 'telangana', 'kerala', 'gujarat', 'rajasthan', 'uttar pradesh', 'madhya pradesh', 'west bengal', 'punjab', 'haryana', 'chennai', 'pune', 'ahmedabad', 'jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore', 'thane', 'bhopal', 'patna', 'vadodara', 'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'varanasi', 'srinagar', 'aurangabad', 'dhanbad', 'amritsar', 'allahabad', 'ranchi', 'howrah', 'coimbatore', 'jabalpur', 'gwalior', 'vijayawada', 'jodhpur', 'madurai', 'raipur', 'kochi', 'chandigarh', 'mysore', 'trichy', 'bareilly', 'gorakhpur', 'tiruchirappalli', 'noida', 'gurgaon',
    // UAE / Middle East
    'dubai', 'abu dhabi', 'sharjah', 'uae', 'united arab emirates', 'saudi arabia', 'riyadh', 'jeddah', 'doha', 'qatar', 'bahrain', 'kuwait', 'oman', 'muscat',
    // UK
    'manchester', 'birmingham', 'leeds', 'glasgow', 'edinburgh', 'bristol', 'liverpool', 'cardiff', 'belfast',
    // Canada
    'vancouver', 'montreal', 'calgary', 'ottawa', 'edmonton', 'mississauga', 'winnipeg', 'quebec',
    // Australia
    'melbourne', 'brisbane', 'perth', 'adelaide', 'gold coast', 'canberra',
    // Europe
    'amsterdam', 'munich', 'frankfurt', 'zurich', 'vienna', 'brussels', 'milan', 'rome', 'madrid', 'barcelona', 'istanbul', 'warsaw', 'prague', 'budapest', 'lisbon', 'dublin',
    // Asia
    'beijing', 'shanghai', 'hong kong', 'seoul', 'bangkok', 'jakarta', 'manila', 'kuala lumpur', 'hanoi', 'ho chi minh', 'taipei', 'dhaka', 'colombo', 'kathmandu',
    // Africa
    'cape town', 'johannesburg', 'nairobi', 'lagos', 'cairo', 'accra', 'casablanca'
  ];

  let hasLocation = false;
  
  // Check pattern matches — filter out false positives (common non-location words that match "Word, Word" pattern)
  const falsePositiveLocations = ['dear sir', 'thank you', 'sincerely', 'best regards', 'phone number', 'email address', 'date of birth', 'marital status', 'references available'];
  for (const match of locationPatternMatches) {
    const lower = match.toLowerCase().trim();
    if (!falsePositiveLocations.some(fp => lower.includes(fp)) && match.split(',')[0].trim().length > 1) {
      hasLocation = true;
      break;
    }
  }
  
  // Check keyword matches
  if (!hasLocation) {
    for (const loc of locationKeywords) {
      if (normalizedText.includes(loc)) {
        hasLocation = true;
        break;
      }
    }
  }

  if (!hasEmail) {
    structureScore -= 8;
    issues.push({
      category: 'structure',
      severity: 'critical',
      title: 'Missing Email Address',
      description: 'We could not detect a valid email address on your resume.',
      suggestion: 'Add a professional email address (e.g. john.doe@email.com) in a prominent header section.',
      location: 'Contact Info Header'
    });
  }

  if (!hasPhone) {
    structureScore -= 8;
    issues.push({
      category: 'structure',
      severity: 'critical',
      title: 'Missing Phone Number',
      description: 'No valid phone number was found.',
      suggestion: 'Include your phone number with your country code so recruiters can contact you.',
      location: 'Contact Info Header'
    });
  }

  if (!hasLinkedIn) {
    structureScore -= 4;
    issues.push({
      category: 'structure',
      severity: 'warning',
      title: 'Missing LinkedIn Profile URL',
      description: 'Your LinkedIn profile link is missing or not formatted correctly.',
      suggestion: 'Add your LinkedIn public profile link (e.g., linkedin.com/in/username) to improve professional credibility.',
      location: 'Contact Info Header'
    });
  }

  if (!hasLocation) {
    structureScore -= 3;
    issues.push({
      category: 'structure',
      severity: 'suggestion',
      title: 'Missing Location Info',
      description: 'City/State/Country details were not found.',
      suggestion: 'Add your location (City, State or City, Country) so recruiters know your geographic availability or if you require relocation.',
      location: 'Contact Info Header'
    });
  }

  // Table/column detection
  let hasTablesOrColumns = false;
  
  // Tab characters or heavy spacing heuristics
  const lines = text.split(/\r?\n/);
  let multiSpaceLines = 0;
  let tabLines = 0;
  let pipeLines = 0;

  for (const line of lines) {
    if (line.includes('\t')) tabLines++;
    if (line.includes('|')) pipeLines++;
    // Look for text fragments separated by 3 or more spaces (often indicates multiple columns/table cells)
    const columns = line.split(/ {3,}/);
    if (columns.length > 2 && columns.every(c => c.trim().length > 0)) {
      multiSpaceLines++;
    }
  }

  if (pipeLines > 2 || tabLines > 3 || multiSpaceLines > 5) {
    hasTablesOrColumns = true;
  }

  if (hasTablesOrColumns) {
    atsScore -= 8;
    issues.push({
      category: 'ats',
      severity: 'warning',
      title: 'Multi-column or Tabular Layout Detected',
      description: 'The parser detected signs of side-by-side columns or tables in your resume structure.',
      suggestion: 'Avoid complex tables, text boxes, and multi-column formats. ATS parsers read left-to-right, top-to-bottom, which often merges columns into an unreadable mess.',
      location: 'Formatting & Layout'
    });
  }

  // Image detection
  let hasImages = false;
  if (fileBuffer) {
    if (fileExt === 'pdf') {
      // PDF image objects check inside buffer (searching for /XObject /Image /Type)
      const bufferStr = fileBuffer.toString('binary');
      if (bufferStr.includes('/Image') || bufferStr.includes('/XObject')) {
        hasImages = true;
      }
    } else if (fileExt === 'docx') {
      // DOCX contains media files if there are images
      const bufferStr = fileBuffer.toString('binary');
      if (bufferStr.includes('word/media/')) {
        hasImages = true;
      }
    }
  }

  if (hasImages) {
    atsScore -= 8;
    issues.push({
      category: 'ats',
      severity: 'warning',
      title: 'Images or Graphics Detected',
      description: 'Your resume contains images, logos, or icons.',
      suggestion: 'Remove profile pictures, skills rating charts, logos, and icons. ATS parsers cannot read images, and in some cases, they cause the entire file to fail parsing.',
      location: 'Visual Elements'
    });
  }

  // Section headers check
  const sections = {
    summary: { keywords: ['summary', 'profile', 'professional summary', 'objective', 'about me'], found: false },
    experience: { keywords: ['experience', 'work history', 'employment history', 'professional experience', 'career history'], found: false },
    skills: { keywords: ['skills', 'core competencies', 'technical skills', 'skills & tools', 'areas of expertise'], found: false },
    education: { keywords: ['education', 'academic background', 'academic history', 'degrees'], found: false },
    projects: { keywords: ['projects', 'key projects', 'academic projects', 'personal projects'], found: false }
  };

  for (const line of lines) {
    const trimmedLine = line.trim().toLowerCase();
    // Headers are usually short and alone on a line
    if (trimmedLine.length > 2 && trimmedLine.length < 35) {
      for (const section in sections) {
        if (sections[section].keywords.includes(trimmedLine) || 
            sections[section].keywords.some(kw => trimmedLine === kw || trimmedLine.startsWith(kw + ' ') || trimmedLine.endsWith(' ' + kw))) {
          sections[section].found = true;
        }
      }
    }
  }

  // Double check with substring if not found
  for (const section in sections) {
    if (!sections[section].found) {
      for (const kw of sections[section].keywords) {
        if (normalizedText.includes(kw)) {
          sections[section].found = true;
          break;
        }
      }
    }
  }

  if (!sections.experience.found) {
    structureScore -= 8;
    issues.push({
      category: 'structure',
      severity: 'critical',
      title: 'Missing Experience Section',
      description: 'We could not identify a clear Professional Experience section.',
      suggestion: 'Add a section titled "Professional Experience" or "Work History" to detail your past job roles and achievements.',
      location: 'Resume Structure'
    });
  }

  if (!sections.education.found) {
    structureScore -= 6;
    issues.push({
      category: 'structure',
      severity: 'critical',
      title: 'Missing Education Section',
      description: 'We could not find an Education section.',
      suggestion: 'Include an "Education" section specifying your degrees, institutions, and graduation years.',
      location: 'Resume Structure'
    });
  }

  if (!sections.skills.found) {
    structureScore -= 5;
    issues.push({
      category: 'structure',
      severity: 'warning',
      title: 'Missing Skills Section',
      description: 'No dedicated Skills section was identified.',
      suggestion: 'Add a "Skills" or "Technical Skills" section to list your core tools, languages, and expertise.',
      location: 'Resume Structure'
    });
  }

  if (!sections.summary.found) {
    structureScore -= 4;
    issues.push({
      category: 'structure',
      severity: 'suggestion',
      title: 'Missing Summary or Objective',
      description: 'A professional summary or career objective was not found.',
      suggestion: 'Create a short 3-4 sentence professional summary at the top of your resume outlining your key value proposition.',
      location: 'Resume Structure'
    });
  }

  // Resume length check
  // Clean text before counting: strip non-readable chars, PDF artifacts, and very short tokens
  const cleanedForCount = text
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')  // Remove non-printable chars
    .replace(/\b[A-F0-9]{6,}\b/g, ' ')     // Remove hex sequences (PDF artifacts)
    .replace(/\b\w{1}\b/g, ' ')             // Remove single-char "words" (PDF fragments)
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleanedForCount.match(/\b[a-zA-Z]{2,}\b/g) || [];
  const wordCount = words.length;
  
  // Approximate page count
  let pageCount = pdfInfo.numpages || 1;
  if (fileExt === 'docx') {
    // DOCX page estimation (approx. 450 words per page)
    pageCount = Math.max(1, Math.ceil(wordCount / 450));
  }

  if (wordCount < 100) {
    atsScore -= 12;
    structureScore -= 5;
    issues.push({
      category: 'ats',
      severity: 'critical',
      title: 'Resume is Extremely Short',
      description: `Your resume contains only ${wordCount} words.`,
      suggestion: 'Add more details about your professional history, skills, projects, and education. A standard resume should have at least 300-800 words.',
      location: 'Resume Length'
    });
  } else if (wordCount < 200) {
    atsScore -= 6;
    structureScore -= 3;
    issues.push({
      category: 'structure',
      severity: 'warning',
      title: 'Resume is Too Short',
      description: `Your resume has only ${wordCount} words.`,
      suggestion: 'Consider expanding your resume with more detailed descriptions of your experience and skills. Aim for 300-800 words.',
      location: 'Resume Length'
    });
  } else if (pageCount > 2) {
    structureScore -= 4;
    issues.push({
      category: 'structure',
      severity: 'warning',
      title: 'Resume is Too Long',
      description: `Your resume is estimated at ${pageCount} pages.`,
      suggestion: 'Condense your content. Unless you have 10+ years of experience, a resume should be restricted to 1 or 2 pages.',
      location: 'Resume Length'
    });
  } else if (wordCount > 1200) {
    structureScore -= 3;
    issues.push({
      category: 'structure',
      severity: 'suggestion',
      title: 'Wordy Content Detected',
      description: `Your resume has ${wordCount} words, which is quite text-heavy.`,
      suggestion: 'Try to cut filler words and keep descriptions punchy. Aim for 400-800 words for a 1-page resume and 800-1000 for a 2-page resume.',
      location: 'Resume Content'
    });
  }

  // Bullet points vs paragraphs check
  // Expanded bullet character set: standard bullets, arrows, symbols, dashes, numbered
  const bulletPointRegex = /^(\s*[-\u2012\u2013\u2014\u2015\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB\u25A0\u25B6\u25C0\u27A2\u2794\u2736\u2737\u2738\u2756\u2605\u2606\u2714\u2718\u2611\u2610\u00BB\u00AB\u2039\u203A•\u00B7\*+o]|\s*\d+[.)]\s*|\s*\([a-zA-Z0-9]+\)\s*)/gm;
  const bulletCount = (text.match(bulletPointRegex) || []).length;
  
  // Find paragraphs (lines with more than 15 words and no bullet indicator)
  let paragraphCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 50 && !bulletPointRegex.test(trimmed)) {
      const lineWords = trimmed.split(/\s+/).length;
      if (lineWords > 15) {
        paragraphCount++;
      }
    }
  }

  if (bulletCount === 0) {
    structureScore -= 6;
    issues.push({
      category: 'structure',
      severity: 'warning',
      title: 'No Bullet Points Detected',
      description: 'Your resume seems to be written in heavy paragraphs instead of bullet points.',
      suggestion: 'Rewrite your professional achievements using bullet points. Bullet points make it significantly easier for recruiters and ATS systems to scan your achievements.',
      location: 'Formatting & Layout'
    });
  } else if (paragraphCount > 4 && bulletCount < paragraphCount) {
    structureScore -= 4;
    issues.push({
      category: 'structure',
      severity: 'suggestion',
      title: 'Paragraph-Heavy Layout',
      description: 'We detected several long paragraphs of text.',
      suggestion: 'Break down long paragraphs in your experience section into 3-5 concise, results-oriented bullet points.',
      location: 'Formatting & Layout'
    });
  }

  // Ensure scores do not fall below 0
  atsScore = Math.max(0, atsScore);
  structureScore = Math.max(0, structureScore);

  return {
    atsScore,
    structureScore,
    issues
  };
}

module.exports = {
  analyzeATS
};
