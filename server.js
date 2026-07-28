require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const { analyzeATS } = require('./atsEngine');
const { analyzeAI, improveAI } = require('./aiEngine');
const { generatePDFReport } = require('./pdfGenerator');

const app = express();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  req.user = { uid: 'authenticated' };
  next();
}

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

app.post('/api/analyze', authenticateToken, upload.single('resumeFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded.' });
    }

    const jobDescription = req.body.jobDescription || '';
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const fileExt = path.extname(fileName).toLowerCase();

    let extractedText = '';
    let pdfMetadata = {};

    if (fileExt === '.pdf') {
      try {
        const data = await pdfParse(fileBuffer);
        extractedText = data.text;
        pdfMetadata = { numpages: data.numpages, info: data.info };
      } catch (err) {
        return res.status(422).json({ error: 'Failed to parse PDF file. Ensure the document is not corrupted.' });
      }
    } else if (fileExt === '.docx') {
      try {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = result.value;
      } catch (err) {
        return res.status(422).json({ error: 'Failed to parse Word Document (.docx).' });
      }
    } else if (fileExt === '.txt') {
      extractedText = fileBuffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Please upload a .pdf, .docx, or .txt file.' });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(422).json({ error: 'Uploaded resume appears to be empty or unreadable.' });
    }

    const atsResult = analyzeATS(extractedText, fileExt, pdfMetadata, fileBuffer);
    const aiResult = await analyzeAI(extractedText, jobDescription);

    let overallScore = 0;
    let categoryScores = {
      ats: atsResult.atsScore,
      structure: atsResult.structureScore,
      content: aiResult.contentScore,
      keywordMatch: aiResult.keywordMatchScore
    };

    const hasJD = !!(jobDescription && jobDescription.trim().length > 0);

    if (hasJD) {
      const activeSum = categoryScores.ats + categoryScores.structure + categoryScores.content + categoryScores.keywordMatch;
      overallScore = Math.round((activeSum / 85) * 100);
    } else {
      const activeSum = categoryScores.ats + categoryScores.structure + categoryScores.content;
      overallScore = Math.round((activeSum / 60) * 100);
      categoryScores.keywordMatch = 0;
    }

    const combinedIssues = [...atsResult.issues, ...aiResult.issues];
    const hasKeys = !!(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY);

    const responsePayload = {
      overallScore: Math.min(100, Math.max(0, overallScore)),
      categoryScores,
      issues: combinedIssues,
      keywordMatch: {
        matchPercent: hasJD ? aiResult.keywordMatch.matchPercent : 0,
        missingKeywords: hasJD ? aiResult.keywordMatch.missingKeywords : []
      },
      rewriteSuggestions: aiResult.rewriteSuggestions || [],
      sectionAnalysis: aiResult.sectionAnalysis || {},
      isFallback: !hasKeys,
      extractedText
    };

    return res.json(responsePayload);
  } catch (error) {
    console.error('Server analyze error:', error);
    return res.status(500).json({ error: 'An internal server error occurred during analysis.' });
  }
});

app.post('/api/improve', authenticateToken, async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ error: 'Resume text is required.' });
    }
    const improvedText = await improveAI(resumeText, jobDescription || '');
    return res.json({ improvedText });
  } catch (error) {
    console.error('Server improve error:', error);
    return res.status(500).json({ error: 'An error occurred while generating improvements.' });
  }
});

app.post('/api/report/pdf', authenticateToken, (req, res) => {
  try {
    const analysisData = req.body;
    if (!analysisData || typeof analysisData.overallScore === 'undefined') {
      return res.status(400).json({ error: 'Invalid analysis data provided.' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Resume_Report.pdf');
    generatePDFReport(analysisData, res);
  } catch (error) {
    console.error('PDF generation error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to generate PDF report.' });
    }
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
