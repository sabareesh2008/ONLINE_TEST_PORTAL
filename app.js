// Technical Assessment Portal - Main Application Logic (Student & Admin)
(function () {
  'use strict';

  // Sample CSV Template content embedded for offline/online reliability
  const SAMPLE_CSV_TEMPLATE = `Type,Category,Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation
MCQ,Data Structures,Which data structure follows the Last-In-First-Out (LIFO) principle?,Queue,Stack,Linked List,Binary Tree,B,A Stack operates on LIFO order.
MCQ,Digital Electronics,How many select lines are needed for an 8-to-1 Multiplexer (MUX)?,2,3,4,8,B,An 8-to-1 MUX requires log2(8) = 3 select lines.
MCQ,Computer Networks,What standard port number is used for HTTPS web traffic?,80,21,443,8080,C,Port 443 is universally designated for HTTPS traffic.
FIB,Computer Networks,The protocol used to map an IP address to a physical MAC address is _______.,,,,ARP,Address Resolution Protocol (ARP) resolves IPv4 to MAC addresses.
FIB,Electronics,In a PN junction diode under reverse breakdown the current increases _______.,,,,sharply,Under reverse breakdown the zener or avalanche effect causes a sharp current increase.
FIB,Operating Systems,A binary semaphore initialized to 1 is commonly known as a _______.,,,,Mutex,A binary semaphore functions as a mutual exclusion lock (Mutex).
`;

  // Initial State Management
  const savedQuestions = JSON.parse(localStorage.getItem('portal_assigned_questions') || '[]');
  const initialQuestions = (savedQuestions && savedQuestions.length > 0)
    ? savedQuestions
    : (typeof QUESTIONS_BANK !== 'undefined' && Array.isArray(QUESTIONS_BANK) ? [...QUESTIONS_BANK] : []);

  const state = {
    student: null,
    isAdminLoggedIn: sessionStorage.getItem('admin_logged_in') === 'true',
    isTestPublished: localStorage.getItem('portal_test_published') === 'true',
    testTitle: localStorage.getItem('portal_test_title') || 'Technical Assessment 2026',
    testDuration: parseInt(localStorage.getItem('portal_test_duration') || '45', 10),
    allStudents: typeof REGISTERED_STUDENTS !== 'undefined' ? [...REGISTERED_STUDENTS] : [],
    submissions: [],
    questions: initialQuestions,

    // Exam runtime state
    examCurrentIndex: 0,
    examAnswers: {}, // index -> { answer: '', isReview: false }
    examTimerInterval: null,
    examSecondsLeft: 0,
    examStartTime: null,

    // Result & Evaluation state
    lastResult: null,
    reviewFilter: 'all'
  };

  // Keep window.QUESTIONS_BANK in sync
  window.QUESTIONS_BANK = state.questions;

  // DOM Elements - Global
  const portalStatusBadge = document.getElementById('portal-status-badge');
  const btnNavStudent = document.getElementById('btn-nav-student');
  const btnNavAdmin = document.getElementById('btn-nav-admin');

  // Views
  const studentLoginView = document.getElementById('student-login-view');
  const adminLoginView = document.getElementById('admin-login-view');
  const adminDashboardView = document.getElementById('admin-dashboard-view');
  const noTestView = document.getElementById('no-test-view');
  const examView = document.getElementById('exam-view');
  const resultView = document.getElementById('result-view');

  // DOM Elements - Student Login
  const studentLoginForm = document.getElementById('student-login-form');
  const studentLoginAlert = document.getElementById('student-login-alert');
  const regNoInput = document.getElementById('reg-no');
  const studentNameInput = document.getElementById('student-name');
  const departmentInput = document.getElementById('department');
  const sectionInput = document.getElementById('section');
  const btnQuickFill = document.getElementById('btn-quick-fill');

  // DOM Elements - No Test Screen
  const noTestName = document.getElementById('no-test-name');
  const noTestRegno = document.getElementById('no-test-regno');
  const noTestDeptSec = document.getElementById('no-test-dept-sec');
  const btnBackToHome = document.getElementById('btn-back-to-home');

  // DOM Elements - Admin Login
  const adminLoginForm = document.getElementById('admin-login-form');
  const adminLoginAlert = document.getElementById('admin-login-alert');
  const adminUsernameInput = document.getElementById('admin-username');
  const adminPasswordInput = document.getElementById('admin-password');
  const btnAdminLogout = document.getElementById('btn-admin-logout');

  // DOM Elements - Admin Dashboard
  const metricTotalStudents = document.getElementById('metric-total-students');
  const metricTestStatus = document.getElementById('metric-test-status');
  const metricSubmissionsCount = document.getElementById('metric-submissions-count');
  const metricQuestionsCount = document.getElementById('metric-questions-count');

  // Admin Tab 1 (Publish)
  const publishBannerTitle = document.getElementById('publish-banner-title');
  const publishBannerDesc = document.getElementById('publish-banner-desc');
  const btnTogglePublish = document.getElementById('btn-toggle-publish');
  const adminTestTitleInput = document.getElementById('admin-test-title');
  const adminTestDurationInput = document.getElementById('admin-test-duration');
  const btnSaveTestSettings = document.getElementById('btn-save-test-settings');

  // Admin Tab 2 (Question Manager)
  const btnDownloadTemplate = document.getElementById('btn-download-template');
  const btnClearQuestions = document.getElementById('btn-clear-questions');
  const questionDropzone = document.getElementById('question-dropzone');
  const questionFileInput = document.getElementById('question-file-input');
  const btnBrowseFile = document.getElementById('btn-browse-file');
  const questionUploadAlert = document.getElementById('question-upload-alert');
  const assignedQCount = document.getElementById('assigned-q-count');
  const questionsPreviewTbody = document.getElementById('questions-preview-tbody');

  // Admin Tab 3 (Add Student)
  const addStudentForm = document.getElementById('add-student-form');
  const addStudentAlert = document.getElementById('add-student-alert');
  const newRegnoInput = document.getElementById('new-regno');
  const newNameInput = document.getElementById('new-name');
  const newDeptInput = document.getElementById('new-dept');
  const newSectionInput = document.getElementById('new-section');

  // Admin Tab 4 (Directory)
  const dirCountText = document.getElementById('dir-count-text');
  const filterDirSection = document.getElementById('filter-dir-section');
  const searchDirStudent = document.getElementById('search-dir-student');
  const studentRosterTbody = document.getElementById('student-roster-tbody');

  // Admin Tab 5 (Analytics)
  const sectionProgressCards = document.getElementById('section-progress-cards');
  const submissionsTbody = document.getElementById('submissions-tbody');

  // Exam Workspace Elements
  const examAvatar = document.getElementById('exam-avatar');
  const examStudentName = document.getElementById('exam-student-name');
  const examStudentMeta = document.getElementById('exam-student-meta');
  const examTimerPill = document.getElementById('exam-timer-pill');
  const examTimerDisplay = document.getElementById('exam-timer-display');
  const btnSubmitExam = document.getElementById('btn-submit-exam');

  const examQIndex = document.getElementById('exam-q-index');
  const examQCategory = document.getElementById('exam-q-category');
  const examQTypeBadge = document.getElementById('exam-q-type-badge');
  const btnMarkReview = document.getElementById('btn-mark-review');
  const examQuestionText = document.getElementById('exam-question-text');

  const examMcqContainer = document.getElementById('exam-mcq-container');
  const examFibContainer = document.getElementById('exam-fib-container');
  const examFibInput = document.getElementById('exam-fib-input');

  const btnPrevQ = document.getElementById('btn-prev-q');
  const btnClearQ = document.getElementById('btn-clear-q');
  const btnNextQ = document.getElementById('btn-next-q');

  const palCountAnswered = document.getElementById('pal-count-answered');
  const palCountUnanswered = document.getElementById('pal-count-unanswered');
  const palCountReview = document.getElementById('pal-count-review');
  const palCountTotal = document.getElementById('pal-count-total');
  const examPaletteGrid = document.getElementById('exam-palette-grid');

  // Result Screen Elements
  const resStudentName = document.getElementById('res-student-name');
  const resStudentMeta = document.getElementById('res-student-meta');
  const resMarksObtained = document.getElementById('res-marks-obtained');
  const resPercentage = document.getElementById('res-percentage');
  const resTotalQ = document.getElementById('res-total-q');
  const resCorrectQ = document.getElementById('res-correct-q');
  const resTimeSpent = document.getElementById('res-time-spent');
  const btnResultReturn = document.getElementById('btn-result-return');

  // Answer Key & Performance Review Elements
  const btnDownloadPdf = document.getElementById('btn-download-pdf');
  const btnDownloadCsvAnswers = document.getElementById('btn-download-csv-answers');
  const btnFilterAll = document.getElementById('btn-filter-all');
  const btnFilterWrong = document.getElementById('btn-filter-wrong');
  const btnFilterCorrect = document.getElementById('btn-filter-correct');
  const countAllQ = document.getElementById('count-all-q');
  const countWrongQ = document.getElementById('count-wrong-q');
  const countCorrectQ = document.getElementById('count-correct-q');
  const reviewCardsContainer = document.getElementById('review-cards-container');

  // ========================================================
  // 1. INITIALIZATION & VIEW CONTROLLER
  // ========================================================

  function init() {
    updateStatusBadge();
    setupNavigation();
    setupStudentAuth();
    setupAdminAuth();
    setupAdminDashboard();
    setupQuestionManager();
    setupExamWorkspace();
    setupResultReview();

    // Check if admin is currently active
    if (state.isAdminLoggedIn) {
      showView(adminDashboardView);
      btnNavAdmin.classList.add('active');
      btnNavStudent.classList.remove('active');
      refreshAdminData();
    } else {
      showView(studentLoginView);
    }
  }

  function updateStatusBadge() {
    const hasQuestions = state.questions && state.questions.length > 0;

    if (state.isTestPublished && hasQuestions) {
      portalStatusBadge.className = 'status-badge active';
      portalStatusBadge.textContent = '● Test Published & Active';
      if (metricTestStatus) {
        metricTestStatus.textContent = 'Published';
        metricTestStatus.style.color = '#10b981';
      }
      if (publishBannerTitle) publishBannerTitle.textContent = 'Current State: Published (Live)';
      if (publishBannerDesc) publishBannerDesc.textContent = `Students can now enter their register number and access the ${state.questions.length}-question assessment.`;
      if (btnTogglePublish) {
        btnTogglePublish.className = 'btn-unpublish';
        btnTogglePublish.innerHTML = '<span>Stop / Unpublish Test</span>';
      }
    } else if (state.isTestPublished && !hasQuestions) {
      portalStatusBadge.className = 'status-badge inactive';
      portalStatusBadge.textContent = '● Published (0 Questions Loaded)';
      if (metricTestStatus) {
        metricTestStatus.textContent = 'Pending Questions';
        metricTestStatus.style.color = '#f59e0b';
      }
      if (publishBannerTitle) publishBannerTitle.textContent = 'Current State: Published, but 0 Questions';
      if (publishBannerDesc) publishBannerDesc.textContent = 'Upload questions via the Question Manager tab to allow students to take the test.';
      if (btnTogglePublish) {
        btnTogglePublish.className = 'btn-unpublish';
        btnTogglePublish.innerHTML = '<span>Stop / Unpublish Test</span>';
      }
    } else {
      portalStatusBadge.className = 'status-badge inactive';
      portalStatusBadge.textContent = '● No Active Assessment';
      if (metricTestStatus) {
        metricTestStatus.textContent = 'Unpublished';
        metricTestStatus.style.color = '#f59e0b';
      }
      if (publishBannerTitle) publishBannerTitle.textContent = 'Current State: Unpublished';
      if (publishBannerDesc) publishBannerDesc.textContent = 'Students currently see "There is no test right now" upon login.';
      if (btnTogglePublish) {
        btnTogglePublish.className = 'btn-publish';
        btnTogglePublish.innerHTML = '<span>Publish Test to Students</span>';
      }
    }

    if (metricQuestionsCount) {
      metricQuestionsCount.textContent = state.questions.length;
    }
  }

  function showView(targetView) {
    [studentLoginView, adminLoginView, adminDashboardView, noTestView, examView, resultView].forEach(v => {
      if (v) v.classList.add('hidden');
    });
    if (targetView) targetView.classList.remove('hidden');
  }

  function setupNavigation() {
    btnNavStudent.addEventListener('click', () => {
      if (examView && !examView.classList.contains('hidden')) {
        if (!confirm('You are currently taking the exam. Are you sure you want to leave? Your progress will be lost.')) {
          return;
        }
        clearInterval(state.examTimerInterval);
      }
      btnNavStudent.classList.add('active');
      btnNavAdmin.classList.remove('active');
      showView(studentLoginView);
    });

    btnNavAdmin.addEventListener('click', () => {
      if (examView && !examView.classList.contains('hidden')) {
        if (!confirm('You are currently taking the exam. Are you sure you want to leave?')) {
          return;
        }
        clearInterval(state.examTimerInterval);
      }
      btnNavAdmin.classList.add('active');
      btnNavStudent.classList.remove('active');
      if (state.isAdminLoggedIn) {
        showView(adminDashboardView);
        refreshAdminData();
      } else {
        showView(adminLoginView);
      }
    });

    if (btnBackToHome) {
      btnBackToHome.addEventListener('click', () => {
        showView(studentLoginView);
        btnNavStudent.classList.add('active');
        btnNavAdmin.classList.remove('active');
      });
    }

    if (btnResultReturn) {
      btnResultReturn.addEventListener('click', () => {
        showView(studentLoginView);
        btnNavStudent.classList.add('active');
        btnNavAdmin.classList.remove('active');
        if (regNoInput) regNoInput.value = '';
        if (studentNameInput) studentNameInput.value = '';
        if (sectionInput) sectionInput.value = '';
      });
    }
  }

  // ========================================================
  // 2. STUDENT LOGIN & VERIFICATION
  // ========================================================

  function setupStudentAuth() {
    if (btnQuickFill) {
      btnQuickFill.addEventListener('click', () => {
        const sample = state.allStudents.length > 0
          ? state.allStudents[0]
          : { reg_no: "922525106001", name: "AASHIFA SAHANAJ M", department: "ECE", section: "A" };
        regNoInput.value = sample.reg_no;
        studentNameInput.value = sample.name;
        departmentInput.value = sample.department;
        sectionInput.value = sample.section;
        hideAlert(studentLoginAlert);
      });
    }

    async function autoFill() {
      const regNo = regNoInput.value.trim().toUpperCase();
      if (!regNo || regNo.length < 5) return;

      let student = null;
      if (typeof SupabaseAPI !== 'undefined' && SupabaseAPI.isConfigured()) {
        student = await SupabaseAPI.findStudent(regNo);
      }
      if (!student) {
        student = state.allStudents.find(s => s.reg_no.toUpperCase() === regNo);
      }

      if (student) {
        studentNameInput.value = student.name;
        departmentInput.value = student.department;
        sectionInput.value = student.section;
        hideAlert(studentLoginAlert);
      }
    }

    regNoInput.addEventListener('blur', autoFill);
    regNoInput.addEventListener('input', () => {
      if (regNoInput.value.trim().length >= 10) autoFill();
    });

    studentLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(studentLoginAlert);

      const regNo = regNoInput.value.trim().toUpperCase();
      let name = studentNameInput.value.trim();
      let department = departmentInput.value.trim();
      let section = sectionInput.value.trim();

      if (!regNo) {
        showCustomAlert(studentLoginAlert, 'Please enter your Register Number.');
        return;
      }

      const btnEnter = document.getElementById('btn-enter-test');
      const originalText = btnEnter.innerHTML;
      btnEnter.disabled = true;
      btnEnter.innerHTML = `<span>Verifying Register Number...</span>`;

      try {
        let matchedStudent = null;
        if (typeof SupabaseAPI !== 'undefined' && SupabaseAPI.isConfigured()) {
          matchedStudent = await SupabaseAPI.findStudent(regNo);
        }
        if (!matchedStudent) {
          matchedStudent = state.allStudents.find(s => s.reg_no.toUpperCase() === regNo);
        }

        if (!matchedStudent) {
          showCustomAlert(studentLoginAlert, `Access Denied: Register Number "${regNo}" was not found in the official roster. Only registered students can access the portal.`);
          btnEnter.disabled = false;
          btnEnter.innerHTML = originalText;
          return;
        }

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
        btnEnter.innerHTML = originalText;

        // Check if test is published and questions are assigned
        if (!state.isTestPublished || !state.questions || state.questions.length === 0) {
          noTestName.textContent = state.student.name;
          noTestRegno.textContent = state.student.reg_no;
          noTestDeptSec.textContent = `${state.student.department} • Section ${state.student.section}`;
          showView(noTestView);
          return;
        }

        // Start Assessment!
        startAssessment();
      } catch (err) {
        console.error('[Student Auth Error]:', err);
        showCustomAlert(studentLoginAlert, `Verification error: ${err.message}.`);
        btnEnter.disabled = false;
        btnEnter.innerHTML = originalText;
      }
    });
  }

  // ========================================================
  // 3. ADMIN AUTHENTICATION
  // ========================================================

  function setupAdminAuth() {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      hideAlert(adminLoginAlert);

      const username = adminUsernameInput.value.trim();
      const password = adminPasswordInput.value.trim();

      if (username === 'admin' && password === 'admin123') {
        state.isAdminLoggedIn = true;
        sessionStorage.setItem('admin_logged_in', 'true');
        showView(adminDashboardView);
        btnNavAdmin.classList.add('active');
        btnNavStudent.classList.remove('active');
        refreshAdminData();
      } else {
        showCustomAlert(adminLoginAlert, 'Invalid Username or Password. Please try again.');
      }
    });

    if (btnAdminLogout) {
      btnAdminLogout.addEventListener('click', () => {
        state.isAdminLoggedIn = false;
        sessionStorage.removeItem('admin_logged_in');
        showView(studentLoginView);
        btnNavStudent.classList.add('active');
        btnNavAdmin.classList.remove('active');
      });
    }
  }

  // ========================================================
  // 4. ADMIN DASHBOARD & CONTROLS
  // ========================================================

  function setupAdminDashboard() {
    const adminTabs = document.querySelectorAll('.admin-tab');
    const tabContents = document.querySelectorAll('.admin-tab-content');

    adminTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        adminTabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.add('hidden'));

        tab.classList.add('active');
        const targetId = tab.getAttribute('data-target');
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.remove('hidden');

        if (targetId === 'admin-tab-questions') renderQuestionsPreview();
        if (targetId === 'admin-tab-directory') renderStudentDirectory();
        if (targetId === 'admin-tab-analytics') renderAnalytics();
      });
    });

    if (btnTogglePublish) {
      btnTogglePublish.addEventListener('click', () => {
        state.isTestPublished = !state.isTestPublished;
        localStorage.setItem('portal_test_published', state.isTestPublished ? 'true' : 'false');
        updateStatusBadge();

        if (state.isTestPublished) {
          if (state.questions.length === 0) {
            alert('Assessment published! However, 0 questions are currently loaded. Please upload questions in the Question Manager tab.');
          } else {
            alert(`Assessment is now LIVE and PUBLISHED with ${state.questions.length} questions! Students can now take the test.`);
          }
        } else {
          alert('Assessment has been UNPUBLISHED! Students will see "There is no test right now".');
        }
      });
    }

    if (btnSaveTestSettings) {
      btnSaveTestSettings.addEventListener('click', () => {
        const title = adminTestTitleInput.value.trim() || 'Technical Assessment 2026';
        const duration = parseInt(adminTestDurationInput.value || '45', 10);
        state.testTitle = title;
        state.testDuration = duration;
        localStorage.setItem('portal_test_title', title);
        localStorage.setItem('portal_test_duration', duration.toString());
        alert('Test configuration updated successfully!');
      });
    }

    if (addStudentForm) {
      addStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(addStudentAlert);

        const regno = newRegnoInput.value.trim().toUpperCase();
        const name = newNameInput.value.trim();
        const dept = newDeptInput.value.trim();
        const sec = newSectionInput.value.trim();

        if (!regno || !name || !dept || !sec) {
          showCustomAlert(addStudentAlert, 'Please fill in all student details.');
          return;
        }

        const exists = state.allStudents.find(s => s.reg_no.toUpperCase() === regno);
        if (exists) {
          showCustomAlert(addStudentAlert, `Student with Register Number ${regno} already exists in the roster.`);
          return;
        }

        const newStudent = { reg_no: regno, name, department: dept, section: sec };

        if (typeof SupabaseAPI !== 'undefined' && SupabaseAPI.isConfigured()) {
          const res = await SupabaseAPI.addStudent(newStudent);
          if (!res.success) {
            console.warn('[Supabase Add Student Warning]:', res.error);
          }
        }

        state.allStudents.unshift(newStudent);
        addStudentAlert.className = 'alert alert-success';
        addStudentAlert.textContent = `Student ${name} (${regno}) added successfully to the database!`;
        addStudentAlert.style.display = 'block';

        newRegnoInput.value = '';
        newNameInput.value = '';

        refreshAdminData();
      });
    }

    if (filterDirSection) {
      filterDirSection.addEventListener('change', renderStudentDirectory);
    }
    if (searchDirStudent) {
      searchDirStudent.addEventListener('input', renderStudentDirectory);
    }
  }

  // ========================================================
  // 5. QUESTION MANAGER (CSV & EXCEL .XLSX/.XLS UPLOADER)
  // ========================================================

  function setupQuestionManager() {
    // 1. Download Sample Question Template (.CSV)
    if (btnDownloadTemplate) {
      btnDownloadTemplate.addEventListener('click', () => {
        const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sample_question_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    }

    // 2. Clear All Questions
    if (btnClearQuestions) {
      btnClearQuestions.addEventListener('click', () => {
        if (state.questions.length === 0) {
          alert('Question bank is already empty.');
          return;
        }
        if (confirm(`Are you sure you want to clear all ${state.questions.length} questions from the test portal?`)) {
          state.questions = [];
          localStorage.removeItem('portal_assigned_questions');
          window.QUESTIONS_BANK = [];
          renderQuestionsPreview();
          updateStatusBadge();
          showCustomAlert(questionUploadAlert, 'All questions have been cleared.');
          questionUploadAlert.className = 'alert alert-info';
          questionUploadAlert.style.display = 'block';
        }
      });
    }

    // 3. Dropzone & File Browse
    if (btnBrowseFile && questionFileInput) {
      btnBrowseFile.addEventListener('click', (e) => {
        e.stopPropagation();
        questionFileInput.click();
      });
    }

    if (questionDropzone && questionFileInput) {
      questionDropzone.addEventListener('click', () => {
        questionFileInput.click();
      });

      ['dragenter', 'dragover'].forEach(name => {
        questionDropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          questionDropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        questionDropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          questionDropzone.classList.remove('dragover');
        });
      });

      questionDropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          handleQuestionFileUpload(files[0]);
        }
      });

      questionFileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
          handleQuestionFileUpload(files[0]);
        }
      });
    }

    // Render initial questions
    renderQuestionsPreview();
  }

  // Handle uploaded Excel or CSV file
  function handleQuestionFileUpload(file) {
    hideAlert(questionUploadAlert);

    const validExts = ['.csv', '.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValid = validExts.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      showCustomAlert(questionUploadAlert, 'Invalid file format. Please upload a .csv, .xlsx, or .xls file.');
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        if (typeof XLSX === 'undefined') {
          showCustomAlert(questionUploadAlert, 'Excel parsing library (SheetJS) is loading. Please check your internet connection.');
          return;
        }

        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rows || rows.length === 0) {
          showCustomAlert(questionUploadAlert, 'The uploaded file contains no data rows.');
          return;
        }

        const parsedQuestions = parseQuestionRows(rows);

        if (parsedQuestions.length === 0) {
          showCustomAlert(questionUploadAlert, 'No valid questions could be extracted. Please ensure column headers match the template (Type, Question, Option A-D, Correct Answer).');
          return;
        }

        // Save into state & localStorage
        state.questions = parsedQuestions;
        window.QUESTIONS_BANK = parsedQuestions;
        localStorage.setItem('portal_assigned_questions', JSON.stringify(parsedQuestions));

        const mcqCount = parsedQuestions.filter(q => q.type === 'MCQ').length;
        const fibCount = parsedQuestions.filter(q => q.type === 'FIB').length;

        questionUploadAlert.className = 'alert alert-success';
        questionUploadAlert.textContent = `Successfully processed ${parsedQuestions.length} questions (${mcqCount} MCQ, ${fibCount} Fill in the Blanks) from "${file.name}"!`;
        questionUploadAlert.style.display = 'block';

        renderQuestionsPreview();
        updateStatusBadge();

        if (questionFileInput) questionFileInput.value = '';
      } catch (err) {
        console.error('[Question Upload Error]:', err);
        showCustomAlert(questionUploadAlert, `Failed to parse file: ${err.message}`);
      }
    };

    reader.readAsArrayBuffer(file);
  }

  // Normalize column rows into structured question objects
  function parseQuestionRows(rows) {
    const questions = [];

    rows.forEach((rawRow, index) => {
      const row = {};
      Object.keys(rawRow).forEach(k => {
        row[k.trim().toLowerCase()] = String(rawRow[k]).trim();
      });

      const questionText = row['question'] || row['question text'] || row['prompt'] || row['q'] || '';
      if (!questionText) return;

      const rawType = (row['type'] || row['question type'] || '').toUpperCase();
      let type = 'MCQ';

      if (rawType.includes('FIB') || rawType.includes('BLANK') || rawType.includes('FILL')) {
        type = 'FIB';
      } else if (!row['option a'] && !row['option b'] && (questionText.includes('___') || questionText.includes('...'))) {
        type = 'FIB';
      }

      const category = row['category'] || row['subject'] || row['topic'] || 'General';
      const rawCorrect = row['correct answer'] || row['correct'] || row['answer'] || row['correct_answer'] || '';
      const explanation = row['explanation'] || row['solution'] || row['reason'] || '';

      if (type === 'MCQ') {
        const optionA = row['option a'] || row['option_a'] || row['a'] || '';
        const optionB = row['option b'] || row['option_b'] || row['b'] || '';
        const optionC = row['option c'] || row['option_c'] || row['c'] || '';
        const optionD = row['option d'] || row['option_d'] || row['d'] || '';

        let cleanCorrect = rawCorrect.toUpperCase();
        if (!['A', 'B', 'C', 'D'].includes(cleanCorrect)) {
          if (cleanCorrect === optionA.toUpperCase()) cleanCorrect = 'A';
          else if (cleanCorrect === optionB.toUpperCase()) cleanCorrect = 'B';
          else if (cleanCorrect === optionC.toUpperCase()) cleanCorrect = 'C';
          else if (cleanCorrect === optionD.toUpperCase()) cleanCorrect = 'D';
          else cleanCorrect = 'A';
        }

        questions.push({
          id: index + 1,
          type: 'MCQ',
          category: category,
          question: questionText,
          options: {
            A: optionA || 'Option A',
            B: optionB || 'Option B',
            C: optionC || 'Option C',
            D: optionD || 'Option D'
          },
          correctAnswer: cleanCorrect,
          explanation: explanation
        });
      } else {
        questions.push({
          id: index + 1,
          type: 'FIB',
          category: category,
          question: questionText,
          options: null,
          correctAnswer: rawCorrect,
          explanation: explanation
        });
      }
    });

    return questions;
  }

  // Render question preview table in admin tab
  function renderQuestionsPreview() {
    if (!questionsPreviewTbody) return;

    if (assignedQCount) assignedQCount.textContent = state.questions.length;
    if (metricQuestionsCount) metricQuestionsCount.textContent = state.questions.length;

    if (state.questions.length === 0) {
      questionsPreviewTbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: #64748b; padding: 24px;">
            No questions loaded yet. Upload an Excel (.xlsx) or CSV file above or download the sample template.
          </td>
        </tr>
      `;
      return;
    }

    questionsPreviewTbody.innerHTML = state.questions.map((q, idx) => {
      const typeBadge = q.type === 'MCQ'
        ? `<span class="badge-mcq">MCQ</span>`
        : `<span class="badge-fib">FIB</span>`;

      let optionsDisplay = '';
      if (q.type === 'MCQ' && q.options) {
        optionsDisplay = `
          <div style="font-size: 0.78rem; line-height: 1.4; color: #cbd5e1;">
            <div><strong>A:</strong> ${escapeHtml(q.options.A)}</div>
            <div><strong>B:</strong> ${escapeHtml(q.options.B)}</div>
            <div><strong>C:</strong> ${escapeHtml(q.options.C)}</div>
            <div><strong>D:</strong> ${escapeHtml(q.options.D)}</div>
          </div>
        `;
      } else {
        optionsDisplay = `<span style="color: #94a3b8; font-style: italic; font-size: 0.8rem;">Text Blank Input</span>`;
      }

      return `
        <tr>
          <td style="color: #64748b;">${idx + 1}</td>
          <td>${typeBadge}</td>
          <td><span class="badge-sec">${escapeHtml(q.category)}</span></td>
          <td style="font-weight: 500; max-width: 320px;">${escapeHtml(q.question)}</td>
          <td>${optionsDisplay}</td>
          <td><strong style="color: #10b981; font-family: monospace;">${escapeHtml(q.correctAnswer)}</strong></td>
          <td>
            <button type="button" class="btn-delete-q" data-idx="${idx}" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px;" title="Delete Question">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('.btn-delete-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        if (!isNaN(idx) && idx >= 0 && idx < state.questions.length) {
          state.questions.splice(idx, 1);
          localStorage.setItem('portal_assigned_questions', JSON.stringify(state.questions));
          window.QUESTIONS_BANK = state.questions;
          renderQuestionsPreview();
          updateStatusBadge();
        }
      });
    });
  }

  // ========================================================
  // 6. STUDENT EXAMINATION WORKSPACE & LOGIC
  // ========================================================

  function setupExamWorkspace() {
    if (btnPrevQ) {
      btnPrevQ.addEventListener('click', () => {
        if (state.examCurrentIndex > 0) {
          state.examCurrentIndex--;
          renderExamQuestion(state.examCurrentIndex);
        }
      });
    }

    if (btnNextQ) {
      btnNextQ.addEventListener('click', () => {
        if (state.examCurrentIndex < state.questions.length - 1) {
          state.examCurrentIndex++;
          renderExamQuestion(state.examCurrentIndex);
        } else {
          submitAssessment();
        }
      });
    }

    if (btnClearQ) {
      btnClearQ.addEventListener('click', () => {
        const curr = state.examAnswers[state.examCurrentIndex];
        if (curr) {
          curr.answer = '';
          renderExamQuestion(state.examCurrentIndex);
          updatePaletteStats();
        }
      });
    }

    if (btnMarkReview) {
      btnMarkReview.addEventListener('click', () => {
        const curr = state.examAnswers[state.examCurrentIndex];
        if (curr) {
          curr.isReview = !curr.isReview;
          renderExamQuestion(state.examCurrentIndex);
          updatePaletteStats();
        }
      });
    }

    if (btnSubmitExam) {
      btnSubmitExam.addEventListener('click', () => {
        submitAssessment();
      });
    }
  }

  function startAssessment() {
    if (!state.student || state.questions.length === 0) return;

    state.examAnswers = {};
    state.questions.forEach((q, idx) => {
      state.examAnswers[idx] = { answer: '', isReview: false };
    });

    state.examCurrentIndex = 0;
    state.examStartTime = new Date();
    state.examSecondsLeft = (state.testDuration || 45) * 60;

    if (examAvatar) examAvatar.textContent = (state.student.name || 'S').charAt(0).toUpperCase();
    if (examStudentName) examStudentName.textContent = state.student.name;
    if (examStudentMeta) examStudentMeta.textContent = `${state.student.department} • Section ${state.student.section} • ${state.student.reg_no}`;

    showView(examView);
    renderPaletteGrid();
    renderExamQuestion(0);
    startExamTimer();
  }

  function startExamTimer() {
    if (state.examTimerInterval) clearInterval(state.examTimerInterval);

    updateTimerDisplay();

    state.examTimerInterval = setInterval(() => {
      state.examSecondsLeft--;

      if (state.examSecondsLeft <= 0) {
        clearInterval(state.examTimerInterval);
        state.examSecondsLeft = 0;
        updateTimerDisplay();
        alert('Time is up! Your examination is being automatically submitted.');
        finalizeSubmission();
      } else {
        updateTimerDisplay();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    if (!examTimerDisplay) return;

    const mins = Math.floor(state.examSecondsLeft / 60);
    const secs = state.examSecondsLeft % 60;
    const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    examTimerDisplay.textContent = str;

    if (state.examSecondsLeft < 300) {
      examTimerPill.className = 'timer-pill danger';
    } else if (state.examSecondsLeft < 600) {
      examTimerPill.className = 'timer-pill warning';
    } else {
      examTimerPill.className = 'timer-pill';
    }
  }

  function renderExamQuestion(index) {
    const q = state.questions[index];
    if (!q) return;

    if (examQIndex) examQIndex.textContent = `Question ${index + 1} of ${state.questions.length}`;
    if (examQCategory) examQCategory.textContent = q.category || 'General';

    if (examQTypeBadge) {
      examQTypeBadge.className = q.type === 'MCQ' ? 'badge-mcq' : 'badge-fib';
      examQTypeBadge.textContent = q.type === 'MCQ' ? 'Multiple Choice' : 'Fill in the Blank';
    }

    const currAns = state.examAnswers[index] || { answer: '', isReview: false };

    if (btnMarkReview) {
      if (currAns.isReview) {
        btnMarkReview.style.background = 'rgba(168, 85, 247, 0.25)';
        btnMarkReview.style.borderColor = '#a855f7';
        btnMarkReview.style.color = '#e9d5ff';
        btnMarkReview.innerHTML = '<span>★ Marked for Review</span>';
      } else {
        btnMarkReview.style.background = 'transparent';
        btnMarkReview.style.borderColor = 'var(--border-color)';
        btnMarkReview.style.color = 'var(--text-secondary)';
        btnMarkReview.innerHTML = '<span>🔖 Mark for Review</span>';
      }
    }

    if (examQuestionText) examQuestionText.textContent = q.question;

    if (q.type === 'MCQ') {
      if (examMcqContainer) examMcqContainer.classList.remove('hidden');
      if (examFibContainer) examFibContainer.classList.add('hidden');

      const opts = q.options || {};
      const keys = ['A', 'B', 'C', 'D'];

      if (examMcqContainer) {
        examMcqContainer.innerHTML = keys.map(k => {
          const isSelected = currAns.answer === k;
          return `
            <div class="mcq-option-card ${isSelected ? 'selected' : ''}" data-opt="${k}">
              <div class="option-badge">${k}</div>
              <div style="font-size: 0.95rem; color: #f8fafc;">${escapeHtml(opts[k] || '')}</div>
            </div>
          `;
        }).join('');

        examMcqContainer.querySelectorAll('.mcq-option-card').forEach(card => {
          card.addEventListener('click', () => {
            const chosen = card.getAttribute('data-opt');
            state.examAnswers[index].answer = chosen;
            renderExamQuestion(index);
            updatePaletteStats();
          });
        });
      }
    } else {
      if (examMcqContainer) examMcqContainer.classList.add('hidden');
      if (examFibContainer) examFibContainer.classList.remove('hidden');

      if (examFibInput) {
        examFibInput.value = currAns.answer || '';
        examFibInput.oninput = (e) => {
          state.examAnswers[index].answer = e.target.value;
          updatePaletteStats();
        };
      }
    }

    if (btnPrevQ) {
      btnPrevQ.disabled = (index === 0);
      btnPrevQ.style.opacity = (index === 0) ? '0.4' : '1';
    }

    if (btnNextQ) {
      if (index === state.questions.length - 1) {
        btnNextQ.innerHTML = '<span>Finish & Submit Test ✓</span>';
      } else {
        btnNextQ.innerHTML = '<span>Next Question →</span>';
      }
    }

    updatePaletteStats();
  }

  function renderPaletteGrid() {
    if (!examPaletteGrid) return;

    examPaletteGrid.innerHTML = state.questions.map((q, idx) => `
      <button type="button" class="pal-btn" id="pal-btn-${idx}" data-idx="${idx}">
        ${idx + 1}
      </button>
    `).join('');

    examPaletteGrid.querySelectorAll('.pal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        state.examCurrentIndex = idx;
        renderExamQuestion(idx);
      });
    });

    updatePaletteStats();
  }

  function updatePaletteStats() {
    let answered = 0;
    let review = 0;
    const total = state.questions.length;

    state.questions.forEach((q, idx) => {
      const resp = state.examAnswers[idx] || { answer: '', isReview: false };
      const hasAnswer = (resp.answer && resp.answer.trim().length > 0);
      const isRev = resp.isReview;

      if (hasAnswer) answered++;
      if (isRev) review++;

      const btn = document.getElementById(`pal-btn-${idx}`);
      if (btn) {
        btn.className = 'pal-btn';
        if (idx === state.examCurrentIndex) btn.classList.add('current');
        if (isRev) btn.classList.add('review');
        else if (hasAnswer) btn.classList.add('answered');
      }
    });

    const unanswered = total - answered;

    if (palCountAnswered) palCountAnswered.textContent = `${answered} Answered`;
    if (palCountUnanswered) palCountUnanswered.textContent = `${unanswered} Unanswered`;
    if (palCountReview) palCountReview.textContent = `${review} In Review`;
    if (palCountTotal) palCountTotal.textContent = `Total: ${total}`;
  }

  function submitAssessment() {
    let answered = 0;
    state.questions.forEach((q, idx) => {
      const resp = state.examAnswers[idx];
      if (resp && resp.answer && resp.answer.trim().length > 0) answered++;
    });
    const unanswered = state.questions.length - answered;

    const confirmMsg = unanswered > 0
      ? `You have answered ${answered} of ${state.questions.length} questions.\n${unanswered} questions are still unanswered.\n\nAre you sure you want to finish and submit the assessment now?`
      : `You have answered all ${state.questions.length} questions!\n\nAre you sure you want to submit your assessment?`;

    if (confirm(confirmMsg)) {
      clearInterval(state.examTimerInterval);
      finalizeSubmission();
    }
  }

  // ========================================================
  // 7. EVALUATION, RESULTS & ANSWER KEY REPORT GENERATION
  // ========================================================

  async function finalizeSubmission() {
    let correctCount = 0;
    const totalQ = state.questions.length;
    const incorrectRecords = [];
    const evaluations = [];

    state.questions.forEach((q, idx) => {
      const resp = state.examAnswers[idx] || { answer: '' };
      const studentAns = (resp.answer || '').trim();
      const isSkipped = !studentAns;
      let isCorrect = false;

      let studentDisplay = studentAns;
      let correctDisplay = q.correctAnswer;

      if (q.type === 'MCQ') {
        isCorrect = !isSkipped && (studentAns.toUpperCase() === q.correctAnswer.toUpperCase());
        if (q.options) {
          const sUpper = studentAns.toUpperCase();
          const cUpper = q.correctAnswer.toUpperCase();
          if (q.options[sUpper]) {
            studentDisplay = `(${sUpper}) ${q.options[sUpper]}`;
          }
          if (q.options[cUpper]) {
            correctDisplay = `(${cUpper}) ${q.options[cUpper]}`;
          }
        }
      } else {
        isCorrect = !isSkipped && (studentAns.toLowerCase() === q.correctAnswer.trim().toLowerCase());
      }

      if (isCorrect) {
        correctCount++;
      } else {
        incorrectRecords.push({
          qno: idx + 1,
          question: q.question,
          studentAns: studentAns || '(No Answer)',
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || ''
        });
      }

      evaluations.push({
        qno: idx + 1,
        type: q.type,
        category: q.category || 'General',
        question: q.question,
        options: q.options,
        studentAnswer: studentAns,
        studentDisplay: isSkipped ? '(Not Answered)' : studentDisplay,
        correctAnswer: q.correctAnswer,
        correctDisplay: correctDisplay,
        isCorrect: isCorrect,
        isSkipped: isSkipped,
        explanation: q.explanation || ''
      });
    });

    const totalMarks = totalQ;
    const obtainedMarks = correctCount;
    const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(1) : 0;

    const totalSecondsAllocated = (state.testDuration || 45) * 60;
    const timeSpentSeconds = Math.max(1, totalSecondsAllocated - state.examSecondsLeft);
    const timeSpentMins = Math.floor(timeSpentSeconds / 60);
    const timeSpentSecs = timeSpentSeconds % 60;
    const timeSpentFormatted = `${timeSpentMins}m ${timeSpentSecs}s`;

    const submissionData = {
      reg_no: state.student.reg_no,
      student_name: state.student.name,
      department: state.student.department,
      section: state.student.section,
      total_marks: totalMarks,
      obtained_marks: obtainedMarks,
      percentage: parseFloat(percentage),
      time_taken_seconds: timeSpentSeconds,
      submitted_at: new Date().toISOString()
    };

    // Save evaluation result into state
    state.lastResult = {
      student: { ...state.student },
      testTitle: state.testTitle || 'Technical Assessment 2026',
      totalMarks,
      obtainedMarks: correctCount,
      percentage: parseFloat(percentage),
      timeSpentMins,
      timeSpentSecs,
      timeSpentFormatted,
      submittedAt: submissionData.submitted_at,
      evaluations: evaluations
    };

    // Save to Supabase Cloud if configured
    if (typeof SupabaseAPI !== 'undefined' && SupabaseAPI.isConfigured()) {
      try {
        await SupabaseAPI.saveSubmission(submissionData, incorrectRecords);
      } catch (err) {
        console.warn('[Supabase Submission Warning]:', err);
      }
    }

    // Save to localStorage submissions
    const localSubs = JSON.parse(localStorage.getItem('portal_submissions') || '[]');
    localSubs.unshift(submissionData);
    localStorage.setItem('portal_submissions', JSON.stringify(localSubs));
    state.submissions.unshift(submissionData);

    // Populate Results View Summary Banner
    if (resStudentName) resStudentName.textContent = state.student.name;
    if (resStudentMeta) resStudentMeta.textContent = `${state.student.department} • Section ${state.student.section} • ${state.student.reg_no}`;
    if (resMarksObtained) resMarksObtained.textContent = `${obtainedMarks} / ${totalMarks}`;
    if (resPercentage) {
      resPercentage.textContent = `${percentage}%`;
      resPercentage.style.color = percentage >= 50 ? '#10b981' : '#ef4444';
    }
    if (resTotalQ) resTotalQ.textContent = totalQ;
    if (resCorrectQ) resCorrectQ.textContent = correctCount;
    if (resTimeSpent) resTimeSpent.textContent = timeSpentFormatted;

    // Render Detailed Answer Key & Solutions
    renderAnswerReviewCards();

    // Show Results View
    showView(resultView);
  }

  // Setup click listeners for answer review filters & downloads
  function setupResultReview() {
    if (btnDownloadPdf) {
      btnDownloadPdf.addEventListener('click', downloadAnswerKeyPDF);
    }

    if (btnDownloadCsvAnswers) {
      btnDownloadCsvAnswers.addEventListener('click', downloadAnswerKeyCSV);
    }

    const filterBtns = [
      { el: btnFilterAll, key: 'all' },
      { el: btnFilterWrong, key: 'wrong' },
      { el: btnFilterCorrect, key: 'correct' }
    ];

    filterBtns.forEach(({ el, key }) => {
      if (el) {
        el.addEventListener('click', () => {
          filterBtns.forEach(b => { if (b.el) b.el.classList.remove('active'); });
          el.classList.add('active');
          state.reviewFilter = key;
          renderAnswerReviewCards();
        });
      }
    });
  }

  // Render question-by-question review cards on results page
  function renderAnswerReviewCards() {
    if (!state.lastResult || !reviewCardsContainer) return;

    const evals = state.lastResult.evaluations || [];
    const filter = state.reviewFilter || 'all';

    const correctTotal = evals.filter(e => e.isCorrect).length;
    const wrongTotal = evals.filter(e => !e.isCorrect).length;

    if (countAllQ) countAllQ.textContent = evals.length;
    if (countWrongQ) countWrongQ.textContent = wrongTotal;
    if (countCorrectQ) countCorrectQ.textContent = correctTotal;

    const filtered = evals.filter(item => {
      if (filter === 'wrong') return !item.isCorrect;
      if (filter === 'correct') return item.isCorrect;
      return true;
    });

    if (filtered.length === 0) {
      reviewCardsContainer.innerHTML = `
        <div style="text-align: center; color: #64748b; padding: 26px; background: #0f172a; border-radius: 8px; border: 1px solid #334155;">
          No questions found matching this filter.
        </div>
      `;
      return;
    }

    reviewCardsContainer.innerHTML = filtered.map(item => {
      let cardClass = 'answer-review-card ';
      let statusBadge = '';
      let answerComparisonHTML = '';

      if (item.isCorrect) {
        cardClass += 'correct';
        statusBadge = `<span class="badge-status-correct">✔ CORRECT (+1 Mark)</span>`;
        answerComparisonHTML = `
          <div class="ans-row student-correct">
            <div>
              <span style="font-size: 0.8rem; color: #6ee7b7; display: block; margin-bottom: 2px;">Your Answer:</span>
              <strong>${escapeHtml(item.studentDisplay)}</strong>
            </div>
            <span class="ans-tag correct">✔ Correct</span>
          </div>
        `;
      } else if (item.isSkipped) {
        cardClass += 'skipped';
        statusBadge = `<span class="badge-status-skipped">⚠ NOT ANSWERED (0 Marks)</span>`;
        answerComparisonHTML = `
          <div class="ans-row student-skipped">
            <div>
              <span style="font-size: 0.8rem; color: #fcd34d; display: block; margin-bottom: 2px;">Your Answer:</span>
              <em style="color: #cbd5e1;">(Candidate skipped this question)</em>
            </div>
            <span class="ans-tag skipped">Skipped</span>
          </div>
          <div class="ans-row key-correct">
            <div>
              <span style="font-size: 0.8rem; color: #6ee7b7; display: block; margin-bottom: 2px;">Official Correct Answer:</span>
              <strong>${escapeHtml(item.correctDisplay)}</strong>
            </div>
            <span class="ans-tag correct">✔ Right Answer</span>
          </div>
        `;
      } else {
        cardClass += 'wrong';
        statusBadge = `<span class="badge-status-wrong">✘ WRONG / INCORRECT (0 Marks)</span>`;
        answerComparisonHTML = `
          <div class="ans-row student-wrong">
            <div>
              <span style="font-size: 0.8rem; color: #fca5a5; display: block; margin-bottom: 2px;">Your Answer:</span>
              <strong>${escapeHtml(item.studentDisplay)}</strong>
            </div>
            <span class="ans-tag wrong">✘ Incorrect</span>
          </div>
          <div class="ans-row key-correct">
            <div>
              <span style="font-size: 0.8rem; color: #6ee7b7; display: block; margin-bottom: 2px;">Official Correct Answer:</span>
              <strong>${escapeHtml(item.correctDisplay)}</strong>
            </div>
            <span class="ans-tag correct">✔ Right Answer</span>
          </div>
        `;
      }

      let optionsPreview = '';
      if (item.type === 'MCQ' && item.options) {
        optionsPreview = `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin: 10px 0; font-size: 0.82rem; color: #94a3b8;">
            <div style="padding: 6px 10px; background: rgba(30, 41, 59, 0.6); border-radius: 6px;"><strong>A:</strong> ${escapeHtml(item.options.A || '')}</div>
            <div style="padding: 6px 10px; background: rgba(30, 41, 59, 0.6); border-radius: 6px;"><strong>B:</strong> ${escapeHtml(item.options.B || '')}</div>
            <div style="padding: 6px 10px; background: rgba(30, 41, 59, 0.6); border-radius: 6px;"><strong>C:</strong> ${escapeHtml(item.options.C || '')}</div>
            <div style="padding: 6px 10px; background: rgba(30, 41, 59, 0.6); border-radius: 6px;"><strong>D:</strong> ${escapeHtml(item.options.D || '')}</div>
          </div>
        `;
      }

      const explanationHTML = item.explanation ? `
        <div class="review-explanation">
          💡 <strong>Explanation / Rationale:</strong> ${escapeHtml(item.explanation)}
        </div>
      ` : '';

      return `
        <div class="${cardClass}">
          <div class="review-card-top">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="q-badge">Question ${item.qno}</span>
              <span class="badge-sec">${escapeHtml(item.category)}</span>
              <span class="${item.type === 'MCQ' ? 'badge-mcq' : 'badge-fib'}">${item.type}</span>
            </div>
            ${statusBadge}
          </div>

          <div class="review-prompt">${escapeHtml(item.question)}</div>

          ${optionsPreview}

          <div class="ans-comparison-box">
            ${answerComparisonHTML}
          </div>

          ${explanationHTML}
        </div>
      `;
    }).join('');
  }

  // Download Answer Key Report as a Printable PDF Document
  function downloadAnswerKeyPDF() {
    if (!state.lastResult) {
      alert('No assessment result found to download.');
      return;
    }

    const { student, testTitle, totalMarks, obtainedMarks, percentage, timeSpentFormatted, submittedAt, evaluations } = state.lastResult;

    const correctCount = evaluations.filter(e => e.isCorrect).length;
    const wrongCount = evaluations.filter(e => !e.isCorrect && !e.isSkipped).length;
    const skippedCount = evaluations.filter(e => e.isSkipped).length;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Popup blocker prevented opening the print report window. Please allow popups for this site.');
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Answer Key & Evaluation Report - ${escapeHtml(student.reg_no)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 30px;
      font-size: 13px;
      line-height: 1.5;
    }
    .header-box {
      border-bottom: 3px double #0284c7;
      padding-bottom: 14px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .inst-title {
      font-size: 18px;
      font-weight: 800;
      color: #0369a1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .inst-sub {
      font-size: 13px;
      color: #475569;
      margin-top: 2px;
    }
    .doc-badge {
      background: #0284c7;
      color: white;
      padding: 6px 14px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 14px;
      margin-bottom: 20px;
    }
    .meta-row { font-size: 13px; }
    .meta-row strong { color: #334155; }
    .score-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .score-tile {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }
    .score-tile.main {
      background: #e0f2fe;
      border-color: #38bdf8;
    }
    .score-tile .val {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
    }
    .score-tile.main .val { color: #0284c7; }
    .score-tile .lbl {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      margin-top: 2px;
    }
    .section-heading {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 14px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    .q-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 14px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .q-card.correct { border-left: 5px solid #10b981; }
    .q-card.wrong { border-left: 5px solid #ef4444; background: #fffaf0; }
    .q-card.skipped { border-left: 5px solid #f59e0b; }
    .q-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .q-num {
      font-weight: 700;
      font-size: 13px;
      color: #1e293b;
    }
    .badge {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge.correct { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .badge.wrong { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .badge.skipped { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .q-prompt {
      font-size: 13.5px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #1e293b;
    }
    .ans-box {
      margin-bottom: 6px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12.5px;
    }
    .ans-box.wrong { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; }
    .ans-box.correct { background: #dcfce7; border: 1px solid #86efac; color: #166534; }
    .ans-box.skipped { background: #fef3c7; border: 1px solid #fde68a; color: #92400e; }
    .explanation {
      margin-top: 8px;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 12px;
      color: #475569;
    }
    .print-actions {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
    }
    .btn-print {
      background: #0284c7;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      font-weight: 700;
      cursor: pointer;
    }
    @media print {
      .print-actions { display: none !important; }
      body { padding: 0; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="header-box">
    <div>
      <div class="inst-title">Technical Assessment Portal</div>
      <div class="inst-sub">Department of Electronics & Communication Engineering</div>
    </div>
    <div class="doc-badge">Official Solution Sheet</div>
  </div>

  <div class="meta-grid">
    <div class="meta-row"><strong>Candidate Name:</strong> ${escapeHtml(student.name)}</div>
    <div class="meta-row"><strong>Register Number:</strong> ${escapeHtml(student.reg_no)}</div>
    <div class="meta-row"><strong>Department & Section:</strong> ${escapeHtml(student.department)} - Section ${escapeHtml(student.section)}</div>
    <div class="meta-row"><strong>Examination:</strong> ${escapeHtml(testTitle)}</div>
    <div class="meta-row"><strong>Time Taken:</strong> ${escapeHtml(timeSpentFormatted)}</div>
    <div class="meta-row"><strong>Date Submitted:</strong> ${new Date(submittedAt).toLocaleString()}</div>
  </div>

  <div class="score-summary">
    <div class="score-tile main">
      <div class="val">${obtainedMarks} / ${totalMarks}</div>
      <div class="lbl">Final Score</div>
    </div>
    <div class="score-tile main">
      <div class="val">${percentage}%</div>
      <div class="lbl">Percentage</div>
    </div>
    <div class="score-tile">
      <div class="val" style="color: #10b981;">${correctCount}</div>
      <div class="lbl">Correct Answers</div>
    </div>
    <div class="score-tile">
      <div class="val" style="color: #ef4444;">${wrongCount + skippedCount}</div>
      <div class="lbl">Wrong / Skipped</div>
    </div>
  </div>

  <div class="section-heading">Detailed Question-by-Question Evaluation & Answer Key</div>

  ${evaluations.map(item => {
    let cardClass = 'q-card ';
    let badge = '';
    let answerBlocks = '';

    if (item.isCorrect) {
      cardClass += 'correct';
      badge = '<span class="badge correct">✔ Correct</span>';
      answerBlocks = `
        <div class="ans-box correct">
          <strong>Your Answer:</strong> ${escapeHtml(item.studentDisplay)} (Correct)
        </div>
      `;
    } else if (item.isSkipped) {
      cardClass += 'skipped';
      badge = '<span class="badge skipped">⚠ Not Answered</span>';
      answerBlocks = `
        <div class="ans-box skipped">
          <strong>Your Answer:</strong> (Candidate Skipped This Question)
        </div>
        <div class="ans-box correct">
          <strong>Correct Answer:</strong> ${escapeHtml(item.correctDisplay)}
        </div>
      `;
    } else {
      cardClass += 'wrong';
      badge = '<span class="badge wrong">✘ Wrong / Incorrect</span>';
      answerBlocks = `
        <div class="ans-box wrong">
          <strong>Your Answer:</strong> ${escapeHtml(item.studentDisplay)} (Incorrect)
        </div>
        <div class="ans-box correct">
          <strong>Correct Answer:</strong> ${escapeHtml(item.correctDisplay)}
        </div>
      `;
    }

    const expBlock = item.explanation ? `
      <div class="explanation"><strong>Explanation:</strong> ${escapeHtml(item.explanation)}</div>
    ` : '';

    return `
      <div class="${cardClass}">
        <div class="q-header">
          <span class="q-num">Q${item.qno}. [${escapeHtml(item.category)}] (${item.type})</span>
          ${badge}
        </div>
        <div class="q-prompt">${escapeHtml(item.question)}</div>
        ${answerBlocks}
        ${expBlock}
      </div>
    `;
  }).join('')}

</body>
</html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();

    setTimeout(() => {
      printWin.focus();
      printWin.print();
    }, 500);
  }

  // Download Answer Key Report as CSV file
  function downloadAnswerKeyCSV() {
    if (!state.lastResult) {
      alert('No assessment result found to download.');
      return;
    }

    const { student, testTitle, totalMarks, obtainedMarks, percentage, timeSpentFormatted, submittedAt, evaluations } = state.lastResult;

    function csvCell(val) {
      if (val === null || val === undefined) return '""';
      const clean = String(val).replace(/"/g, '""');
      return `"${clean}"`;
    }

    const rows = [];
    rows.push([csvCell('TECHNICAL ASSESSMENT - CANDIDATE ANSWER KEY & PERFORMANCE REPORT')]);
    rows.push([csvCell('Candidate Name:'), csvCell(student.name)]);
    rows.push([csvCell('Register Number:'), csvCell(student.reg_no)]);
    rows.push([csvCell('Department:'), csvCell(student.department)]);
    rows.push([csvCell('Section:'), csvCell(student.section)]);
    rows.push([csvCell('Examination Title:'), csvCell(testTitle)]);
    rows.push([csvCell('Obtained Marks:'), csvCell(`${obtainedMarks} / ${totalMarks}`)]);
    rows.push([csvCell('Percentage:'), csvCell(`${percentage}%`)]);
    rows.push([csvCell('Time Taken:'), csvCell(timeSpentFormatted)]);
    rows.push([csvCell('Submitted At:'), csvCell(new Date(submittedAt).toLocaleString())]);
    rows.push([]);
    rows.push([
      csvCell('Question No'),
      csvCell('Category'),
      csvCell('Type'),
      csvCell('Question Prompt'),
      csvCell('Your Answer'),
      csvCell('Evaluation Status'),
      csvCell('Correct Answer'),
      csvCell('Explanation')
    ]);

    evaluations.forEach(item => {
      let statusStr = 'CORRECT';
      if (item.isSkipped) statusStr = 'NOT ANSWERED';
      else if (!item.isCorrect) statusStr = 'WRONG / INCORRECT';

      rows.push([
        csvCell(item.qno),
        csvCell(item.category),
        csvCell(item.type),
        csvCell(item.question),
        csvCell(item.studentDisplay),
        csvCell(statusStr),
        csvCell(item.correctDisplay),
        csvCell(item.explanation)
      ]);
    });

    const csvContent = rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Answer_Key_${student.reg_no}_${student.name.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ========================================================
  // 8. ADMIN DATA & ANALYTICS
  // ========================================================

  async function refreshAdminData() {
    if (typeof SupabaseAPI !== 'undefined' && SupabaseAPI.isConfigured()) {
      const dbStudents = await SupabaseAPI.getAllStudents();
      if (Array.isArray(dbStudents) && dbStudents.length > 0) {
        state.allStudents = dbStudents;
      }

      const dbSubs = await SupabaseAPI.getAllSubmissions();
      if (Array.isArray(dbSubs)) {
        state.submissions = dbSubs;
      }
    }

    const localSubs = JSON.parse(localStorage.getItem('portal_submissions') || '[]');
    if (state.submissions.length === 0 && localSubs.length > 0) {
      state.submissions = localSubs;
    }

    if (metricTotalStudents) metricTotalStudents.textContent = state.allStudents.length;
    if (metricSubmissionsCount) metricSubmissionsCount.textContent = state.submissions.length;
    if (metricQuestionsCount) metricQuestionsCount.textContent = state.questions.length;
    if (dirCountText) dirCountText.textContent = `Showing ${state.allStudents.length} registered candidates`;

    renderStudentDirectory();
    renderAnalytics();
    renderQuestionsPreview();
  }

  function renderStudentDirectory() {
    if (!studentRosterTbody) return;
    const filterSec = filterDirSection ? filterDirSection.value : 'ALL';
    const query = searchDirStudent ? searchDirStudent.value.trim().toLowerCase() : '';

    const filtered = state.allStudents.filter(s => {
      const matchSec = (filterSec === 'ALL') || (s.section === filterSec);
      const matchSearch = !query ||
        s.name.toLowerCase().includes(query) ||
        s.reg_no.toLowerCase().includes(query);
      return matchSec && matchSearch;
    });

    if (dirCountText) dirCountText.textContent = `Showing ${filtered.length} of ${state.allStudents.length} candidates`;

    if (filtered.length === 0) {
      studentRosterTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 24px;">No matching students found.</td></tr>`;
      return;
    }

    studentRosterTbody.innerHTML = filtered.map((s, idx) => `
      <tr>
        <td style="color: #64748b;">${idx + 1}</td>
        <td><strong style="color: #f1f5f9; font-family: monospace;">${s.reg_no}</strong></td>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.department)}</td>
        <td><span class="badge-sec">Sec ${escapeHtml(s.section)}</span></td>
      </tr>
    `).join('');
  }

  function renderAnalytics() {
    if (!sectionProgressCards || !submissionsTbody) return;

    const sections = ['A', 'B', 'C', 'D', 'E', 'F'];

    sectionProgressCards.innerHTML = sections.map(sec => {
      const enrolled = state.allStudents.filter(s => s.section === sec).length;
      const completed = state.submissions.filter(sub => sub.section === sec).length;
      const pct = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0;

      return `
        <div class="stat-card">
          <div class="stat-title">Section ${sec} Progress</div>
          <div class="stat-value" style="font-size: 1.5rem; display: flex; align-items: baseline; gap: 8px;">
            <span>${completed} <span style="font-size: 0.9rem; color: #94a3b8; font-weight: normal;">/ ${enrolled}</span></span>
            <span style="font-size: 0.85rem; color: ${pct === 100 ? '#10b981' : '#60a5fa'}; margin-left: auto;">${pct}%</span>
          </div>
        </div>
      `;
    }).join('');

    if (state.submissions.length === 0) {
      submissionsTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 24px;">No student submissions recorded yet.</td></tr>`;
    } else {
      submissionsTbody.innerHTML = state.submissions.map(sub => `
        <tr>
          <td><strong style="color: #f1f5f9; font-family: monospace;">${sub.reg_no}</strong></td>
          <td>${escapeHtml(sub.student_name)}</td>
          <td>${escapeHtml(sub.department)}</td>
          <td><span class="badge-sec">Sec ${escapeHtml(sub.section)}</span></td>
          <td><strong style="color: #10b981;">${sub.obtained_marks} / ${sub.total_marks}</strong></td>
          <td>${sub.percentage}%</td>
          <td>${new Date(sub.submitted_at).toLocaleString()}</td>
        </tr>
      `).join('');
    }
  }

  // ========================================================
  // 9. HELPERS & UTILITIES
  // ========================================================

  function showCustomAlert(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.className = 'alert alert-danger';
    el.style.display = 'block';
  }

  function hideAlert(el) {
    if (el) el.style.display = 'none';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Run on page ready
  init();

})();
