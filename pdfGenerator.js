const PDFDocument = require('pdfkit');

/**
 * Generates a beautiful PDF report based on analysis JSON data.
 * Pipes the PDF contents directly into the provided output stream (res).
 */
function generatePDFReport(data, stream) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(stream);

  // Styling palette
  const primaryColor = '#1E293B'; // Slate 800
  const secondaryColor = '#0D9488'; // Teal 600
  const dangerColor = '#E11D48'; // Rose 600
  const warningColor = '#D97706'; // Amber 600
  const infoColor = '#2563EB'; // Blue 600
  const grayColor = '#64748B'; // Slate 500
  const lightBgColor = '#F8FAFC'; // Slate 50

  // ==========================================
  // HEADER
  // ==========================================
  doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryColor).text('ResumeIQ Analysis Report', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(9).font('Helvetica-Oblique').fillColor(grayColor).text(`Report Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(1.5);

  // ==========================================
  // SCORE HERO SUMMARY BOX
  // ==========================================
  const startY = doc.y;
  doc.rect(50, startY, 495, 75).fill(lightBgColor);
  
  // Score text
  doc.fontSize(32).font('Helvetica-Bold').fillColor(secondaryColor).text(`${data.overallScore}`, 75, startY + 15, { continued: true });
  doc.fontSize(16).font('Helvetica-Bold').fillColor(grayColor).text('/100');
  
  // Assessment label
  let grade = 'Fair';
  let gradeColor = warningColor;
  if (data.overallScore >= 85) {
    grade = 'Strong';
    gradeColor = secondaryColor;
  } else if (data.overallScore >= 70) {
    grade = 'Good';
    gradeColor = infoColor;
  } else if (data.overallScore < 50) {
    grade = 'Needs Work';
    gradeColor = dangerColor;
  }

  doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('Overall Resume Score', 200, startY + 15);
  doc.fontSize(10).font('Helvetica').fillColor(grayColor).text('Assessment: ', { continued: true }).font('Helvetica-Bold').fillColor(gradeColor).text(grade);
  
  // Summary statement
  let summaryText = "Fair score. Some improvements to formatting, wording, or keyword alignment would help.";
  if (data.overallScore >= 85) {
    summaryText = "Strong resume. Formatting and content are in good shape.";
  } else if (data.overallScore >= 70) {
    summaryText = "Good baseline. A few tweaks to keywords or section order could improve it.";
  } else if (data.overallScore < 50) {
    summaryText = "Needs attention. Key structural or content issues are likely causing ATS problems.";
  }
  
  doc.y = startY + 75;
  doc.moveDown(1);

  // ==========================================
  // CATEGORY SUB-SCORES
  // ==========================================
  doc.fontSize(13).font('Helvetica-Bold').fillColor(primaryColor).text('Sub-Category Breakdowns', 50);
  doc.moveDown(0.4);

  const colWidth = 120;
  const subScoreY = doc.y;

  // Render 4 Column Labels & Scores
  // 1. ATS
  doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor).text('ATS COMPATIBILITY', 50, subScoreY);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(grayColor).text(`${data.categoryScores.ats}/25`, 50, subScoreY + 12);
  
  // 2. Content
  doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor).text('CONTENT QUALITY', 50 + colWidth, subScoreY);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(grayColor).text(`${data.categoryScores.content}/25`, 50 + colWidth, subScoreY + 12);
  
  // 3. Structure
  doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor).text('STRUCTURE & FORMAT', 50 + colWidth * 2, subScoreY);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(grayColor).text(`${data.categoryScores.structure}/25`, 50 + colWidth * 2, subScoreY + 12);

  // 4. JD Keywords
  const hasJD = data.keywordMatch && data.keywordMatch.matchPercent > 0;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor).text('JD KEYWORD MATCH', 50 + colWidth * 3, subScoreY);
  if (hasJD) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor(grayColor).text(`${data.categoryScores.keywordMatch}/25`, 50 + colWidth * 3, subScoreY + 12);
  } else {
    doc.fontSize(10).font('Helvetica-Oblique').fillColor(grayColor).text('Not Scored', 50 + colWidth * 3, subScoreY + 12);
  }

  doc.y = subScoreY + 35;
  doc.moveDown(1);

  // ==========================================
  // JOB DESCRIPTION KEYWORD MATCH (IF APPLICABLE)
  // ==========================================
  if (hasJD) {
    doc.fontSize(13).font('Helvetica-Bold').fillColor(primaryColor).text('Job Description Matching Analysis', 50);
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor(primaryColor).text('JD Match Rate: ', { continued: true }).font('Helvetica-Bold').fillColor(secondaryColor).text(`${data.keywordMatch.matchPercent}%`);
    
    if (data.keywordMatch.missingKeywords && data.keywordMatch.missingKeywords.length > 0) {
      doc.moveDown(0.2);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(dangerColor).text('Missing Core Keywords: ', { continued: true })
         .font('Helvetica').fillColor(primaryColor).text(data.keywordMatch.missingKeywords.join(', '));
    }
    doc.moveDown(1);
  }

  // ==========================================
  // DETAILED ISSUES & FIXES
  // ==========================================
  doc.fontSize(13).font('Helvetica-Bold').fillColor(primaryColor).text('Identified Issues & Recommendations', 50);
  doc.moveDown(0.4);

  if (!data.issues || data.issues.length === 0) {
    doc.fontSize(10).font('Helvetica-Oblique').fillColor(grayColor).text('Outstanding! No structural, formatting, or parsing issues were detected.');
  } else {
    data.issues.forEach((issue) => {
      // Manage page break
      if (doc.y > 700) {
        doc.addPage();
      }

      // Color code bullet by severity
      let badgeColor = infoColor;
      if (issue.severity === 'critical') badgeColor = dangerColor;
      else if (issue.severity === 'warning') badgeColor = warningColor;

      const currentY = doc.y;
      
      // Draw indicator circle
      doc.circle(55, currentY + 6, 4.5).fill(badgeColor);

      // Issue Title & Severity
      doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text(issue.title, 68, currentY, { continued: true });
      doc.fontSize(8.5).font('Helvetica-Oblique').fillColor(grayColor).text(`  (${issue.severity.toUpperCase()} • ${issue.location})`);

      // Description & Fix Suggestion
      doc.moveDown(0.25);
      doc.fontSize(9.5).font('Helvetica').fillColor(primaryColor).text(`Analysis: ${issue.description}`, 68);
      doc.moveDown(0.2);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(secondaryColor).text('How to Fix: ', { continued: true })
         .font('Helvetica').fillColor(primaryColor).text(issue.suggestion);
      
      doc.moveDown(0.9);
    });
  }

  // ==========================================
  // REWRITE SUGGESTIONS (IF APPLICABLE)
  // ==========================================
  if (data.rewriteSuggestions && data.rewriteSuggestions.length > 0) {
    if (doc.y > 600) {
      doc.addPage();
    }
    
    doc.moveDown(0.8);
    doc.fontSize(13).font('Helvetica-Bold').fillColor(primaryColor).text('Suggested Accomplishment Rewrites', 50);
    doc.fontSize(9).font('Helvetica-Oblique').fillColor(grayColor).text('Recommended conversions from passive or responsibility-based bullet points into achievement-oriented statements:', 50);
    doc.moveDown(0.5);

    data.rewriteSuggestions.forEach((sug) => {
      if (doc.y > 700) {
        doc.addPage();
      }

      const blockY = doc.y;
      doc.rect(50, blockY, 495, 55).fill('#F8FAFC');
      
      doc.fontSize(9).font('Helvetica-Oblique').fillColor(grayColor).text(`Original: "${sug.original}"`, 60, blockY + 10, { width: 475 });
      doc.moveDown(0.2);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(secondaryColor).text('Improved: ', { continued: true })
         .font('Helvetica').fillColor(primaryColor).text(`"${sug.improved}"`, { width: 475 });

      doc.y = blockY + 55;
      doc.moveDown(0.6);
    });
  }

  // Finalize
  doc.end();
}

module.exports = {
  generatePDFReport
};
