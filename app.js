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
    examStartTime: null
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
      // Do not interrupt active exam without prompt
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
        // Clear login fields
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

        // Parse sheet to JSON array
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

        // Count types
        const mcqCount = parsedQuestions.filter(q => q.type === 'MCQ').length;
        const fibCount = parsedQuestions.filter(q => q.type === 'FIB').length;

        questionUploadAlert.className = 'alert alert-success';
        questionUploadAlert.textContent = `Successfully processed ${parsedQuestions.length} questions (${mcqCount} MCQ, ${fibCount} Fill in the Blanks) from "${file.name}"!`;
        questionUploadAlert.style.display = 'block';

        renderQuestionsPreview();
        updateStatusBadge();

        // Reset file input
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
      // Normalize object keys to lowercase trimmed
      const row = {};
      Object.keys(rawRow).forEach(k => {
        row[k.trim().toLowerCase()] = String(rawRow[k]).trim();
      });

      // Find question text
      const questionText = row['question'] || row['question text'] || row['prompt'] || row['q'] || '';
      if (!questionText) return; // skip row if no question text

      // Determine Type (MCQ or FIB)
      const rawType = (row['type'] || row['question type'] || '').toUpperCase();
      let type = 'MCQ';

      if (rawType.includes('FIB') || rawType.includes('BLANK') || rawType.includes('FILL')) {
        type = 'FIB';
      } else if (!row['option a'] && !row['option b'] && (questionText.includes('___') || questionText.includes('...'))) {
        type = 'FIB';
      }

      // Category
      const category = row['category'] || row['subject'] || row['topic'] || 'General';

      // Correct Answer
      const rawCorrect = row['correct answer'] || row['correct'] || row['answer'] || row['correct_answer'] || '';

      // Explanation
      const explanation = row['explanation'] || row['solution'] || row['reason'] || '';

      if (type === 'MCQ') {
        const optionA = row['option a'] || row['option_a'] || row['a'] || '';
        const optionB = row['option b'] || row['option_b'] || row['b'] || '';
        const optionC = row['option c'] || row['option_c'] || row['c'] || '';
        const optionD = row['option d'] || row['option_d'] || row['d'] || '';

        // Normalize correct answer for MCQ: letter 'A', 'B', 'C', 'D'
        let cleanCorrect = rawCorrect.toUpperCase();
        if (!['A', 'B', 'C', 'D'].includes(cleanCorrect)) {
          // Check if correct answer matches option text
          if (cleanCorrect === optionA.toUpperCase()) cleanCorrect = 'A';
          else if (cleanCorrect === optionB.toUpperCase()) cleanCorrect = 'B';
          else if (cleanCorrect === optionC.toUpperCase()) cleanCorrect = 'C';
          else if (cleanCorrect === optionD.toUpperCase()) cleanCorrect = 'D';
          else cleanCorrect = 'A'; // fallback default
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
        // FIB type
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

    // Attach delete listeners
    document.querySelectorAll('.btn-delete-q').forEach(btn => {
      btn.addEventListener('click', (e) => {
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
    // Navigation inside exam
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
          // Last question -> offer submission
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

  // Start assessment for authenticated student
  function startAssessment() {
    if (!state.student || state.questions.length === 0) return;

    // Initialize responses
    state.examAnswers = {};
    state.questions.forEach((q, idx) => {
      state.examAnswers[idx] = { answer: '', isReview: false };
    });

    state.examCurrentIndex = 0;
    state.examStartTime = new Date();
    state.examSecondsLeft = (state.testDuration || 45) * 60;

    // Populate header details
    if (examAvatar) examAvatar.textContent = (state.student.name || 'S').charAt(0).toUpperCase();
    if (examStudentName) examStudentName.textContent = state.student.name;
    if (examStudentMeta) examStudentMeta.textContent = `${state.student.department} • Section ${state.student.section} • ${state.student.reg_no}`;

    // Show Exam View
    showView(examView);

    // Render palette buttons
    renderPaletteGrid();

    // Render question 0
    renderExamQuestion(0);

    // Start Timer
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

  // Render question at index
  function renderExamQuestion(index) {
    const q = state.questions[index];
    if (!q) return;

    // Meta bar
    if (examQIndex) examQIndex.textContent = `Question ${index + 1} of ${state.questions.length}`;
    if (examQCategory) examQCategory.textContent = q.category || 'General';

    if (examQTypeBadge) {
      examQTypeBadge.className = q.type === 'MCQ' ? 'badge-mcq' : 'badge-fib';
      examQTypeBadge.textContent = q.type === 'MCQ' ? 'Multiple Choice' : 'Fill in the Blank';
    }

    const currAns = state.examAnswers[index] || { answer: '', isReview: false };

    // Mark review button status
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

    // Question Text
    if (examQuestionText) examQuestionText.textContent = q.question;

    // Render MCQ or FIB input
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

        // Attach click listeners to option cards
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
      // FIB
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

    // Next / Prev button states
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

  // Render palette grid
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

  // Student clicks submit or finishes
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

  // Evaluation & Result generation
  async function finalizeSubmission() {
    let correctCount = 0;
    const totalQ = state.questions.length;
    const incorrectRecords = [];

    state.questions.forEach((q, idx) => {
      const resp = state.examAnswers[idx] || { answer: '' };
      const studentAns = (resp.answer || '').trim();
      let isCorrect = false;

      if (q.type === 'MCQ') {
        isCorrect = (studentAns.toUpperCase() === q.correctAnswer.toUpperCase());
      } else {
        // FIB: Case-insensitive trimmed check
        isCorrect = (studentAns.toLowerCase() === q.correctAnswer.trim().toLowerCase());
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
    });

    const totalMarks = totalQ;
    const obtainedMarks = correctCount;
    const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(1) : 0;

    // Calculate time taken
    const totalSecondsAllocated = (state.testDuration || 45) * 60;
    const timeSpentSeconds = Math.max(1, totalSecondsAllocated - state.examSecondsLeft);
    const timeSpentMins = Math.floor(timeSpentSeconds / 60);
    const timeSpentSecs = timeSpentSeconds % 60;

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

    // Populate Results View
    if (resStudentName) resStudentName.textContent = state.student.name;
    if (resStudentMeta) resStudentMeta.textContent = `${state.student.department} • Section ${state.student.section} • ${state.student.reg_no}`;
    if (resMarksObtained) resMarksObtained.textContent = `${obtainedMarks} / ${totalMarks}`;
    if (resPercentage) {
      resPercentage.textContent = `${percentage}%`;
      resPercentage.style.color = percentage >= 50 ? '#10b981' : '#ef4444';
    }
    if (resTotalQ) resTotalQ.textContent = totalQ;
    if (resCorrectQ) resCorrectQ.textContent = correctCount;
    if (resTimeSpent) resTimeSpent.textContent = `${timeSpentMins}m ${timeSpentSecs}s`;

    // Show Results View
    showView(resultView);
  }

  // ========================================================
  // 7. ADMIN DATA & ANALYTICS
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
  // 8. HELPERS & UTILITIES
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
