// ==========================================================================
// ResumeIQ Frontend Logic App
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  
  // Material Symbols icons load automatically via CSS — no JS initialization needed.

  // Landing page animations are now handled via high-performance CSS keyframes to prevent throttling bugs in background tabs.

  // State Variables
  let selectedFile = null;
  let lastAnalysisResult = null;

  // DOM Elements
  const uploadScreen = document.getElementById('uploadScreen');
  const loadingScreen = document.getElementById('loadingScreen');
  const resultsScreen = document.getElementById('resultsScreen');
  const actionBar = document.getElementById('actionBar');
  
  const analyzeForm = document.getElementById('analyzeForm');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileDetails = document.getElementById('fileDetails');
  const selectedFileName = document.getElementById('selectedFileName');
  const selectedFileSize = document.getElementById('selectedFileSize');
  const removeFileBtn = document.getElementById('removeFileBtn');
  const uploadError = document.getElementById('uploadError');
  const uploadErrorMsg = document.getElementById('uploadErrorMsg');
  const submitBtn = document.getElementById('submitBtn');
  
  const jdToggleBtn = document.getElementById('jdToggleBtn');
  const jdWrapper = document.getElementById('jdWrapper');
  const jdInput = document.getElementById('jdInput');

  // Loading steps
  const stepParse = document.getElementById('stepParse');
  const stepATS = document.getElementById('stepATS');
  const stepAI = document.getElementById('stepAI');
  const stepJD = document.getElementById('stepJD');
  const stepCompile = document.getElementById('stepCompile');
  const loadingProgressBar = document.getElementById('loadingProgressBar');

  // Dashboard outputs
  const aiFallbackNotice = document.getElementById('aiFallbackNotice');
  const scoreRing = document.getElementById('scoreRing');
  const overallScoreVal = document.getElementById('overallScoreVal');
  const scoreRatingBadge = document.getElementById('scoreRatingBadge');
  const scoreSummary = document.getElementById('scoreSummary');
  
  const atsSubScore = document.getElementById('atsSubScore');
  const atsBar = document.getElementById('atsBar');
  const contentSubScore = document.getElementById('contentSubScore');
  const contentBar = document.getElementById('contentBar');
  const structureSubScore = document.getElementById('structureSubScore');
  const structureBar = document.getElementById('structureBar');
  const keywordSubscoreItem = document.getElementById('keywordSubscoreItem');
  const keywordSubScore = document.getElementById('keywordSubScore');
  const keywordBar = document.getElementById('keywordBar');
  
  const jdMatchDetailsCard = document.getElementById('jdMatchDetailsCard');
  const jdMatchPercentVal = document.getElementById('jdMatchPercentVal');
  const missingKeywordsContainer = document.getElementById('missingKeywordsContainer');
  
  const issueCategoryTabs = document.getElementById('issueCategoryTabs');
  const severityFilter = document.getElementById('severityFilter');
  const issuesListContainer = document.getElementById('issuesListContainer');
  const rewriteListContainer = document.getElementById('rewriteListContainer');
  
  const restartBtn = document.getElementById('restartBtn');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');

  // Improver elements
  const improverOriginalText = document.getElementById('improverOriginalText');
  const improverImprovedText = document.getElementById('improverImprovedText');
  const improveCvBtn = document.getElementById('improveCvBtn');
  const copyImprovedBtn = document.getElementById('copyImprovedBtn');
  const downloadImprovedBtn = document.getElementById('downloadImprovedBtn');
  const improverLoading = document.getElementById('improverLoading');
  const originalWordCount = document.getElementById('originalWordCount');

  // ==========================================
  // 1. DRAG AND DROP / FILE SELECT LOGIC
  // ==========================================
  
  // Clicking zone triggers hidden input
  dropZone.addEventListener('click', (e) => {
    // If a file is already selected or if target is the input itself, let the browser handle it naturally
    if (selectedFile || e.target === fileInput) return;
    if (e.target.closest('#removeFileBtn') || e.target.closest('#fileDetails')) return;
    fileInput.click();
  });

  // Drag over states
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    }, false);
  });

  // Handle dropped files
  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  });

  // Handle selected files via file picker
  fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  });

  // Validate and display file details
  function handleFileSelection(file) {
    uploadError.classList.add('hidden');
    
    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showUploadError('File is too large. Maximum size allowed is 5MB.');
      return;
    }

    // Check file extension
    const allowedExtensions = ['.pdf', '.docx', '.txt'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      showUploadError('Invalid file type. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    selectedFile = file;
    
    // Update UI select state
    selectedFileName.textContent = file.name;
    selectedFileSize.textContent = formatBytes(file.size);
    
    // Toggle containers
    dropZone.querySelector('.drop-zone-content').classList.add('hidden');
    fileDetails.classList.remove('hidden');
    
    // Enable submit
    submitBtn.disabled = false;
  }

  // Remove selected file
  removeFileBtn.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    
    dropZone.querySelector('.drop-zone-content').classList.remove('hidden');
    fileDetails.classList.add('hidden');
    uploadError.classList.add('hidden');
    
    submitBtn.disabled = true;
  });

  function showUploadError(msg) {
    uploadErrorMsg.textContent = msg;
    uploadError.classList.remove('hidden');
    submitBtn.disabled = true;
  }

  function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Handle smooth scrolling for CTA links
  document.querySelectorAll('.scroll-to-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        if (lenisInstance) {
          lenisInstance.scrollTo(targetElement, { offset: -20 });
        } else {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Check if keywords are passed in the URL (from role click on landing page)
  const urlParams = new URLSearchParams(window.location.search);
  const keywordsParam = urlParams.get('keywords');
  if (keywordsParam) {
    // Pre-populate the Job Description input
    jdInput.value = decodeURIComponent(keywordsParam);
    
    // Expand the Job Description collapsible panel automatically
    jdWrapper.classList.remove('collapsed');
    jdWrapper.classList.add('expanded');
    jdToggleBtn.classList.add('active');
    
    // Add visual spotlight/focus to the file upload zone
    setTimeout(() => {
      dropZone.classList.add('spotlight-glow');
      setTimeout(() => {
        dropZone.classList.remove('spotlight-glow');
      }, 2000);
    }, 500);
  }

  // ==========================================
  // 2. JOB DESCRIPTION COLLAPSIBLE TOGGLE
  // ==========================================
  jdToggleBtn.addEventListener('click', () => {
    const isExpanded = jdWrapper.classList.contains('expanded');
    
    if (isExpanded) {
      jdWrapper.classList.remove('expanded');
      jdWrapper.classList.add('collapsed');
      jdToggleBtn.classList.remove('active');
    } else {
      jdWrapper.classList.remove('collapsed');
      jdWrapper.classList.add('expanded');
      jdToggleBtn.classList.add('active');
      // Scroll smoothly down a little so textarea is visible
      setTimeout(() => {
        if (lenisInstance) {
          lenisInstance.scrollTo(jdInput, { offset: -100 });
        }
      }, 300);
    }
  });

  // Screen Transition Helper with safety fallbacks
  function transitionScreen(fromScreen, toScreen, options = {}) {
    const duration = options.duration || 400;
    
    if (typeof gsap !== 'undefined') {
      gsap.to(fromScreen, {
        opacity: 0,
        duration: duration / 1000,
        onComplete: () => {
          fromScreen.classList.remove('active-screen');
          fromScreen.classList.add('hidden');
          toScreen.classList.remove('hidden');
          toScreen.classList.add('active-screen');
          gsap.fromTo(toScreen, { opacity: 0 }, { 
            opacity: 1, 
            duration: duration / 1000,
            onComplete: () => {
              if (options.onComplete) options.onComplete();
            }
          });
        }
      });
    } else {
      fromScreen.style.opacity = '0';
      setTimeout(() => {
        fromScreen.classList.remove('active-screen');
        fromScreen.classList.add('hidden');
        toScreen.classList.remove('hidden');
        toScreen.classList.add('active-screen');
        toScreen.style.opacity = '0';
        toScreen.offsetHeight; // Force reflow
        toScreen.style.opacity = '1';
        setTimeout(() => {
          if (options.onComplete) options.onComplete();
        }, duration);
      }, duration);
    }
  }

  // ==========================================
  // 3. API SUBMIT & STEPPED LOADING PHASE
  // ==========================================
  analyzeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const hasJD = jdInput.value.trim().length > 0;

    // Transition Screens using helper
    transitionScreen(uploadScreen, loadingScreen, {
      duration: 400,
      onComplete: () => {
        // Reset scroll position
        if (lenisInstance) lenisInstance.scrollTo(0, { immediate: true });
        
        // Trigger simulated step milestones
        runLoadingProgressSimulation(hasJD);
      }
    });

    // Build Form Data
    const formData = new FormData();
    formData.append('resumeFile', selectedFile);
    formData.append('jobDescription', jdInput.value);

    let apiResponse = null;
    let apiError = null;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: formData
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login.html';
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server returned an error.');
      }

      apiResponse = await response.json();
    } catch (err) {
      console.error(err);
      apiError = err.message;
    }

    // Wait until progress simulation is close to compilation before transitioning
    checkAndCompleteAnalysis(apiResponse, apiError);
  });

  // Loading Milestones Tick Handler
  let loadingInterval = null;
  let loadingProgress = 0;
  let loadingSteps = [];

  function runLoadingProgressSimulation(hasJD) {
    // Reset steps
    loadingProgress = 0;
    loadingProgressBar.style.width = '0%';
    
    // Reset milestones UI state
    document.querySelectorAll('.step-item').forEach(item => {
      item.classList.remove('active', 'completed');
    });

    // Steps declaration
    loadingSteps = [
      { element: stepParse, duration: 15 },
      { element: stepATS, duration: 25 },
      { element: stepAI, duration: 35 }
    ];

    if (hasJD) {
      stepJD.classList.remove('hidden');
      loadingSteps.push({ element: stepJD, duration: 15 });
    } else {
      stepJD.classList.add('hidden');
    }

    loadingSteps.push({ element: stepCompile, duration: 10 });

    let currentStepIndex = 0;
    let accumulatedWeight = 0;
    
    // Set first step active
    loadingSteps[0].element.classList.add('active');

    loadingInterval = setInterval(() => {
      if (loadingProgress < 90) {
        loadingProgress += 1;
        loadingProgressBar.style.width = `${loadingProgress}%`;
        
        // Check milestone changes based on simulated thresholds
        const stepThresholds = [15, 40, 75];
        if (hasJD) stepThresholds.push(90);

        let activeIndex = 0;
        for (let i = 0; i < stepThresholds.length; i++) {
          if (loadingProgress >= stepThresholds[i]) {
            activeIndex = i + 1;
          }
        }

        if (activeIndex !== currentStepIndex && activeIndex < loadingSteps.length) {
          // Mark previous completed
          for (let i = 0; i < activeIndex; i++) {
            loadingSteps[i].element.classList.remove('active');
            loadingSteps[i].element.classList.add('completed');
          }
          // Mark current active
          loadingSteps[activeIndex].element.classList.add('active');
          currentStepIndex = activeIndex;
        }
      }
    }, 100);
  }

  // Fast forward loading bar and render dashboard
  function checkAndCompleteAnalysis(result, error) {
    // Wait minimum 3 seconds for beautiful aesthetics
    setTimeout(() => {
      clearInterval(loadingInterval);
      
      if (error) {
        // Stop loading and return to upload with alert using helper
        transitionScreen(loadingScreen, uploadScreen, {
          duration: 400,
          onComplete: () => {
            showUploadError(`Analysis Failed: ${error}`);
          }
        });
        return;
      }

      // Fast forward progress animation
      loadingProgress = 100;
      loadingProgressBar.style.width = '100%';
      
      // Mark all steps completed
      loadingSteps.forEach(step => {
        step.element.classList.remove('active');
        step.element.classList.add('completed');
      });

      setTimeout(() => {
        transitionToResults(result);
      }, 600);

    }, 3200);
  }

  // ==========================================
  // 4. RENDER RESULTS DASHBOARD
  // ==========================================
  function transitionToResults(data) {
    lastAnalysisResult = data;

    // Set fallback notice visibility if server ran heuristic/mock fallback
    if (data.isFallback) {
      // Show notice if the fallback was forced
      aiFallbackNotice.classList.remove('hidden');
    } else {
      aiFallbackNotice.classList.add('hidden');
    }

    // Render numbers and metrics
    const score = data.overallScore;
    
    // Overall Score Badge classification
    let grade = 'Needs Work';
    let gradeClass = '';
    if (score >= 85) {
      grade = 'Strong';
      gradeClass = 'rating-excellent';
    } else if (score >= 70) {
      grade = 'Good';
      gradeClass = 'rating-good';
    } else if (score >= 50) {
      grade = 'Fair';
      gradeClass = 'rating-fair';
    }
    scoreRatingBadge.textContent = grade;
    scoreRatingBadge.className = `score-badge ${gradeClass}`;

    // Dynamic Summary Sentence
    let summary = 'Decent start. Focus on stronger action verbs and filling in keyword gaps.';
    if (score >= 85) {
      summary = 'Solid resume. Formatting, keywords, and content are in good shape.';
    } else if (score >= 70) {
      summary = 'Good foundation. A few targeted edits could push this higher.';
    } else if (score < 50) {
      summary = 'Needs work. Check the issues below — formatting and missing contact info are likely holding you back.';
    }
    scoreSummary.textContent = summary;

    // Sub-scores (max per category: ats=20, content=20, structure=20, keyword=25)
    atsSubScore.textContent = `${data.categoryScores.ats}/20`;
    contentSubScore.textContent = `${data.categoryScores.content}/20`;
    structureSubScore.textContent = `${data.categoryScores.structure}/20`;
    
    const isJDAvailable = data.keywordMatch.matchPercent > 0;
    if (isJDAvailable) {
      keywordSubscoreItem.classList.remove('hidden');
      jdMatchDetailsCard.classList.remove('hidden');
      keywordSubScore.textContent = `${data.categoryScores.keywordMatch}/25`;
      jdMatchPercentVal.textContent = `${data.keywordMatch.matchPercent}%`;
      
      // Render Missing Keywords
      missingKeywordsContainer.innerHTML = '';
      if (data.keywordMatch.missingKeywords && data.keywordMatch.missingKeywords.length > 0) {
        data.keywordMatch.missingKeywords.forEach(kw => {
          const tag = document.createElement('span');
          tag.className = 'keyword-tag';
          tag.textContent = kw;
          missingKeywordsContainer.appendChild(tag);
        });
      } else {
        missingKeywordsContainer.innerHTML = '<span class="keyword-tag" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); color: #A7F3D0;">No keywords missing!</span>';
      }
    } else {
      keywordSubscoreItem.classList.add('hidden');
      jdMatchDetailsCard.classList.add('hidden');
      keywordSubScore.textContent = '0/25';
    }

    // Build the Issues list and Rewrites comparisons
    renderIssues(data.issues);
    renderRewrites(data.rewriteSuggestions);

    // Render section-wise analysis
    renderSectionAnalysis(data.sectionAnalysis);

    // Populate improver section with CV text
    populateImproverWithCV(data.extractedText);

    // Transition Screens using helper
    transitionScreen(loadingScreen, resultsScreen, {
      duration: 400,
      onComplete: () => {
        actionBar.classList.remove('hidden');
        
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(resultsScreen, { opacity: 0 }, { opacity: 1, duration: 0.4 });
          gsap.fromTo(actionBar, { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.2 });
        } else {
          resultsScreen.style.opacity = '1';
          actionBar.style.opacity = '1';
        }

        // Trigger gauge fill animation
        animateDashboardScores(score, data.categoryScores, isJDAvailable);
      }
    });
  }

  // Animate Gauge & Bars
  function animateDashboardScores(score, subscores, isJDAvailable) {
    // 1. SVG Circle Gauge
    const radius = 70;
    const circumference = 2 * Math.PI * radius; // ~439.82
    
    // GSAP count up overall score with safety check
    if (typeof gsap !== 'undefined') {
      gsap.to({ val: 0 }, {
        val: score,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: function() {
          const currentVal = Math.round(this.targets()[0].val);
          overallScoreVal.textContent = currentVal;
          
          // Calculate offset (440 = empty, 0 = full)
          const offset = circumference - (currentVal / 100) * circumference;
          scoreRing.style.strokeDashoffset = offset;
        }
      });
    } else {
      overallScoreVal.textContent = score;
      const offset = circumference - (score / 100) * circumference;
      scoreRing.style.strokeDashoffset = offset;
    }

    // 2. Bar animations (max: ats=20, content=20, structure=20, keyword=25)
    setTimeout(() => {
      atsBar.style.width = `${(subscores.ats / 20) * 100}%`;
      contentBar.style.width = `${(subscores.content / 20) * 100}%`;
      structureBar.style.width = `${(subscores.structure / 20) * 100}%`;
      
      if (isJDAvailable) {
        keywordBar.style.width = `${(subscores.keywordMatch / 25) * 100}%`;
      }
    }, 100);
  }

  // ==========================================
  // 5. DETAILED ISSUES & ACCORDIONS
  // ==========================================
  let activeCategoryFilter = 'all';
  
  function renderIssues(issues) {
    issuesListContainer.innerHTML = '';
    
    if (!issues || issues.length === 0) {
      issuesListContainer.innerHTML = `
        <div class="notice-banner" style="background: var(--success-bg); border-color: rgba(16, 185, 129, 0.2); color: var(--success);">
          <span class="material-symbols-outlined notice-icon">check_circle</span>
          <div class="notice-content">Your resume satisfies all scoring checks! No critical issues found.</div>
        </div>
      `;
      return;
    }

    issues.forEach((issue, index) => {
      const issueEl = document.createElement('div');
      issueEl.className = 'issue-item';
      issueEl.setAttribute('data-category', issue.category);
      issueEl.setAttribute('data-severity', issue.severity);

      issueEl.innerHTML = `
        <div class="issue-header" id="issueHeader-${index}">
          <div class="issue-header-left">
            <span class="severity-badge ${issue.severity}">${issue.severity}</span>
            <span class="issue-title">${issue.title}</span>
            <span class="issue-location">${issue.location}</span>
          </div>
          <span class="material-symbols-outlined issue-chevron">expand_more</span>
        </div>
        <div class="issue-body">
          <div class="issue-section-para">
            <p class="issue-desc">${issue.description}</p>
          </div>
          <div class="issue-section-para">
            <p class="issue-sug-title">Recommendation:</p>
            <p class="issue-fix">${issue.suggestion}</p>
          </div>
        </div>
      `;

      // Accordion click trigger
      const header = issueEl.querySelector('.issue-header');
      header.addEventListener('click', () => {
        const isExpanded = issueEl.classList.contains('expanded');
        
        // Collapse all others
        document.querySelectorAll('.issue-item.expanded').forEach(item => {
          if (item !== issueEl) {
            item.classList.remove('expanded');
            slideUp(item.querySelector('.issue-body'));
          }
        });

        if (isExpanded) {
          issueEl.classList.remove('expanded');
          slideUp(issueEl.querySelector('.issue-body'));
        } else {
          issueEl.classList.add('expanded');
          slideDown(issueEl.querySelector('.issue-body'));
        }
        
        // Refresh scroll bounds
        setTimeout(() => { if (lenisInstance) lenisInstance.resize(); }, 350);
      });

      issuesListContainer.appendChild(issueEl);
    });
  }

  // Filter Issues trigger
  function filterIssues() {
    const activeCategory = activeCategoryFilter;
    const activeSeverity = severityFilter.value;
    let visibleCount = 0;

    const items = issuesListContainer.querySelectorAll('.issue-item');
    items.forEach(item => {
      const cat = item.getAttribute('data-category');
      const sev = item.getAttribute('data-severity');

      const matchesCat = activeCategory === 'all' || cat === activeCategory;
      const matchesSev = activeSeverity === 'all' || sev === activeSeverity;

      if (matchesCat && matchesSev) {
        item.style.display = 'block';
        visibleCount++;
      } else {
        item.style.display = 'none';
        item.classList.remove('expanded');
        const body = item.querySelector('.issue-body');
        if (body) body.style.display = 'none';
      }
    });

    // Check empty state
    const emptyNotice = issuesListContainer.querySelector('.empty-filter-notice');
    if (visibleCount === 0) {
      if (!emptyNotice) {
        const notice = document.createElement('div');
        notice.className = 'empty-filter-notice muted' ;
        notice.style.padding = '25px 0';
        notice.style.textAlign = 'center';
        notice.style.fontSize = '14px';
        notice.innerHTML = '<span class="material-symbols-outlined inline-icon">info</span> No issues match the selected filters.';
        issuesListContainer.appendChild(notice);
      }
    } else if (emptyNotice) {
      emptyNotice.remove();
    }
    
    // Recalculate Lenis scroll dimensions
    setTimeout(() => { if (lenisInstance) lenisInstance.resize(); }, 100);
  }

  // Tab clicks
  issueCategoryTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;

    issueCategoryTabs.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    
    activeCategoryFilter = btn.getAttribute('data-category');
    filterIssues();
  });

  // Select dropdown changes
  severityFilter.addEventListener('change', () => {
    filterIssues();
  });

  // Accordion slide transitions using standard height adjustments
  function slideDown(el) {
    el.style.display = 'block';
    const height = el.scrollHeight;
    el.style.height = '0px';
    el.style.overflow = 'hidden';
    el.style.transition = 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    // Trigger layout
    el.offsetHeight;
    el.style.height = height + 'px';
    
    setTimeout(() => {
      el.style.height = '';
      el.style.overflow = '';
    }, 300);
  }

  function slideUp(el) {
    const height = el.scrollHeight;
    el.style.height = height + 'px';
    el.style.overflow = 'hidden';
    el.style.transition = 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    // Trigger layout
    el.offsetHeight;
    el.style.height = '0px';
    
    setTimeout(() => {
      el.style.display = 'none';
      el.style.height = '';
      el.style.overflow = '';
    }, 300);
  }

  // ==========================================
  // 6. AI REWRITE COMPARISONS & CLIPBOARD
  // ==========================================
  function renderRewrites(suggestions) {
    rewriteListContainer.innerHTML = '';
    
    if (!suggestions || suggestions.length === 0) {
      rewriteListContainer.innerHTML = '<p class="muted" style="font-size: 13.5px;">No suggestions needed! Your achievements are already quantified and action-verb rich.</p>';
      return;
    }

    suggestions.forEach((sug, index) => {
      const card = document.createElement('div');
      card.className = 'rewrite-item';
      
      card.innerHTML = `
        <div class="rewrite-original-box">
          <span class="rewrite-tag tag-orig">Original</span>
          <p class="rewrite-text orig-txt">"${sug.original}"</p>
        </div>
        <div class="rewrite-improved-box">
          <span class="rewrite-tag tag-imp">Improved</span>
          <p class="rewrite-text imp-txt" id="rewriteTxt-${index}">"${sug.improved}"</p>
        </div>
        <div class="rewrite-actions">
          <button class="copy-btn" id="copyBtn-${index}">
            <span class="material-symbols-outlined btn-icon">content_copy</span>
            <span>Copy suggestion</span>
          </button>
        </div>
      `;

      const copyBtn = card.querySelector('.copy-btn');
      copyBtn.addEventListener('click', () => {
        // Strip out enclosing double quotes when copying
        const cleanText = sug.improved.replace(/^"(.*)"$/, '$1');
        navigator.clipboard.writeText(cleanText).then(() => {
          // Success Feedback
          copyBtn.classList.add('copied');
          copyBtn.querySelector('span:last-child').textContent = 'Copied!';

          // Reset back
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.querySelector('span:last-child').textContent = 'Copy suggestion';
          }, 2000);
        });
      });

      rewriteListContainer.appendChild(card);
    });
  }

  // ==========================================
  // 7. SECTION-WISE ANALYSIS RENDERER
  // ==========================================
  function renderSectionAnalysis(sections) {
    const container = document.getElementById('sectionAnalysisContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!sections || Object.keys(sections).length === 0) {
      container.innerHTML = '<p class="muted" style="font-size:13px;padding:10px 0">Could not parse resume sections.</p>';
      return;
    }

    for (const [key, section] of Object.entries(sections)) {
      const card = document.createElement('div');
      card.className = 'section-card';

      const scorePercent = (section.score / 10) * 100;
      let barColor = 'var(--critical)';
      if (section.score >= 7) barColor = 'var(--success)';
      else if (section.score >= 4) barColor = 'var(--warning)';

      let issuesHtml = '';
      if (section.issues && section.issues.length > 0) {
        issuesHtml = section.issues.map(iss => `<li>${iss}</li>`).join('');
      } else {
        issuesHtml = '<li class="no-issue">Looking good! No issues found.</li>';
      }

      card.innerHTML = `
        <div class="section-card-header">
          <span class="section-card-icon"><span class="material-symbols-outlined">${getSectionIcon(key)}</span></span>
          <div class="section-card-info">
            <span class="section-card-title">${section.label}</span>
            <span class="section-card-words">${section.wordCount} words</span>
          </div>
          <div class="section-card-score">
            <span class="section-score-num">${section.score}</span>
            <span class="section-score-den">/10</span>
          </div>
        </div>
        <div class="section-bar-bg">
          <div class="section-bar-fg" style="width: ${scorePercent}%; background: ${barColor};"></div>
        </div>
        <div class="section-readiness-row">
          <span class="${section.readinessClass}">${section.readiness}</span>
          ${section.score >= 7 ? '<span class="job-ready-badge"><span class="material-symbols-outlined" style="font-size:14px">check_circle</span> Job-Ready</span>' : ''}
        </div>
        <ul class="section-issues-list">${issuesHtml}</ul>
      `;

      container.appendChild(card);
    }
  }

  function getSectionIcon(key) {
    const icons = {
      summary: 'person',
      experience: 'work',
      education: 'school',
      skills: 'lightning_bolt',
      projects: 'folder_open'
    };
    return icons[key] || 'description';
  }

  // ==========================================
  // 8. DOWNLOAD REPORT & RESTART FLOWS
  // ==========================================
  downloadPdfBtn.addEventListener('click', async () => {
    if (!lastAnalysisResult) return;

    downloadPdfBtn.disabled = true;
    const btnSpan = downloadPdfBtn.querySelector('span');
    const originalText = btnSpan.textContent;
    btnSpan.textContent = 'Generating PDF...';

    try {
      const response = await fetch('/api/report/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(lastAnalysisResult)
      });
      
      if (response.status === 401 || response.status === 403) {
        window.location.href = '/login.html';
        return;
      }

      if (!response.ok) throw new Error('PDF generation failed.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Trigger download link
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${selectedFile ? selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) : 'Resume'}_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up link
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to generate downloadable PDF report. Please try again.');
    } finally {
      btnSpan.textContent = originalText;
      downloadPdfBtn.disabled = false;
    }
  });

  restartBtn.addEventListener('click', () => {
    // Reset Form and State
    selectedFile = null;
    lastAnalysisResult = null;
    fileInput.value = '';
    jdInput.value = '';
    
    // Clear select file details container
    dropZone.querySelector('.drop-zone-content').classList.remove('hidden');
    fileDetails.classList.add('hidden');
    uploadError.classList.add('hidden');
    submitBtn.disabled = true;

    // Reset Improver
    improverOriginalText.value = '';
    improverImprovedText.value = '';
    originalWordCount.textContent = '0 words';
    copyImprovedBtn.disabled = true;
    downloadImprovedBtn.disabled = true;
    improverLoading.classList.add('hidden');
    improverImprovedText.classList.add('hidden');

    // Reset Filter Dropdown
    severityFilter.value = 'all';
    activeCategoryFilter = 'all';
    issueCategoryTabs.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.getAttribute('data-category') === 'all') btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // Reset Radial Gauge Stroke
    scoreRing.style.strokeDashoffset = '440';
    overallScoreVal.textContent = '0';
    
    // Reset bar animations width
    atsBar.style.width = '0%';
    contentBar.style.width = '0%';
    structureBar.style.width = '0%';
    keywordBar.style.width = '0%';

    // Transition Screen using helper
    actionBar.classList.add('hidden');
    transitionScreen(resultsScreen, uploadScreen, {
      duration: 400,
      onComplete: () => {
        if (lenisInstance) lenisInstance.scrollTo(0, { immediate: true });
        
        // Trigger CSS fade-in by re-applying class
        const animElements = uploadScreen.querySelectorAll('.animate-in');
        animElements.forEach(el => {
          el.style.animation = 'none';
          el.offsetHeight; // trigger reflow
          el.style.animation = '';
        });
      }
    });
  });

  // ==========================================
  // 9. RESUME IMPROVER & OPTIMIZER FUNCTIONS
  // ==========================================

  function populateImproverWithCV(extractedText) {
    if (extractedText && extractedText.trim()) {
      improverOriginalText.value = extractedText;
      updateWordCount(extractedText);
    }
  }

  function updateWordCount(text) {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    originalWordCount.textContent = `${words} words`;
  }

  improverOriginalText.addEventListener('input', () => {
    updateWordCount(improverOriginalText.value);
  });

  improveCvBtn.addEventListener('click', async () => {
    const text = improverOriginalText.value.trim();
    if (!text) return;

    improverLoading.classList.remove('hidden');
    improverImprovedText.classList.add('hidden');
    improveCvBtn.disabled = true;

    try {
      const response = await fetch('/api/improve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({
          resumeText: text,
          jobDescription: jdInput.value
        })
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = '/login.html';
        return;
      }

      if (!response.ok) throw new Error('Improvement failed');

      const data = await response.json();
      improverImprovedText.value = data.improvedText;
      improverImprovedText.classList.remove('hidden');
      copyImprovedBtn.disabled = false;
      downloadImprovedBtn.disabled = false;
    } catch (err) {
      console.error(err);
      alert('Failed to enhance resume. Please try again.');
    } finally {
      improverLoading.classList.add('hidden');
      improveCvBtn.disabled = false;
    }
  });

  copyImprovedBtn.addEventListener('click', () => {
    const text = improverImprovedText.value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      copyImprovedBtn.classList.add('copied');
      const span = copyImprovedBtn.querySelector('span:last-child');
      span.textContent = 'Copied!';
      setTimeout(() => {
        copyImprovedBtn.classList.remove('copied');
        span.textContent = 'Copy';
      }, 2000);
    }).catch(() => {
      alert('Failed to copy text.');
    });
  });

  downloadImprovedBtn.addEventListener('click', () => {
    const text = improverImprovedText.value;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'Improved_Resume.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  });

});
