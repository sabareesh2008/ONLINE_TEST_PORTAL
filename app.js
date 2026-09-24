// Technical Assessment Portal - Main Application Logic (Student & Admin)
(function () {
  'use strict';

  // State Management
  const state = {
    student: null,
    isAdminLoggedIn: sessionStorage.getItem('admin_logged_in') === 'true',
    isTestPublished: localStorage.getItem('portal_test_published') === 'true',
    testTitle: localStorage.getItem('portal_test_title') || 'Technical Assessment 2026',
    testDuration: parseInt(localStorage.getItem('portal_test_duration') || '45', 10),
    allStudents: typeof REGISTERED_STUDENTS !== 'undefined' ? [...REGISTERED_STUDENTS] : [],
    submissions: []
  };

  // DOM Elements - Global
  const portalStatusBadge = document.getElementById('portal-status-badge');
  const btnNavStudent = document.getElementById('btn-nav-student');
  const btnNavAdmin = document.getElementById('btn-nav-admin');

  // Views
  const studentLoginView = document.getElementById('student-login-view');
  const adminLoginView = document.getElementById('admin-login-view');
  const adminDashboardView = document.getElementById('admin-dashboard-view');
  const noTestView = document.getElementById('no-test-view');

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

  // Admin Tab 1 (Publish)
  const publishBannerTitle = document.getElementById('publish-banner-title');
  const publishBannerDesc = document.getElementById('publish-banner-desc');
  const btnTogglePublish = document.getElementById('btn-toggle-publish');
  const adminTestTitleInput = document.getElementById('admin-test-title');
  const adminTestDurationInput = document.getElementById('admin-test-duration');
  const btnSaveTestSettings = document.getElementById('btn-save-test-settings');

  // Admin Tab 2 (Add Student)
  const addStudentForm = document.getElementById('add-student-form');
  const addStudentAlert = document.getElementById('add-student-alert');
  const newRegnoInput = document.getElementById('new-regno');
  const newNameInput = document.getElementById('new-name');
  const newDeptInput = document.getElementById('new-dept');
  const newSectionInput = document.getElementById('new-section');

  // Admin Tab 3 (Directory)
  const dirCountText = document.getElementById('dir-count-text');
  const filterDirSection = document.getElementById('filter-dir-section');
  const searchDirStudent = document.getElementById('search-dir-student');
  const studentRosterTbody = document.getElementById('student-roster-tbody');

  // Admin Tab 4 (Analytics)
  const sectionProgressCards = document.getElementById('section-progress-cards');
  const submissionsTbody = document.getElementById('submissions-tbody');

  // ========================================================
  // 1. INITIALIZATION & VIEW CONTROLLER
  // ========================================================

  function init() {
    updateStatusBadge();
    setupNavigation();
    setupStudentAuth();
    setupAdminAuth();
    setupAdminDashboard();

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
    if (state.isTestPublished) {
      portalStatusBadge.className = 'status-badge active';
      portalStatusBadge.textContent = '● Test Published & Active';
      if (metricTestStatus) {
        metricTestStatus.textContent = 'Published';
        metricTestStatus.style.color = '#10b981';
      }
      if (publishBannerTitle) publishBannerTitle.textContent = 'Current State: Published (Live)';
      if (publishBannerDesc) publishBannerDesc.textContent = 'Students can now enter their register number and access the test.';
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
  }

  function showView(targetView) {
    [studentLoginView, adminLoginView, adminDashboardView, noTestView].forEach(v => {
      if (v) v.classList.add('hidden');
    });
    if (targetView) targetView.classList.remove('hidden');
  }

  function setupNavigation() {
    // Student Tab Button
    btnNavStudent.addEventListener('click', () => {
      btnNavStudent.classList.add('active');
      btnNavAdmin.classList.remove('active');
      showView(studentLoginView);
    });

    // Admin Tab Button
    btnNavAdmin.addEventListener('click', () => {
      btnNavAdmin.classList.add('active');
      btnNavStudent.classList.remove('active');
      if (state.isAdminLoggedIn) {
        showView(adminDashboardView);
        refreshAdminData();
      } else {
        showView(adminLoginView);
      }
    });

    // Back to Home from No-Test screen
    if (btnBackToHome) {
      btnBackToHome.addEventListener('click', () => {
        showView(studentLoginView);
        btnNavStudent.classList.add('active');
        btnNavAdmin.classList.remove('active');
      });
    }
  }

  // ========================================================
  // 2. STUDENT LOGIN & VERIFICATION
  // ========================================================

  function setupStudentAuth() {
    // Quick test helper
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

    // Auto-fill on register number blur/input
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

    // Form Submit
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
        // 1. Verify against Supabase Cloud or Local CSV roster
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

        // 2. Populate details
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

        // 3. Test Published Check
        // If test is not published or no questions assigned, show No Test Screen
        if (!state.isTestPublished || typeof QUESTIONS_BANK === 'undefined' || QUESTIONS_BANK.length === 0) {
          noTestName.textContent = state.student.name;
          noTestRegno.textContent = state.student.reg_no;
          noTestDeptSec.textContent = `${state.student.department} • Section ${state.student.section}`;
          showView(noTestView);
          return;
        }

        // When questions are ready in the future, start assessment here
        alert(`Candidate ${state.student.name} authenticated successfully!`);
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

      // Secure Default Credentials (can be configured)
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

    // Admin Logout
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
    // 1. Tab Navigation inside Admin Panel
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

        if (targetId === 'admin-tab-directory') renderStudentDirectory();
        if (targetId === 'admin-tab-analytics') renderAnalytics();
      });
    });

    // 2. Publish / Unpublish Toggle
    if (btnTogglePublish) {
      btnTogglePublish.addEventListener('click', () => {
        state.isTestPublished = !state.isTestPublished;
        localStorage.setItem('portal_test_published', state.isTestPublished ? 'true' : 'false');
        updateStatusBadge();
        alert(state.isTestPublished 
          ? 'Assessment is now PUBLISHED! Students can take the test.' 
          : 'Assessment has been UNPUBLISHED! Students will see "There is no test right now".'
        );
      });
    }

    // 3. Save Test Settings (Title & Duration)
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

    // 4. Add Student Form
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

        // Check if student already exists
        const exists = state.allStudents.find(s => s.reg_no.toUpperCase() === regno);
        if (exists) {
          showCustomAlert(addStudentAlert, `Student with Register Number ${regno} already exists in the roster.`);
          return;
        }

        const newStudent = { reg_no: regno, name, department: dept, section: sec };

        // Save to Supabase Cloud if configured
        if (typeof SupabaseAPI !== 'undefined' && SupabaseAPI.isConfigured()) {
          const res = await SupabaseAPI.addStudent(newStudent);
          if (!res.success) {
            console.warn('[Supabase Add Student Warning]:', res.error);
          }
        }

        // Add to local state
        state.allStudents.unshift(newStudent);
        addStudentAlert.className = 'alert alert-success';
        addStudentAlert.textContent = `Student ${name} (${regno}) added successfully to the database!`;
        addStudentAlert.style.display = 'block';

        // Reset form inputs
        newRegnoInput.value = '';
        newNameInput.value = '';

        // Update metrics
        refreshAdminData();
      });
    }

    // 5. Directory Search & Filters
    if (filterDirSection) {
      filterDirSection.addEventListener('change', renderStudentDirectory);
    }
    if (searchDirStudent) {
      searchDirStudent.addEventListener('input', renderStudentDirectory);
    }
  }

  // Refresh all admin metrics & lists
  async function refreshAdminData() {
    // 1. Fetch live students from Supabase if connected
    if (typeof SupabaseAPI !== 'undefined' && SupabaseAPI.isConfigured()) {
      const dbStudents = await SupabaseAPI.getAllStudents();
      if (Array.isArray(dbStudents) && dbStudents.length > 0) {
        state.allStudents = dbStudents;
      }

      // Fetch live submissions
      const dbSubs = await SupabaseAPI.getAllSubmissions();
      if (Array.isArray(dbSubs)) {
        state.submissions = dbSubs;
      }
    }

    // 2. Fallback to localStorage submissions if any
    const localSubs = JSON.parse(localStorage.getItem('portal_submissions') || '[]');
    if (state.submissions.length === 0 && localSubs.length > 0) {
      state.submissions = localSubs;
    }

    // 3. Update Metrics
    if (metricTotalStudents) metricTotalStudents.textContent = state.allStudents.length;
    if (metricSubmissionsCount) metricSubmissionsCount.textContent = state.submissions.length;
    if (dirCountText) dirCountText.textContent = `Showing ${state.allStudents.length} registered candidates`;

    renderStudentDirectory();
    renderAnalytics();
  }

  // Render Student Directory Table
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
        <td>${s.name}</td>
        <td>${s.department}</td>
        <td><span class="badge-sec">Sec ${s.section}</span></td>
      </tr>
    `).join('');
  }

  // Render Section Analytics & Submissions
  function renderAnalytics() {
    if (!sectionProgressCards || !submissionsTbody) return;

    // Sections A through F
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

    // Submissions table
    if (state.submissions.length === 0) {
      submissionsTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 24px;">No student submissions recorded yet.</td></tr>`;
    } else {
      submissionsTbody.innerHTML = state.submissions.map(sub => `
        <tr>
          <td><strong style="color: #f1f5f9; font-family: monospace;">${sub.reg_no}</strong></td>
          <td>${sub.student_name}</td>
          <td>${sub.department}</td>
          <td><span class="badge-sec">Sec ${sub.section}</span></td>
          <td><strong style="color: #10b981;">${sub.obtained_marks} / ${sub.total_marks}</strong></td>
          <td>${sub.percentage}%</td>
          <td>${new Date(sub.submitted_at).toLocaleString()}</td>
        </tr>
      `).join('');
    }
  }

  // Helper alert functions
  function showCustomAlert(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.className = 'alert alert-danger';
    el.style.display = 'block';
  }

  function hideAlert(el) {
    if (el) el.style.display = 'none';
  }

  // Run on load
  init();

})();
