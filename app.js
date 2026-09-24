// Assessment Portal Main Application Logic
(function () {
  'use strict';

  // State Management
  const state = {
    student: null,
    totalQuestions: QUESTIONS_BANK.length, // 50
    currentIndex: 0,
    userAnswers: {},     // { 1: 'B', 2: 'A', ... }
    reviewFlags: {},     // { 1: true, ... }
    timerSeconds: 45 * 60, // 45 Minutes (2700 seconds)
    timerInterval: null,
    isSubmitted: false
  };

  // DOM Elements - Login
  const loginView = document.getElementById('login-view');
  const dashboardView = document.getElementById('dashboard-view');
  const loginForm = document.getElementById('student-login-form');
  const loginAlert = document.getElementById('login-alert');
  const regNoInput = document.getElementById('reg-no');
  const studentNameInput = document.getElementById('student-name');
  const departmentInput = document.getElementById('department');
  const sectionInput = document.getElementById('section');
  const btnQuickFill = document.getElementById('btn-quick-fill');

  // DOM Elements - Dashboard Header
  const dispAvatar = document.getElementById('disp-avatar');
  const dispName = document.getElementById('disp-name');
  const dispRegno = document.getElementById('disp-regno');
  const dispDeptSec = document.getElementById('disp-dept-sec');
  const timerBox = document.getElementById('timer-box');
  const timerDisplay = document.getElementById('timer-display');
  const btnSubmitTest = document.getElementById('btn-submit-test');

  // DOM Elements - Question Area
  const dispQnoBadge = document.getElementById('disp-qno-badge');
  const dispCategory = document.getElementById('disp-category');
  const dispQuestionText = document.getElementById('disp-question-text');
  const optionsContainer = document.getElementById('options-container');

  // Controls
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnClearChoice = document.getElementById('btn-clear-choice');
  const btnMarkReview = document.getElementById('btn-mark-review');
  const btnReviewText = document.getElementById('btn-review-text');

  // DOM Elements - Palette & Stats
  const paletteGrid = document.getElementById('palette-grid');
  const statAnswered = document.getElementById('stat-answered');
  const statUnanswered = document.getElementById('stat-unanswered');
  const statReview = document.getElementById('stat-review');

  // Modal Elements
  const submitModal = document.getElementById('submit-confirm-modal');
  const modalStatAnswered = document.getElementById('modal-stat-answered');
  const modalStatUnanswered = document.getElementById('modal-stat-unanswered');
  const modalStatReview = document.getElementById('modal-stat-review');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalConfirm = document.getElementById('btn-modal-confirm');

  // ========================================================
  // 1. LOGIN & AUTHENTICATION HANDLERS
  // ========================================================

  // Quick fill helper for swift evaluation & testing
  if (btnQuickFill) {
    btnQuickFill.addEventListener('click', () => {
      const sample = REGISTERED_STUDENTS[0] || {
        reg_no: "717822P101",
        name: "Aarav Sharma",
        department: "Computer Science and Engineering",
        section: "CSE-A"
      };
      regNoInput.value = sample.reg_no;
      studentNameInput.value = sample.name;
      departmentInput.value = sample.department;
      sectionInput.value = sample.section;
      hideAlert();
    });
  }

  // Auto-fill student info if register number is recognized
  async function checkAndAutoFillStudent() {
    const regNo = regNoInput.value.trim().toUpperCase();
    if (!regNo || regNo.length < 5) return;

    // Check Cloud Supabase or Local Roster
    let student = null;
    if (typeof SupabaseAPI !== 'undefined' && SupabaseAPI.isConfigured()) {
      student = await SupabaseAPI.findStudent(regNo);
    }
    if (!student) {
      student = REGISTERED_STUDENTS.find(s => s.reg_no.toUpperCase() === regNo);
    }

    if (student) {
      studentNameInput.value = student.name;
      departmentInput.value = student.department;
      sectionInput.value = student.section;
      hideAlert();
    }
  }

  regNoInput.addEventListener('blur', checkAndAutoFillStudent);
  regNoInput.addEventListener('input', () => {
    const regNo = regNoInput.value.trim().toUpperCase();
    if (regNo.length >= 10) {
      checkAndAutoFillStudent();
    }
  });

  function showAlert(msg) {
    loginAlert.textContent = msg;
    loginAlert.style.display = 'block';
  }

  function hideAlert() {
    loginAlert.style.display = 'none';
  }

  // Login form submission with Supabase verification
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const regNo = regNoInput.value.trim().toUpperCase();
    let name = studentNameInput.value.trim();
    let department = departmentInput.value.trim();
    let section = sectionInput.value.trim();

    if (!regNo) {
      showAlert('Please enter your Register Number.');
      return;
    }

    const btnEnter = document.getElementById('btn-enter-test');
    const originalBtnText = btnEnter.innerHTML;
    btnEnter.disabled = true;
    btnEnter.innerHTML = `<span>Verifying Register Number...</span>`;

    try {
      // 1. Verify student exists in Supabase Cloud OR local official CSV roster
      let matchedStudent = null;

      if (typeof SupabaseAPI !== 'undefined' && SupabaseAPI.isConfigured()) {
        matchedStudent = await SupabaseAPI.findStudent(regNo);
      }

      if (!matchedStudent) {
        matchedStudent = REGISTERED_STUDENTS.find(s => s.reg_no.toUpperCase() === regNo);
      }

      if (!matchedStudent) {
        showAlert(`Access Denied: Register Number "${regNo}" was not found in the official roster. Only registered students can access the test.`);
        btnEnter.disabled = false;
        btnEnter.innerHTML = originalBtnText;
        return;
      }

      // 2. Check if student has already submitted in Supabase or LocalStorage
      if (typeof SupabaseAPI !== 'undefined' && SupabaseAPI.isConfigured()) {
        const existingCloudSub = await SupabaseAPI.checkExistingSubmission(regNo);
        if (existingCloudSub) {
          const submitTime = new Date(existingCloudSub.submitted_at).toLocaleString();
          showAlert(`Duplicate Attempt Locked: Register Number ${regNo} has already submitted this examination on ${submitTime}. Score: ${existingCloudSub.obtained_marks}/${existingCloudSub.total_marks}.`);
          btnEnter.disabled = false;
          btnEnter.innerHTML = originalBtnText;
          return;
        }
      }

      const existingLocalSubs = JSON.parse(localStorage.getItem('portal_submissions') || '[]');
      const alreadySubmitted = existingLocalSubs.find(s => s.reg_no.toUpperCase() === regNo);
      if (alreadySubmitted) {
        showAlert(`Duplicate Attempt Locked: Register Number ${regNo} has already completed this assessment. Re-taking is not permitted.`);
        btnEnter.disabled = false;
        btnEnter.innerHTML = originalBtnText;
        return;
      }

      // 3. Populate missing fields from roster if needed
      name = name || matchedStudent.name;
      department = department || matchedStudent.department;
      section = section || matchedStudent.section;

      state.student = {
        reg_no: matchedStudent.reg_no,
        name: name,
        department: department,
        section: section,
        loginTime: new Date()
      };

      btnEnter.disabled = false;
      btnEnter.innerHTML = originalBtnText;

      // 4. Open Test Dashboard
      startAssessment();
    } catch (err) {
      console.error('[Login Verification Error]:', err);
      showAlert(`Verification error: ${err.message}. Please try again.`);
      btnEnter.disabled = false;
      btnEnter.innerHTML = originalBtnText;
    }
  });

  // ========================================================
  // 2. ASSESSMENT ENGINE & TIMER
  // ========================================================

  function startAssessment() {
    try {
      // Switch views
      loginView.classList.add('hidden');
      dashboardView.classList.remove('hidden');

      // Populate candidate details safely
      dispName.textContent = state.student.name || 'Candidate';
      dispRegno.textContent = state.student.reg_no || '';
      dispDeptSec.textContent = `${state.student.section || 'Sec'} • ${state.student.department || 'ECE'}`;
      dispAvatar.textContent = (state.student.name && state.student.name.length > 0) ? state.student.name.charAt(0).toUpperCase() : 'S';

      // Build the 1-50 Question Palette Grid
      buildPaletteGrid();

      // Render Question 1
      state.currentIndex = 0;
      renderQuestion(state.currentIndex);

      // Start 45-minute countdown timer
      startCountdownTimer();
    } catch (err) {
      console.error('[startAssessment Error]:', err);
      alert('Error opening test portal: ' + err.message);
    }
  }

  function startCountdownTimer() {
    updateTimerDisplay();

    state.timerInterval = setInterval(() => {
      state.timerSeconds--;

      if (state.timerSeconds <= 0) {
        clearInterval(state.timerInterval);
        state.timerSeconds = 0;
        updateTimerDisplay();
        alert('Time is up! Your examination will be submitted automatically.');
        finalizeSubmission(true);
        return;
      }

      updateTimerDisplay();
    }, 1000);
  }

  function updateTimerDisplay() {
    const mins = Math.floor(state.timerSeconds / 60);
    const secs = state.timerSeconds % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    timerDisplay.textContent = formatted;

    // Visual Alert States
    if (state.timerSeconds <= 120) { // Under 2 mins
      timerBox.className = 'timer-pill danger';
    } else if (state.timerSeconds <= 600) { // Under 10 mins
      timerBox.className = 'timer-pill warning';
    } else {
      timerBox.className = 'timer-pill';
    }
  }

  // ========================================================
  // 3. QUESTION RENDERING & PALETTE
  // ========================================================

  function buildPaletteGrid() {
    paletteGrid.innerHTML = '';

    for (let i = 0; i < state.totalQuestions; i++) {
      const qno = i + 1;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette-num-btn';
      btn.id = `palette-btn-${qno}`;
      btn.textContent = qno;

      btn.addEventListener('click', () => {
        saveAndNavigate(i);
      });

      paletteGrid.appendChild(btn);
    }

    updatePalette();
  }

  function renderQuestion(index) {
    const q = QUESTIONS_BANK[index];
    if (!q) return;

    // Update Meta
    dispQnoBadge.textContent = `Question ${q.qno} of ${state.totalQuestions}`;
    dispCategory.textContent = q.category || 'Technical';
    dispQuestionText.textContent = q.question;

    // Update Navigation Buttons State
    btnPrev.disabled = (index === 0);
    if (index === state.totalQuestions - 1) {
      btnNext.innerHTML = `<span>Submit & Finish</span>`;
    } else {
      btnNext.innerHTML = `<span>Save & Next</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>`;
    }

    // Update Mark for Review button state
    const isMarked = !!state.reviewFlags[q.qno];
    btnReviewText.textContent = isMarked ? 'Unmark Review' : 'Mark for Review';

    // Render Options
    optionsContainer.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    letters.forEach(letter => {
      const optionCard = document.createElement('div');
      optionCard.className = 'option-card';
      if (state.userAnswers[q.qno] === letter) {
        optionCard.classList.add('selected');
      }

      optionCard.innerHTML = `
        <div class="option-letter">${letter}</div>
        <div class="option-label">${q.options[letter] || ''}</div>
      `;

      optionCard.addEventListener('click', () => {
        selectOption(q.qno, letter);
      });

      optionsContainer.appendChild(optionCard);
    });

    updatePalette();
  }

  function selectOption(qno, letter) {
    state.userAnswers[qno] = letter;

    // Update UI option selection highlights
    const optionCards = optionsContainer.querySelectorAll('.option-card');
    const letters = ['A', 'B', 'C', 'D'];
    optionCards.forEach((card, idx) => {
      if (letters[idx] === letter) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    updatePalette();
  }

  function saveAndNavigate(newIndex) {
    if (newIndex >= 0 && newIndex < state.totalQuestions) {
      state.currentIndex = newIndex;
      renderQuestion(state.currentIndex);
    }
  }

  // ========================================================
  // 4. ACTION BUTTON HANDLERS
  // ========================================================

  // Previous
  btnPrev.addEventListener('click', () => {
    if (state.currentIndex > 0) {
      saveAndNavigate(state.currentIndex - 1);
    }
  });

  // Next / Submit
  btnNext.addEventListener('click', () => {
    if (state.currentIndex < state.totalQuestions - 1) {
      saveAndNavigate(state.currentIndex + 1);
    } else {
      openSubmitModal();
    }
  });

  // Clear Choice
  btnClearChoice.addEventListener('click', () => {
    const currentQno = state.currentIndex + 1;
    delete state.userAnswers[currentQno];
    renderQuestion(state.currentIndex);
  });

  // Mark for Review
  btnMarkReview.addEventListener('click', () => {
    const currentQno = state.currentIndex + 1;
    state.reviewFlags[currentQno] = !state.reviewFlags[currentQno];
    renderQuestion(state.currentIndex);
  });

  // Submit Test Trigger
  btnSubmitTest.addEventListener('click', () => {
    openSubmitModal();
  });

  function updatePalette() {
    let answeredCount = 0;
    let reviewCount = 0;

    for (let i = 0; i < state.totalQuestions; i++) {
      const qno = i + 1;
      const btn = document.getElementById(`palette-btn-${qno}`);
      if (!btn) continue;

      btn.className = 'palette-num-btn';

      // Current Question Outline
      if (i === state.currentIndex) {
        btn.classList.add('current');
      }

      // Review State
      if (state.reviewFlags[qno]) {
        btn.classList.add('review');
        reviewCount++;
      } else if (state.userAnswers[qno]) {
        // Answered State
        btn.classList.add('answered');
        answeredCount++;
      }
    }

    const unansweredCount = state.totalQuestions - answeredCount;

    // Update Counter Badges
    statAnswered.textContent = answeredCount;
    statUnanswered.textContent = unansweredCount;
    statReview.textContent = reviewCount;
  }

  // ========================================================
  // 5. SUBMISSION & EVALUATION
  // ========================================================

  function openSubmitModal() {
    let answered = 0;
    let review = 0;

    for (let i = 1; i <= state.totalQuestions; i++) {
      if (state.userAnswers[i]) answered++;
      if (state.reviewFlags[i]) review++;
    }

    modalStatAnswered.textContent = answered;
    modalStatUnanswered.textContent = state.totalQuestions - answered;
    modalStatReview.textContent = review;

    submitModal.classList.remove('hidden');
  }

  btnModalCancel.addEventListener('click', () => {
    submitModal.classList.add('hidden');
  });

  btnModalConfirm.addEventListener('click', () => {
    submitModal.classList.add('hidden');
    finalizeSubmission(false);
  });

  function finalizeSubmission(isAutoSubmit) {
    if (state.isSubmitted) return;
    state.isSubmitted = true;
    clearInterval(state.timerInterval);

    // Calculate score
    let score = 0;
    const incorrectList = [];
    const fullReview = [];

    QUESTIONS_BANK.forEach(q => {
      const selected = state.userAnswers[q.qno] || null;
      const isCorrect = (selected && selected === q.correct);

      if (isCorrect) {
        score++;
      } else {
        incorrectList.push({
          qno: q.qno,
          category: q.category,
          question: q.question,
          selected: selected || 'Unattempted',
          correct: q.correct,
          explanation: q.explanation
        });
      }

      fullReview.push({
        qno: q.qno,
        category: q.category,
        question: q.question,
        options: q.options,
        selected: selected,
        correct: q.correct,
        isCorrect: isCorrect,
        explanation: q.explanation
      });
    });

    const timeTakenSeconds = (45 * 60) - state.timerSeconds;
    const percentage = ((score / state.totalQuestions) * 100).toFixed(1);

    const submissionRecord = {
      reg_no: state.student.reg_no,
      student_name: state.student.name,
      department: state.student.department,
      section: state.student.section,
      total_marks: state.totalQuestions,
      obtained_marks: score,
      percentage: percentage,
      time_taken_seconds: timeTakenSeconds,
      submitted_at: new Date().toISOString(),
      incorrectCount: incorrectList.length,
      incorrectList: incorrectList,
      fullReview: fullReview
    };

    // Save to local storage for offline backup & review
    const existing = JSON.parse(localStorage.getItem('portal_submissions') || '[]');
    existing.push(submissionRecord);
    localStorage.setItem('portal_submissions', JSON.stringify(existing));
    localStorage.setItem('last_submission', JSON.stringify(submissionRecord));

    // Save to Supabase Cloud Database if configured
    if (typeof SupabaseAPI !== 'undefined' && SupabaseAPI.isConfigured()) {
      SupabaseAPI.saveSubmission(submissionRecord, incorrectList)
        .then(id => console.log('[Supabase] Submission synced with cloud ID:', id))
        .catch(err => console.warn('[Supabase Sync Warning]:', err));
    }

    // Display temporary success banner before result page is expanded
    alert(`Assessment completed successfully!\n\nCandidate: ${state.student.name} (${state.student.reg_no})\nMarks Obtained: ${score} / ${state.totalQuestions} (${percentage}%)\n\nIncorrect Answers: ${incorrectList.length}\n\nYour responses have been recorded in the database.`);

    // Reset view
    location.reload();
  }

})();
