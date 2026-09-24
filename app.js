// Assessment Portal Main Application Logic
(function () {
  'use strict';

  // State Management
  const state = {
    student: null,
    totalQuestions: (typeof QUESTIONS_BANK !== 'undefined') ? QUESTIONS_BANK.length : 0,
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
  const portalStatusBadge = document.getElementById('portal-status-badge');

  // DOM Elements - No Test Screen
  const noTestScreen = document.getElementById('no-test-screen');
  const noTestName = document.getElementById('no-test-name');
  const noTestRegno = document.getElementById('no-test-regno');
  const noTestDeptSec = document.getElementById('no-test-dept-sec');
  const btnBackToLogin = document.getElementById('btn-back-to-login');

  // Update header status badge on load
  if (portalStatusBadge) {
    if (state.totalQuestions === 0) {
      portalStatusBadge.textContent = '● No Active Assessment';
      portalStatusBadge.style.color = '#f59e0b';
    } else {
      portalStatusBadge.textContent = `● Assessment Active (${state.totalQuestions} Questions)`;
      portalStatusBadge.style.color = '#10b981';
    }
  }

  // ========================================================
  // 1. LOGIN & AUTHENTICATION HANDLERS
  // ========================================================

  // Quick fill helper for swift evaluation & testing
  if (btnQuickFill) {
    btnQuickFill.addEventListener('click', () => {
      const sample = (typeof REGISTERED_STUDENTS !== 'undefined' && REGISTERED_STUDENTS.length > 0)
        ? REGISTERED_STUDENTS[0]
        : {
            reg_no: "922525106001",
            name: "AASHIFA SAHANAJ M",
            department: "ECE",
            section: "A"
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
    if (!student && typeof REGISTERED_STUDENTS !== 'undefined') {
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

      if (!matchedStudent && typeof REGISTERED_STUDENTS !== 'undefined') {
        matchedStudent = REGISTERED_STUDENTS.find(s => s.reg_no.toUpperCase() === regNo);
      }

      if (!matchedStudent) {
        showAlert(`Access Denied: Register Number "${regNo}" was not found in the official roster. Only registered students can access the portal.`);
        btnEnter.disabled = false;
        btnEnter.innerHTML = originalBtnText;
        return;
      }

      // 2. Populate missing fields from roster if needed
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

      // 3. Open Portal View
      showAssessmentScreen();
    } catch (err) {
      console.error('[Login Verification Error]:', err);
      showAlert(`Verification error: ${err.message}. Please try again.`);
      btnEnter.disabled = false;
      btnEnter.innerHTML = originalBtnText;
    }
  });

  // ========================================================
  // 2. DISPLAY SCREEN (NO TEST NOTICE)
  // ========================================================

  function showAssessmentScreen() {
    try {
      // Switch views
      loginView.classList.add('hidden');
      dashboardView.classList.remove('hidden');

      // Populate candidate details safely in the No Test notice
      if (noTestName) noTestName.textContent = state.student.name || 'Candidate';
      if (noTestRegno) noTestRegno.textContent = state.student.reg_no || '';
      if (noTestDeptSec) noTestDeptSec.textContent = `${state.student.department || 'ECE'} • Section ${state.student.section || 'A'}`;

      // Return to Login button handler
      if (btnBackToLogin) {
        btnBackToLogin.onclick = () => {
          dashboardView.classList.add('hidden');
          loginView.classList.remove('hidden');
        };
      }
    } catch (err) {
      console.error('[showAssessmentScreen Error]:', err);
      alert('Error: ' + err.message);
    }
  }

})();
